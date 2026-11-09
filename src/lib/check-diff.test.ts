import { describe, expect, it } from "vitest";

import {
  correctionSummary,
  diffCorrected,
  findIssueForSegment,
  matchesCheckSubmission,
} from "@/lib/check-diff";
import type { CheckIssue } from "@/lib/check.functions";

const issue = (labels: CheckIssue["labels"], suggestion: string): CheckIssue => ({
  original: "",
  suggestion,
  reason: "",
  labels,
});

describe("diffCorrected", () => {
  it("marks only the changed word in a one-correction sentence", () => {
    const segments = diffCorrected("I go to school yesterday.", "I went to school yesterday.");
    expect(segments).toEqual([
      { text: "I", changed: false },
      { text: "went", changed: true },
      { text: "to school yesterday.", changed: false },
    ]);
  });

  it("marks each changed word when there are multiple corrections", () => {
    const segments = diffCorrected("She don't has time.", "She doesn't have time.");
    const changed = segments.filter((s) => s.changed).map((s) => s.text);
    expect(changed).toEqual(["doesn't have"]);
    expect(segments.some((s) => !s.changed && s.text.includes("She"))).toBe(true);
  });

  it("marks nothing when the sentence is already correct", () => {
    const segments = diffCorrected("This is fine.", "This is fine.");
    expect(segments).toEqual([{ text: "This is fine.", changed: false }]);
  });

  it("does not insert spaces between CJK characters", () => {
    const segments = diffCorrected("我昨天去学校", "我昨天去了学校");
    expect(segments.map((s) => s.text).join("")).toBe("我昨天去了学校");
  });
});

describe("findIssueForSegment", () => {
  it("matches a highlighted word to the issue whose suggestion contains it", () => {
    const issues = [issue(["Grammar"], "went"), issue(["Typo"], "school")];
    expect(findIssueForSegment(issues, "went")).toBe(0);
    expect(findIssueForSegment(issues, "school")).toBe(1);
    expect(findIssueForSegment(issues, "unrelated")).toBe(-1);
  });
});

describe("correctionSummary", () => {
  it("counts grammar and typo issues as corrections", () => {
    const { corrections, suggestions } = correctionSummary([
      issue(["Grammar"], "went"),
      issue(["Typo"], "their"),
    ]);
    expect(corrections).toBe(2);
    expect(suggestions).toBe(0);
  });

  it("counts naturalness-only issues as optional suggestions", () => {
    const { corrections, suggestions } = correctionSummary([
      issue(["Naturalness"], "a more fluent phrasing"),
    ]);
    expect(corrections).toBe(0);
    expect(suggestions).toBe(1);
  });
});

describe("matchesCheckSubmission", () => {
  it("is true only for the exact submitted text and language", () => {
    const sub = { text: "Buongiorno.", language: "Italian" };
    expect(matchesCheckSubmission(sub, "Buongiorno.", "Italian")).toBe(true);
    expect(matchesCheckSubmission(sub, "Buongiorno!", "Italian")).toBe(false);
    expect(matchesCheckSubmission(sub, "Buongiorno.", "English")).toBe(false);
  });
});
