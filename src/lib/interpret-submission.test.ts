import { describe, expect, it } from "vitest";
import { matchesInterpretContent, matchesInterpretSubmission, type InterpretSubmission } from "./interpret-submission";

const submitted: InterpretSubmission = {
  text: "Non vedo l’ora di partire.",
  context: "Planning a trip",
  language: "Italian",
  explanationLanguage: "English",
  voiceId: "Sarah",
  speechSpeed: 0.8,
};

describe("Interpret submission consistency", () => {
  it("keeps the original Italian sentence and settings when App language changes", () => {
    const draft = { ...submitted, explanationLanguage: "Simplified Chinese" };
    expect(matchesInterpretContent(submitted, draft)).toBe(true);
    expect(submitted.text).toBe("Non vedo l’ora di partire.");
    expect(submitted.language).toBe("Italian");
    expect(submitted.explanationLanguage).toBe("English");
  });

  it("still rejects edited sentences even when App language changes", () => {
    expect(matchesInterpretContent(submitted, { ...submitted, text: "Buongiorno.", explanationLanguage: "Italian" })).toBe(false);
  });
  it("accepts the same submitted sentence and settings across views", () => {
    expect(matchesInterpretSubmission(submitted, { ...submitted })).toBe(true);
  });

  it("rejects the old explanation after editing the draft to Buongiorno without submitting", () => {
    expect(matchesInterpretSubmission(submitted, { ...submitted, text: "Buongiorno." })).toBe(false);
  });

  it.each([
    { context: "Greeting a friend" },
    { language: "Auto-detect" },
    { explanationLanguage: "Italian" },
    { voiceId: "George" },
    { speechSpeed: 0.45 },
  ])("rejects results and late responses from changed settings: %j", (change) => {
    expect(matchesInterpretSubmission(submitted, { ...submitted, ...change })).toBe(false);
  });
});