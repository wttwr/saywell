import { describe, expect, it } from "vitest";
import { matchesInterpretSubmission, type InterpretSubmission } from "./interpret-submission";

const submitted: InterpretSubmission = {
  text: "Non vedo l’ora di partire.",
  context: "Planning a trip",
  language: "Italian",
  explanationLanguage: "English",
  voiceId: "Sarah",
  speechSpeed: 0.8,
};

describe("Interpret submission consistency", () => {
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