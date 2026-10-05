"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileQuestion,
  Maximize2,
  Mic,
  MinusCircle,
  MonitorUp,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { resolveMarks } from "@/lib/data/mockTests";
import type { MockTest } from "@/lib/types";
import { MAX_VIOLATIONS, type PermissionStatus, type PermState } from "@/components/mocktests/types";

const PERMISSION_ROWS: {
  key: keyof PermissionStatus;
  icon: React.ReactNode;
  label: string;
  hint: string;
}[] = [
  {
    key: "camera",
    icon: <Eye className="h-4 w-4" />,
    label: "Camera access",
    hint: "shows a small preview so you can see the recorder",
  },
  {
    key: "mic",
    icon: <Mic className="h-4 w-4" />,
    label: "Microphone access",
    hint: "counts silence while you answer",
  },
  {
    key: "screen",
    icon: <MonitorUp className="h-4 w-4" />,
    label: "Share entire screen",
    hint: "notices if you shrink to a single window",
  },
  {
    key: "fullscreen",
    icon: <Maximize2 className="h-4 w-4" />,
    label: "Full-screen mode",
    hint: "notices if you tab away mid-test",
  },
];

/** The state words, so a blocked camera is never read as a broken exam. */
const PERM_STATUS: Record<PermState, { label: string; className: string }> = {
  pending: { label: "Not enabled", className: "text-slate-500" },
  granted: { label: "On", className: "text-emerald-400" },
  denied: { label: "Blocked", className: "text-amber-400" },
  unavailable: { label: "Not available", className: "text-slate-500" },
};

/**
 * Pre-test gate.
 *
 * ## Why nothing here is required
 *
 * This screen used to compute `allGranted` over all four capabilities and
 * disable "Begin test" on anything less, which made the runner unreachable
 * for anyone without a webcam or microphone, on an insecure origin, or in any
 * browser that refused `getDisplayMedia`. There was no bypass and no way back
 * to the exam: the panel simply stopped working, with no error to explain it.
 *
 * That was the wrong gate to put there at all. The backend has no proctoring
 * requirement — `POST /mock-tests/{ref}/start` checks the attempt limit and
 * nothing else — and Phases 47–51 (consent, event reporting, the ML service)
 * are unstarted, so nothing on the server is watching. Requiring hardware the
 * product does not use, in order to sit an exam, bought no safety and cost
 * every such student the exam.
 *
 * So focus mode is now **opt-in**: turn it on if your device supports it and
 * you want the tab-switch warnings, otherwise start the test immediately. The
 * screen states plainly which capabilities are live rather than implying all
 * four are.
 */
export function TestSetupScreen({
  test,
  perms,
  screenError,
  onRequestSetup,
  onBegin,
}: {
  test: MockTest;
  perms: PermissionStatus;
  screenError: string | null;
  onRequestSetup: () => void;
  onBegin: () => void;
}) {
  const marks = resolveMarks(test);
  const on = PERMISSION_ROWS.filter((r) => perms[r.key] === "granted");
  const focusModeOn = on.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950 p-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-10">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/15 text-purple-300">
              <FileQuestion className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                {test.title}
              </h1>
              <p className="text-sm text-slate-400">
                {test.questionCount} questions · {test.durationMins} minutes
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            The timer starts the moment you begin and does not stop. You can move between questions
            freely, flag anything for review, and change an answer until you submit. Unanswered
            questions are scored as unattempted.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Questions", value: String(test.questionCount) },
              { label: "Duration", value: `${test.durationMins} mins` },
              { label: "Total marks", value: String(test.questionCount * marks.correct) },
              {
                label: "Marking",
                value: `+${marks.correct} / −${marks.wrong}`,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
              >
                <p className="text-lg font-extrabold tabular-nums text-white">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Marking is +{marks.correct} per correct answer, −{marks.wrong} per incorrect answer, and
            0 for anything left unattempted.
          </p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-purple-300" /> Focus mode (optional)
              </h2>
              {focusModeOn && (
                <span className="text-xs font-semibold text-emerald-400">
                  {on.length} of {PERMISSION_ROWS.length} active
                </span>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Focus mode warns you when you leave the test — switching tabs, alt-tabbing, or
              shrinking a shared screen — and submits the test for you after{" "}
              <b className="text-slate-300">{MAX_VIOLATIONS} warnings</b>. It is a study aid, not
              an exam-integrity control: these events are counted in this browser tab, never uploaded,
              and nobody reviews them. Turn it on only if your device supports it; the test itself
              needs none of it.
            </p>

            <ul className="mt-4 space-y-2">
              {PERMISSION_ROWS.map(({ key, icon, label, hint }) => {
                const st = perms[key];
                const status = PERM_STATUS[st];
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-300">
                      {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-200">{label}</span>
                      <span className="block text-[11px] leading-snug text-slate-500">{hint}</span>
                    </span>
                    {st === "granted" ? (
                      <CheckCircle2 className={cn("h-4 w-4 shrink-0", status.className)} />
                    ) : st === "denied" ? (
                      <XCircle className={cn("h-4 w-4 shrink-0", status.className)} />
                    ) : st === "unavailable" ? (
                      <MinusCircle className={cn("h-4 w-4 shrink-0", status.className)} />
                    ) : null}
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold",
                        st === "pending" ? "text-slate-500" : status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {screenError && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {screenError} You can start the test without it — only the screen-share check will
                be skipped.
              </span>
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" size="lg" onClick={onRequestSetup}>
              <ShieldCheck className="h-4 w-4" />
              {focusModeOn ? "Re-check focus mode" : "Turn on focus mode"}
            </Button>
            <Button variant="warm" size="lg" onClick={onBegin}>
              Begin test <Play className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4">
            <Link
              href="/mock-tests"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to all mock tests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
