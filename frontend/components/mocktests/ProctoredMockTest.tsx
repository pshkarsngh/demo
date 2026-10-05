"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Lock,
  Maximize2,
  Mic,
  MinusCircle,
  MonitorUp,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { getTestQuestions, isNumericQuestion, resolveMarks } from "@/lib/data/mockTests";
import type { MockTest, MockTestQuestion } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";
import { TestSetupScreen } from "@/components/mocktests/TestSetupScreen";
import { TestResultScreen } from "@/components/mocktests/TestResultScreen";
import {
  MAX_VIOLATIONS,
  type AnswerState,
  type BuildResult,
  type PermissionStatus,
  type Stage,
  type Violation,
} from "@/components/mocktests/types";

/** Capabilities the proctor bar reports on, keyed against `PermissionStatus`. */
const FOCUS_INDICATORS = [
  { key: "camera", label: "Camera", icon: Eye },
  { key: "mic", label: "Mic", icon: Mic },
  { key: "screen", label: "Screen", icon: MonitorUp },
  { key: "fullscreen", label: "Full screen", icon: Maximize2 },
] satisfies ReadonlyArray<{
  key: keyof PermissionStatus;
  label: string;
  icon: typeof Eye;
}>;

/**
 * True only when the shared display surface covers a whole screen.
 *
 * `displaySurface` is the authoritative signal: the browser sets it to
 * `"monitor"` when the student picked an entire screen, and to `"window"` or
 * `"browser"` when they picked a single window or tab.
 *
 * The old check compared the track's `width`/`height` against
 * `window.screen.width`/`height`, which can never be right on a scaled display.
 * Track settings are in **device pixels**; `window.screen` is in **CSS pixels**.
 * At 125% scaling a 1920x1080 panel reports `window.screen` as 1536x864, so
 * picking "Entire screen" returned 1920x1080, failed the equality test, and the
 * track was stopped and reported as denied. Every student on a scaled display —
 * which is most of them — was told to retry a choice they had already made
 * correctly.
 *
 * The size comparison is kept only as a fallback for browsers that do not
 * populate `displaySurface`, and it now divides by the device pixel ratio
 * instead of assuming the two spaces are the same.
 */
function isWholeScreen(stream: MediaStream): boolean {
  try {
    const settings = stream.getVideoTracks()[0]?.getSettings();
    if (!settings) return false;
    const surface = (settings as { displaySurface?: string }).displaySurface;
    if (surface) return surface === "monitor";
    const dpr = window.devicePixelRatio || 1;
    const w = window.screen.width * dpr;
    const h = window.screen.height * dpr;
    // 2px of slack absorbs the rounding in scaled track dimensions.
    return (
      Math.abs((settings.width ?? 0) - w) <= 2 && Math.abs((settings.height ?? 0) - h) <= 2
    );
  } catch {
    return false;
  }
}

/**
 * Parses a numeric answer. Returns null for anything that is not a finite
 * number, so a blank or half-typed field counts as unattempted rather than
 * silently grading as 0. Fractions like "1/2" are not accepted — every
 * numerical question in this project has an integer key.
 */
function parseNumeric(raw: string | undefined): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** True when a question has been given an answer, of either kind. */
function isAnswered(q: MockTestQuestion, a: AnswerState | undefined): boolean {
  if (!a) return false;
  if (isNumericQuestion(q)) return parseNumeric(a.numeric) !== null;
  return a.selected !== undefined && a.selected !== null;
}

/**
 * Mock-test runner.
 *
 * Owns all session state and effects (permissions, timer, focus-violation
 * detection, question navigation, scoring). The two large screens are split out
 * into `TestSetupScreen` and `TestResultScreen`; shared types live in `types.ts`.
 */
export function ProctoredMockTest({ test }: { test: MockTest }) {
  const { addTestResult } = useApp();

  const [stage, setStage] = useState<Stage>("setup");
  const [perms, setPerms] = useState<PermissionStatus>({
    camera: "pending",
    mic: "pending",
    screen: "pending",
    fullscreen: "pending",
  });

  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [current, setCurrent] = useState(0);
  /** Question indexes the student has actually opened. Drives the palette. */
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [warnOpen, setWarnOpen] = useState(false);
  const [lastWarning, setLastWarning] = useState<Violation | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  /** Held apart from `cameraStreamRef` so the two can be granted independently. */
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenSurfaceIssueRef = useRef(false);
  const fullscreenIssueRef = useRef(false);

  const stageRef = useRef<Stage>("setup");
  const timeLeftRef = useRef(0);
  const answersRef = useRef<Record<string, AnswerState>>({});
  const questionsRef = useRef<MockTestQuestion[]>([]);
  const violationsRef = useRef<Violation[]>([]);
  const finishTestRef = useRef<() => void>(() => {});
  const startedAtRef = useRef(0);
  /**
   * Whether the student opted into focus mode.
   *
   * Read by `registerViolation` and by the proctor bar. Held in a ref because
   * `registerViolation` is a `useCallback` with an empty dependency list and
   * must stay stable — the timer interval and the listener effect both take it
   * as a dependency, so closing over the state directly would tear down and
   * rebuild the one-second interval on every keystroke in a numeric field.
   */
  const focusModeRef = useRef(false);
  /** Render-facing mirror of `focusModeRef`; see the note there. */
  const [focusModeOn, setFocusModeOn] = useState(false);
  /** Mirror of `perms` for the same reason: read inside the interval. */
  const permsRef = useRef<PermissionStatus>(perms);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);
  useEffect(() => {
    permsRef.current = perms;
  }, [perms]);

  const cleanupMedia = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    micStreamRef.current = null;
    screenStreamRef.current = null;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Attach camera preview once stream changes
  useEffect(() => {
    if (videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [perms.camera, perms.mic]);
  const attachVideoNode = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && cameraStreamRef.current) el.srcObject = cameraStreamRef.current;
  }, []);

  // Face-lighting analysis is not implemented: it was scaffolded as state and a
  // canvas ref but never wired to a detection loop, so it only produced dead
  // warnings. Proctoring ML is Phase 51 and is not available yet.

  const stopScreenSharingEvent = useCallback(() => {
    const t = screenStreamRef.current?.getVideoTracks()[0];
    if (t) t.onended = null;
  }, []);

  // ---------- Violations ----------
  /**
   * Count a focus violation.
   *
   * Returns immediately unless focus mode is actually armed. That guard is the
   * difference between a study aid and a data-loss bug: at
   * `MAX_VIOLATIONS` this calls `finishTest`, which submits the attempt. An
   * operating-system notification, a password manager, or a single alt-tab
   * away from the test all fire `blur`, and before focus mode was optional
   * that meant a student who had declined proctoring could have their paper
   * submitted out from under them by something outside the browser. Nobody
   * consents to that by clicking "Begin test" on a practice paper.
   */
  const registerViolation = useCallback((reason: string) => {
    if (stageRef.current !== "running") return;
    if (!focusModeRef.current) return;
    const remaining = timeLeftRef.current;
    const viol: Violation = { reason, at: new Date(), remaining };
    const next = [...violationsRef.current, viol];
    setViolations(next);
    setLastWarning(viol);
    if (next.length >= MAX_VIOLATIONS) {
      setWarnOpen(false);
      finishTestRef.current();
    } else {
      setWarnOpen(true);
    }
  }, []);

  // ---------- Setup: opt into focus mode ----------
  /**
   * Focus mode is best-effort throughout.
   *
   * Every branch below ends in a permission *state*, never in a throw, because
   * the one thing this function used to get wrong was fatal: `navigator.mediaDevices`
   * is undefined outright on an insecure origin and on some embedded browsers,
   * so the unguarded `.getUserMedia` call rejected the whole `Promise.all` and
   * left the setup screen stuck on "Waiting…" with no path forward. The exam
   * does not need any of this, so a missing API is now reported as
   * `unavailable` and the student can still begin.
   */
  const requestSetup = useCallback(async () => {
    // One accumulator, one state write. The four `setPerms` calls this used to
    // make raced each other, so the setup screen could settle on a state that
    // mixed a fresh answer with a stale one.
    const next: PermissionStatus = {
      camera: "pending",
      mic: "pending",
      screen: "pending",
      fullscreen: "pending",
    };
    setPerms(next);

    const media = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;

    const fsPromise = document.documentElement?.requestFullscreen
      ? document.documentElement
          .requestFullscreen()
          .then(() => {
            next.fullscreen = "granted";
          })
          .catch(() => {
            next.fullscreen = "denied";
          })
      : Promise.resolve().then(() => {
          next.fullscreen = "unavailable";
        });

    const camPromise = !media?.getUserMedia
      ? Promise.resolve().then(() => {
          next.camera = "unavailable";
        })
      : media
          .getUserMedia({ video: true })
          .then((stream) => {
            cameraStreamRef.current = stream;
            next.camera = "granted";
          })
          .catch(() => {
            next.camera = "denied";
          });

    // Asked separately from the camera. A single `getUserMedia({ video: true,
    // audio: true })` promises both or neither: one busy webcam took the
    // microphone down with it, and the student saw two Blocked rows with no
    // way to tell which device was at fault.
    const micPromise = !media?.getUserMedia
      ? Promise.resolve().then(() => {
          next.mic = "unavailable";
        })
      : media
          .getUserMedia({ audio: true })
          .then((stream) => {
            micStreamRef.current = stream;
            next.mic = "granted";
          })
          .catch(() => {
            next.mic = "denied";
          });

    // Fired synchronously so every prompt keeps transient user activation
    const scrPromise = !media?.getDisplayMedia
      ? Promise.resolve().then(() => {
          next.screen = "unavailable";
        })
      : media
          .getDisplayMedia({ video: true })
          .then((stream) => {
            if (!isWholeScreen(stream)) {
              stream.getTracks().forEach((t) => t.stop());
              setScreenError(
                "You must share your ENTIRE screen, not just one window or browser tab. Please pick ‘Entire screen / Full screen’ and try again.",
              );
              next.screen = "denied";
              return;
            }
            screenStreamRef.current = stream;
            screenSurfaceIssueRef.current = false;
            setScreenError(null);
            next.screen = "granted";
            stream.getVideoTracks()[0].onended = () => {
              stopScreenSharingEvent();
              if (stageRef.current === "running") {
                registerViolation("Screen sharing was stopped");
              }
            };
          })
          .catch(() => {
            next.screen = "denied";
          });

    await Promise.all([fsPromise, camPromise, micPromise, scrPromise]);

    // Arm focus mode only if something actually came up. Opting in and having
    // every capability refused leaves it off, which is the honest reading of
    // "I turned it on and the browser said no" — and it means no violation
    // counting, rather than a test that counts violations it can never detect.
    focusModeRef.current = Object.values(next).some((s) => s === "granted");
    setFocusModeOn(focusModeRef.current);
    setPerms({ ...next });
  }, [stopScreenSharingEvent, registerViolation]);

  // ---------- Timer ----------
  useEffect(() => {
    if (stage !== "running") return;
    timerRef.current = setInterval(() => {
      const screen = screenStreamRef.current;
      if (screen) {
        const surface = (screen.getVideoTracks()[0]?.getSettings() ?? {}) as { displaySurface?: string };
        if (surface.displaySurface && surface.displaySurface !== "monitor" && !screenSurfaceIssueRef.current) {
          screenSurfaceIssueRef.current = true;
          registerViolation("Screen share no longer covers the entire screen");
        }
      }
      // Only meaningful if the student ever entered fullscreen. Without this
      // guard, running the test windowed — the normal case, now that focus
      // mode is optional — logged a "You exited full-screen mode" violation
      // within the first second of every single attempt.
      if (
        permsRef.current.fullscreen === "granted" &&
        !document.fullscreenElement &&
        !fullscreenIssueRef.current
      ) {
        fullscreenIssueRef.current = true;
        registerViolation("You exited full-screen mode");
      }
      setTimeLeft((prev) => {
        const n = prev - 1;
        if (n <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishTestRef.current();
          return 0;
        }
        return n;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, registerViolation]);

  // ---------- Proctoring event listeners + cleanup ----------
  useEffect(() => {
    if (stage !== "running") return;

    const onVisibility = () => {
      if (document.hidden) registerViolation("You switched away from the test tab");
    };
    const onBlur = () => {
      registerViolation("You switched to another window or application");
      window.focus();
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
    };
  }, [stage, registerViolation]);

  // Warn before leaving mid-test
  useEffect(() => {
    if (stage !== "running") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [stage]);

  // Release everything on final unmount
  useEffect(() => cleanupMedia, [cleanupMedia]);

  // ---------- Test control ----------
  function buildResult(t: MockTest, qs: MockTestQuestion[], ans: Record<string, AnswerState>, seconds: number): BuildResult {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const topicPerf: Record<string, { correct: number; total: number }> = {};
    qs.forEach((q) => {
      topicPerf[q.topic] ??= { correct: 0, total: 0 };
      topicPerf[q.topic].total += 1;
      const a = ans[q.id];
      if (!isAnswered(q, a)) {
        unattempted++;
        return;
      }
      const ok = isNumericQuestion(q)
        ? parseNumeric(a?.numeric) === q.numericAnswer
        : a?.selected === q.correctIndex;
      if (ok) {
        correct++;
        topicPerf[q.topic].correct += 1;
      } else incorrect++;
    });
    const marks = resolveMarks(t);
    const score = correct * marks.correct - incorrect * marks.wrong;
    const maxScore = qs.length * marks.correct;
    const timeTakenSec = t.durationMins * 60 - seconds;
    return { correct, incorrect, unattempted, score, maxScore, timeTakenSec, topicPerf };
  }

  const finishTest = useCallback(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const t = test;
      const qs = questionsRef.current;
      const ans = answersRef.current;
      const remaining = timeLeftRef.current;
      const res = buildResult(t, qs, ans, remaining);
      cleanupMedia();
      setResult(res);
      setStage("result");
      addTestResult({
        id: `tr-${Date.now()}`,
        testId: t.id,
        testSlug: t.slug,
        testTitle: t.title,
        exam: t.exam,
        date: new Date().toISOString().slice(0, 10),
        total: qs.length,
        correct: res.correct,
        incorrect: res.incorrect,
        unattempted: res.unattempted,
        timeTakenSec: res.timeTakenSec,
        score: Math.max(0, res.score),
        maxScore: res.maxScore,
        topicPerformance: res.topicPerf,
      });
    }, [test, addTestResult, cleanupMedia]);
  useEffect(() => {
    finishTestRef.current = finishTest;
  });

  const beginTest = useCallback(() => {
    // The guard that used to live here --
    //   if (!cameraStreamRef.current || !screenStreamRef.current) return;
    // -- was the other half of the dead end. The setup screen disabled its
    // button without these streams, so this bailed silently too; with the
    // button always live, a student without a webcam clicked "Begin test" and
    // watched absolutely nothing happen, because the click was discarded here
    // for a reason the UI no longer mentions. Focus mode now gates on
    // consent, not on hardware.
    setQuestions(getTestQuestions(test));
    setAnswers({});
    setCurrent(0);
    setVisited(new Set([0]));
    setTimeLeft(test.durationMins * 60);
    setResult(null);
    setShowSolutions(false);
    setViolations([]);
    setWarnOpen(false);
    fullscreenIssueRef.current = false;
    screenSurfaceIssueRef.current = false;
    violationsRef.current = [];
    // Fullscreen is still worth entering when it is available and we got it
    // during setup, but a refusal here is not an error -- the student is
    // already in the exam by this point.
    if (focusModeRef.current && !document.fullscreenElement) {
      try {
        const p = document.documentElement.requestFullscreen?.();
        if (p instanceof Promise) p.catch(() => {});
      } catch {
        // full screen entry is best-effort here
      }
    }
    startedAtRef.current = Date.now();
    setStage("running");
  }, [test]);

  // ---------- ANSWER HELPERS ----------
  /**
   * The only way to move between questions.
   *
   * Every navigation path goes through here so a question is never opened
   * without being recorded as visited -- otherwise the palette cannot tell
   * "skipped" from "unseen", which is the one distinction it exists to make.
   */
  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, index);
    setCurrent(clamped);
    setVisited((prev) => (prev.has(clamped) ? prev : new Set(prev).add(clamped)));
  }, []);

  const selectAnswer = (qi: number, optionIdx: number) => {
    const q = questions[qi];
    setAnswers((prev) => ({
      ...prev,
      [q.id]: {
        ...(prev[q.id] ?? { selected: null, marked: false }),
        selected: optionIdx === prev[q.id]?.selected ? null : optionIdx,
      },
    }));
  };

  const toggleMark = (qi: number) => {
    const q = questions[qi];
    setAnswers((prev) => {
      const cur = prev[q.id] ?? { selected: null, marked: false };
      return { ...prev, [q.id]: { ...cur, marked: !cur.marked } };
    });
  };

  const setNumericAnswer = (qi: number, raw: string) => {
    const q = questions[qi];
    setAnswers((prev) => ({
      ...prev,
      [q.id]: {
        ...(prev[q.id] ?? { selected: null, marked: false }),
        numeric: raw,
      },
    }));
  };

  /**
   * Palette state for one question.
   *
   * The `"unanswered"` arm used to be unreachable: the function returned
   * `"not-visited"` for anything without an answer, so a question the student
   * had looked at and left blank was indistinguishable from one they had never
   * opened, and the palette's own legend ("Not answered", orange) could never
   * appear. That distinction is the entire point of the legend -- it is how you
   * find the questions you skipped -- so `"unanswered"` now keys off `visited`.
   */
  const answerStatus = (qi: number): "answered" | "marked" | "unanswered" | "not-visited" => {
    const q = questions[qi];
    const a = answers[q?.id];
    if (a?.marked) return "marked";
    if (isAnswered(q, a)) return "answered";
    return visited.has(qi) ? "unanswered" : "not-visited";
  };

  const answeredCount = useMemo(
    () => questions.filter((q) => isAnswered(q, answers[q.id])).length,
    [answers, questions],
  );
  const markedCount = useMemo(() => questions.filter((q) => answers[q.id]?.marked).length, [answers, questions]);

  if (stage === "setup") {
    return (
      <TestSetupScreen
        test={test}
        perms={perms}
        screenError={screenError}
        onRequestSetup={requestSetup}
        onBegin={beginTest}
      />
    );
  }

  if (stage === "result" && result) {
    return (
      <TestResultScreen
        test={test}
        result={result}
        questions={questions}
        answers={answers}
        violations={violations}
        showSolutions={showSolutions}
        onToggleSolutions={() => setShowSolutions((v) => !v)}
        onRestart={cleanupMedia}
      />
    );
  }


  const q = questions[current];
  const mm = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const hh = String(Math.floor(timeLeft / 3600)).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[100] select-none overflow-hidden bg-slate-100 dark:bg-[#090d16]">
      {/* Proctor bar */}
      <div className="flex items-center justify-between gap-3 border-b border-red-900/40 bg-slate-950 px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          {focusModeOn ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <span className="tracking-widest text-red-400">REC</span>
            </>
          ) : (
            <>
              {/* Nothing is recording, so nothing may claim to be. The bar used
                  to render a pulsing red dot and a green tick beside all four
                  labels unconditionally, which told a student running the test
                  windowed with no camera that they were being recorded. */}
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
              <span className="tracking-wide text-slate-400">Focus mode off</span>
            </>
          )}
          {FOCUS_INDICATORS.map(({ key, label, icon }) => {
            const live = perms[key] === "granted";
            return (
              <span
                key={key}
                className={cn(
                  "hidden items-center gap-1 sm:flex",
                  live ? "text-slate-300" : "text-slate-600 line-through",
                )}
                title={
                  live
                    ? `${label} is on`
                    : `${label} is off — focus mode only checks what it can see`
                }
              >
                {live ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <MinusCircle className="h-3.5 w-3.5" />
                )}{" "}
                {label}
              </span>
            );
          })}
        </div>
        {violations.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">
            <ShieldAlert className="h-3 w-3" /> {violations.length}/{MAX_VIOLATIONS} warnings
          </span>
        )}
      </div>

      <div className="mx-auto flex h-[calc(100%-40px)] max-w-6xl flex-col overflow-hidden p-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{test.title}</p>
            <p className="text-xs text-slate-400 dark:text-slate-400">
              Question {current + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 dark:border dark:border-purple-800/50 px-3 py-1.5 text-sm font-bold tabular-nums">
              <Timer className="h-4 w-4" /> {hh}:{mm}:{ss}
            </span>
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              Submit
            </Button>
          </div>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_260px]">
          {/* Question */}
          <div className="overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <Badge variant="purple">
                Q{current + 1} · {q.topic}
                {isNumericQuestion(q) ? " · Numerical" : ""}
              </Badge>
              <button
                type="button"
                onClick={() => toggleMark(current)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition",
                  answers[q.id]?.marked
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-600",
                )}
              >
                <Flag className="h-3.5 w-3.5" /> {answers[q.id]?.marked ? "Marked" : "Mark for review"}
              </button>
            </div>
            <p className="mt-4 text-base font-bold leading-relaxed text-gray-900 dark:text-white sm:text-lg">{q.text}</p>
            <div className="mt-5 space-y-2.5">
              {isNumericQuestion(q) ? (
                <div>
                  <label
                    htmlFor={`numeric-${q.id}`}
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  >
                    Numerical answer
                  </label>
                  <input
                    id={`numeric-${q.id}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={answers[q.id]?.numeric ?? ""}
                    onChange={(e) => setNumericAnswer(current, e.target.value)}
                    placeholder="Enter a number"
                    className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold tabular-nums text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Enter the nearest integer. Leave blank to skip this question.
                  </p>
                </div>
              ) : (
                q.options.map((opt, i) => {
                  const selected = answers[q.id]?.selected === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectAnswer(current, i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                        selected
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 font-semibold"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-700",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold",
                          selected
                            ? "border-purple-600 bg-purple-600 text-white"
                            : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="ghost" disabled={current === 0} onClick={() => goTo(current - 1)} className="dark:text-slate-300 dark:hover:bg-slate-800">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="secondary" onClick={() => goTo(current + 1)}>
                {current === questions.length - 1 ? "Review" : "Next"} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Palette */}
          <div className="overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Question palette</h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">{answeredCount + markedCount}/{questions.length}</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {questions.map((qq, i) => {
                const st = answerStatus(i);
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition",
                      i === current ? "ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-slate-900" : "",
                      st === "answered" && "bg-green-500 text-white",
                      st === "marked" && "bg-purple-600 text-white",
                      st === "unanswered" && "bg-orange-400 text-white",
                      st === "not-visited" && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-green-500" /> Answered</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-orange-400" /> Not answered</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-purple-600" /> Marked for review</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" /> Not visited</p>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3">
              {perms.camera === "granted" ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-gray-700 dark:text-slate-300">
                    <video
                      ref={attachVideoNode}
                      autoPlay
                      playsInline
                      muted
                      className="aspect-[4/3] w-full max-w-[140px] rounded-lg border border-slate-300 dark:border-slate-700 bg-black object-cover"
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> Proctoring active
                  </p>
                </>
              ) : (
                <>
                  {/* No camera means no video to show. The tile used to render
                      an empty black rectangle labelled "Proctoring active",
                      which read as a dead camera rather than an absent one. */}
                  <div className="flex aspect-[4/3] w-full max-w-[140px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] font-medium text-slate-400 dark:border-slate-700">
                    Camera off
                  </div>
                  <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
                    Focus mode off
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirm */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Submit test?">
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            You have answered <b>{answeredCount}</b> of <b>{questions.length}</b> questions.
          </p>
          <p>
            {answeredCount < questions.length
              ? "Unanswered questions will be treated as unattempted."
              : "All questions answered."}
          </p>
          <p className="text-xs text-slate-400">This action cannot be undone.</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Keep going</Button>
          <Button variant="danger" onClick={() => { setConfirmOpen(false); finishTest(); }}>
            Submit test
          </Button>
        </div>
      </Modal>

      {/* Violation warning */}
      <Modal open={warnOpen} onClose={() => setWarnOpen(false)} title="Proctoring violation">
        <div className="space-y-3 text-sm text-slate-600">
          <p className="flex items-center gap-2 font-semibold text-red-600">
            <ShieldAlert className="h-4 w-4" /> {lastWarning?.reason ?? "Violation detected"}
          </p>
          <p>
            Do not switch tabs or leave the full-screen exam. This is warning{" "}
            <b>{violations.length} of {MAX_VIOLATIONS}</b>. The test will be auto-submitted after{" "}
            {MAX_VIOLATIONS - violations.length} more.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="danger" onClick={() => setWarnOpen(false)}>
            Continue exam
          </Button>
        </div>
      </Modal>
    </div>
  );
}
