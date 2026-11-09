import type { CheckIssue, CheckResult } from "@/lib/check.functions";
import { compareWords, normalize, tokenize } from "@/lib/pronunciation";

/** Immutable inputs attached to one check result, shared by both views. */
export type CheckSubmission = { text: string; language: string };

export type SubmittedCheckResult = CheckResult & { submission: CheckSubmission };

/** A result only applies to the exact submitted text and language, never to a later draft. */
export function matchesCheckSubmission(submission: CheckSubmission, text: string, language: string) {
  return submission.text === text.trim() && submission.language === language;
}

export type CorrectedSegment = { text: string; changed: boolean };

const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/;

/** Segments of the corrected sentence; `changed` marks words that differ from the original. */
export function diffCorrected(original: string, corrected: string): CorrectedSegment[] {
  if (original.trim() === corrected.trim()) return [{ text: corrected, changed: false }];
  const segments: CorrectedSegment[] = [];
  for (const op of compareWords(original, corrected)) {
    if (op.type === "missing") continue; // removed words do not appear in the corrected text
    const word = op.type === "different" ? op.heard : op.word;
    const changed = op.type !== "match";
    const last = segments[segments.length - 1];
    if (last && last.changed === changed) {
      const prev = last.text[last.text.length - 1] ?? "";
      last.text += (CJK.test(prev) || CJK.test(word[0] ?? "") ? "" : " ") + word;
    } else {
      segments.push({ text: word, changed });
    }
  }
  return segments;
}

/** Index of the issue whose suggestion best matches a highlighted segment, or -1. */
export function findIssueForSegment(issues: CheckIssue[], segment: string): number {
  const words = new Set(tokenize(segment).map(normalize));
  let best = -1;
  let bestScore = 0;
  issues.forEach((issue, i) => {
    const score = tokenize(issue.suggestion)
      .map(normalize)
      .filter((w) => words.has(w)).length;
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  });
  return best;
}

/** Grammar/typo issues are corrections; naturalness-only issues are optional suggestions. */
export function correctionSummary(issues: CheckIssue[]) {
  const suggestions = issues.filter(
    (i) => (i.labels ?? []).length === 1 && i.labels[0] === "Naturalness",
  ).length;
  return { corrections: issues.length - suggestions, suggestions };
}
