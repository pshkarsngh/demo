"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  FileQuestion,
  Flag,
  ChevronLeft,
  ChevronRight,
  Timer,
  CheckCircle2,
  XCircle,
  MinusCircle,
  PercentCircle,
  Target,
  RefreshCw,
  BookOpen,
  Trophy,
  Play,
  BarChart3,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { MOCK_TESTS, getTestQuestions, computePercentile } from "@/lib/data/mockTests";
import type { MockTest, MockTestQuestion } from "@/lib/types";
import { useApp } from "@/lib/context/AppContext";

const DIFFICULTY_TONE: Record<string, "green" | "yellow" | "red"> = {
  Easy: "green",
  Medium: "yellow",
  Hard: "red",
};

export function MockTestCard({ test, onStart }: { test: MockTest; onStart: (t: MockTest) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-900/5">
      <div className="flex items-center justify-between">
        <Badge variant="purple">{test.exam}</Badge>
        <Badge variant={DIFFICULTY_TONE[test.difficulty]}>{test.difficulty}</Badge>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-gray-900">{test.title}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-500">{test.description}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5 text-purple-500" /> {test.questionCount} questions</span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-purple-500" /> {test.durationMins} mins</span>
        <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-purple-500" /> {test.subject}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">{test.attempts.toLocaleString("en-IN")} attempts</span>
        <Button variant="primary" size="sm" onClick={() => onStart(test)}>
          <Play className="h-4 w-4" /> Take test
        </Button>
      </div>
    </div>
  );
}

interface AnswerState {
  selected: number | null;
  marked: boolean;
}

export function MockTestEngine() {
  const { addTestResult, testHistory } = useApp();
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "submitting">("idle");
  const [result, setResult] = useState<ReturnType<typeof buildResult> | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function buildResult(t: MockTest, qs: MockTestQuestion[], ans: Record<string, AnswerState>, seconds: number) {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const topicPerf: Record<string, { correct: number; total: number }> = {};
    qs.forEach((q) => {
      topicPerf[q.topic] ??= { correct: 0, total: 0 };
      topicPerf[q.topic].total += 1;
      const a = ans[q.id]?.selected;
      if (a === undefined || a === null) unattempted++;
      else if (a === q.correctIndex) {
        correct++;
        topicPerf[q.topic].correct += 1;
      } else incorrect++;
    });
    const score = correct * 3 - incorrect; // JEE-style +3/-1
    const maxScore = qs.length * 3;
    const percentile = computePercentile(Math.max(0, score), maxScore);
    const timeTakenSec = t.durationMins * 60 - seconds;
    return { correct, incorrect, unattempted, score, maxScore, percentile, timeTakenSec, topicPerf };
  }

  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishTest(0);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startTest = (t: MockTest) => {
    const qs = getTestQuestions(t);
    setActiveTest(t);
    setQuestions(qs);
    setAnswers({});
    setCurrent(0);
    setTimeLeft(t.durationMins * 60);
    setResult(null);
    setShowSolutions(false);
    setPhase("running");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishTest = (remainingSeconds = timeLeft) => {
    if (!activeTest) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const res = buildResult(activeTest, questions, answers, remainingSeconds);
    setResult(res);
    setPhase("submitting");
    addTestResult({
      id: `tr-${Date.now()}`,
      testId: activeTest!.id,
      testSlug: activeTest!.slug,
      testTitle: activeTest!.title,
      exam: activeTest!.exam,
      date: new Date().toISOString().slice(0, 10),
      total: questions.length,
      correct: res.correct,
      incorrect: res.incorrect,
      unattempted: res.unattempted,
      timeTakenSec: res.timeTakenSec,
      score: Math.max(0, res.score),
      maxScore: res.maxScore,
      topicPerformance: res.topicPerf,
      percentile: res.percentile,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectAnswer = (qi: number, optionIdx: number) => {
    const q = questions[qi];
    setAnswers((prev) => ({ ...prev, [q.id]: { ...(prev[q.id] ?? { selected: null, marked: false }), selected: optionIdx === prev[q.id]?.selected ? null : optionIdx } }));
  };

  const toggleMark = (qi: number) => {
    const q = questions[qi];
    setAnswers((prev) => {
      const cur = prev[q.id] ?? { selected: null, marked: false };
      return { ...prev, [q.id]: { ...cur, marked: !cur.marked } };
    });
  };

  const answerStatus = (qi: number): "answered" | "unanswered" | "marked" | "not-visited" => {
    const a = answers[questions[qi]?.id];
    if (a?.marked) return "marked";
    if (a?.selected !== undefined && a?.selected !== null) return "answered";
    return "not-visited";
  };

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.selected !== undefined && answers[q.id]?.selected !== null).length,
    [answers, questions],
  );
  const markedCount = useMemo(() => questions.filter((q) => answers[q.id]?.marked).length, [answers, questions]);

  const mm = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const hh = String(Math.floor(timeLeft / 3600)).padStart(2, "0");

  // ---------- RESULTS ----------
  if (phase === "submitting" && result && activeTest) {
    return (
      <ResultView
        activeTest={activeTest}
        questions={questions}
        answers={answers}
        result={result}
        showSolutions={showSolutions}
        setShowSolutions={setShowSolutions}
        onPractice={() => startTest(activeTest)}
        onNewTest={() => {
          setActiveTest(null);
          setPhase("idle");
          setResult(null);
        }}
      />
    );
  }

  // ---------- TEST RUNNING ----------
  if (phase === "running" && activeTest && questions.length) {
    const q = questions[current];
    const status = answerStatus(current);
    return (
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="sticky top-16 z-40 rounded-b-2xl border border-slate-100 bg-white/95 shadow-sm backdrop-blur lg:top-[72px]">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{activeTest.title}</p>
              <p className="text-xs text-slate-400">
                Question {current + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-bold tabular-nums text-purple-700">
                <Timer className="h-4 w-4" /> {hh}:{mm}:{ss}
              </span>
              <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
                Submit
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
          {/* Question */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <Badge variant="purple">Q{current + 1} · {q.topic}</Badge>
              <button
                type="button"
                onClick={() => toggleMark(current)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition",
                  answers[q.id]?.marked
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-purple-300",
                )}
              >
                <Flag className="h-3.5 w-3.5" /> {answers[q.id]?.marked ? "Marked" : "Mark for review"}
              </button>
            </div>
            <p className="mt-4 text-base font-medium leading-relaxed text-gray-900 sm:text-lg">{q.text}</p>
            <div className="mt-5 space-y-2.5">
              {q.options.map((opt, i) => {
                const selected = answers[q.id]?.selected === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectAnswer(current, i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      selected
                        ? "border-purple-500 bg-purple-50 text-purple-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-purple-300",
                    )}
                  >
                    <span className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold",
                      selected ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 text-slate-500",
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="secondary" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
                {current === questions.length - 1 ? "Review" : "Next"} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Palette */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Question palette</h3>
              <span className="text-xs text-slate-400">{answeredCount + markedCount}/{questions.length}</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {questions.map((qq, i) => {
                const st = answerStatus(i);
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition",
                      i === current
                        ? "ring-2 ring-purple-500 ring-offset-1"
                        : "",
                      st === "answered" && "bg-green-500 text-white",
                      st === "marked" && "bg-purple-600 text-white",
                      st === "unanswered" && "bg-orange-400 text-white",
                      st === "not-visited" && "bg-slate-100 text-slate-600",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-[11px] text-slate-500">
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-green-500" /> Answered</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-orange-400" /> Not answered</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-purple-600" /> Marked for review</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-100" /> Not visited</p>
            </div>
          </div>
        </div>

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Submit test?">
          <div className="space-y-3 text-sm text-slate-600">
            <p>You have answered <b>{answeredCount}</b> of <b>{questions.length}</b> questions.</p>
            <p>{answeredCount < questions.length ? "Unanswered questions will be treated as unattempted." : "All questions answered."}</p>
            <p className="text-xs text-slate-400">This action cannot be undone.</p>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Keep going</Button>
            <Button variant="danger" onClick={() => { setConfirmOpen(false); finishTest(); }}>
              Submit test
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // ---------- IDLE (selection) ----------
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-5">
        <div>
          <h2 className="font-display text-xl font-extrabold text-gray-900">Practice mock tests</h2>
          <p className="text-sm text-slate-500">Attempt full-length and section-wise mocks with instant solutions and analytics.</p>
        </div>
        <Link href="/exams" className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-800">
          View exam calendar <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {testHistory.length > 0 && (
        <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <Trophy className="h-4 w-4" /> Last result: {testHistory[0].score}/{testHistory[0].maxScore} · {testHistory[0].percentile} percentile
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_TESTS.map((t) => (
          <MockTestCard key={t.id} test={t} onStart={startTest} />
        ))}
      </div>
    </div>
  );
}

function ResultView({
  activeTest,
  questions,
  answers,
  result,
  showSolutions,
  setShowSolutions,
  onPractice,
  onNewTest,
}: {
  activeTest: MockTest;
  questions: MockTestQuestion[];
  answers: Record<string, { selected: number | null; marked: boolean }>;
  result: { correct: number; incorrect: number; unattempted: number; score: number; maxScore: number; percentile: number; timeTakenSec: number; topicPerf: Record<string, { correct: number; total: number }> };
  showSolutions: boolean;
  setShowSolutions: (v: boolean) => void;
  onPractice: () => void;
  onNewTest: () => void;
}) {
  const pct = Math.round((result.correct / questions.length) * 100);
  const timeStr = `${Math.floor(result.timeTakenSec / 60)}m ${result.timeTakenSec % 60}s`;
  const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Average" : "Needs practice";
  const gradeTone: "green" | "yellow" | "amber" | "red" = pct >= 80 ? "green" : pct >= 60 ? "yellow" : pct >= 40 ? "amber" : "red";

  const stats = [
    { label: "Score", value: `${Math.max(0, result.score)}/${result.maxScore}`, icon: <Target className="h-4 w-4" />, tone: "text-purple-700 bg-purple-50" },
    { label: "Percentage", value: `${pct}%`, icon: <PercentCircle className="h-4 w-4" />, tone: "text-blue-700 bg-blue-50" },
    { label: "Correct", value: String(result.correct), icon: <CheckCircle2 className="h-4 w-4" />, tone: "text-green-700 bg-green-50" },
    { label: "Incorrect", value: String(result.incorrect), icon: <XCircle className="h-4 w-4" />, tone: "text-red-700 bg-red-50" },
    { label: "Unattempted", value: String(result.unattempted), icon: <MinusCircle className="h-4 w-4" />, tone: "text-slate-600 bg-slate-100" },
    { label: "Time taken", value: timeStr, icon: <Clock className="h-4 w-4" />, tone: "text-orange-700 bg-orange-50" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Score banner */}
      <div className="rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 p-8 text-center text-white">
        <Trophy className="mx-auto h-10 w-10 text-amber-300" />
        <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Test completed!{pct >= 80 ? " 🎉" : ""}</h2>
        <p className="mt-1 text-sm text-white/75">{activeTest.title}</p>
        <div className="mx-auto mt-5 grid max-w-xl grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Score</p>
            <p className="text-xl font-extrabold">{Math.max(0, result.score)}<span className="text-sm font-medium text-white/60">/{result.maxScore}</span></p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Percentage</p>
            <p className="text-xl font-extrabold">{pct}%</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Percentile</p>
            <p className="text-xl font-extrabold">{result.percentile}</p>
          </div>
        </div>
        <Badge variant={gradeTone} className="mt-4">{grade}</Badge>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
            <span className={cn("mx-auto grid h-9 w-9 place-items-center rounded-xl", s.tone)}>{s.icon}</span>
            <p className="mt-2 text-lg font-extrabold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions + topic performance */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-gray-900">
              <ListChecks className="h-4 w-4 text-purple-600" /> Topic-wise performance
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            {Object.entries(result.topicPerf).map(([topic, perf]) => {
              const p = Math.round((perf.correct / perf.total) * 100);
              return (
                <div key={topic}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{topic}</span>
                    <span className="text-slate-400">{perf.correct}/{perf.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", p >= 70 ? "bg-green-500" : p >= 40 ? "bg-amber-400" : "bg-red-400")}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="primary" size="lg" className="w-full" onClick={onPractice}>
            <RefreshCw className="h-4 w-4" /> Practice again
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setShowSolutions(!showSolutions)}>
            <BookOpen className="h-4 w-4" /> {showSolutions ? "Hide" : "View"} solutions
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={onNewTest}>
            <FileQuestion className="h-4 w-4" /> Try another test
          </Button>
        </div>
      </div>

      {/* Solutions */}
      {showSolutions && (
        <div className="mt-6 space-y-4">
          {questions.map((q, i) => {
            const chosen = answers[q.id]?.selected;
            const isCorrect = chosen === q.correctIndex;
            return (
              <div key={q.id} className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900">Q{i + 1}. {q.text}</p>
                  {chosen === undefined || chosen === null ? (
                    <Badge variant="amber">Unattempted</Badge>
                  ) : isCorrect ? (
                    <Badge variant="green">Correct</Badge>
                  ) : (
                    <Badge variant="red">Incorrect</Badge>
                  )}
                </div>
                <div className="mt-3 space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <p
                      key={oi}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                        oi === q.correctIndex && "bg-green-50 text-green-800 font-medium",
                        oi === chosen && oi !== q.correctIndex && "bg-red-50 text-red-700",
                      )}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                      {oi === q.correctIndex && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {oi === chosen && oi !== q.correctIndex && <XCircle className="h-4 w-4 text-red-500" />}
                    </p>
                  ))}
                </div>
                <p className="mt-3 rounded-xl bg-purple-50 p-3 text-sm text-purple-900">
                  <b>Explanation:</b> {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}