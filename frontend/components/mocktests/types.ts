/** Shared types for the mock-test runner. */

export const MAX_VIOLATIONS = 3;

export type Stage = "setup" | "running" | "result";

/**
 * State of one focus-mode capability.
 *
 * `unavailable` is separate from `denied` because they need different words.
 * "Blocked" means the user or their browser refused a prompt; "Unavailable"
 * means there is no such API on this device at all — no camera, no
 * `getDisplayMedia`, an insecure origin. The exam must start either way, so
 * neither state is allowed to gate it; they only decide which sentence the
 * setup screen prints.
 */
export type PermState = "pending" | "granted" | "denied" | "unavailable";

export interface PermissionStatus {
  camera: PermState;
  mic: PermState;
  screen: PermState;
  fullscreen: PermState;
}

export interface Violation {
  reason: string;
  at: Date;
  remaining: number;
}

export interface AnswerState {
  /** Index of the chosen MCQ option. Stays null for numeric questions. */
  selected: number | null;
  marked: boolean;
  /** Raw text typed into a numeric-answer field. */
  numeric?: string;
}

export interface BuildResult {
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  timeTakenSec: number;
  topicPerf: Record<string, { correct: number; total: number }>;
}
