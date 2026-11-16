import { describe, expect, it } from "vitest";
import { listenTipsInstructions, tipsLanguageMismatch, validateListenTips } from "./listen-tips";

describe("general pronunciation guidance", () => {
  it("binds tips to exact reference phrases and removes duplicates", () => {
    const result = validateListenTips({ detectedLanguage: "Italian", languageConfident: true, tips: [
      { phrase: "fatto", guidance: "Hold the double consonant." },
      { phrase: "fato", guidance: "Wrong reference." },
      { phrase: "fatto", guidance: "Duplicate." },
    ] }, "Ho fatto tutto.");
    expect(result.tips).toEqual([{ phrase: "fatto", guidance: "Hold the double consonant." }]);
  });
  it("treats the language picker as a preference", () => {
    const result = { detectedLanguage: "Italian" as const, languageConfident: true, tips: [] };
    expect(tipsLanguageMismatch(result, "English")).toBe(true);
    expect(tipsLanguageMismatch(result, "Auto-detect")).toBe(false);
    expect(tipsLanguageMismatch({ ...result, languageConfident: false }, "English")).toBe(false);
  });
  it("requires text-only guidance rather than invented acoustic assessment", () => {
    const instructions = listenTipsInstructions({ reference: "Ho fatto tutto.", heard: "Ho fato tutto.", language: "Italian", explanationLanguage: "it" });
    expect(instructions).toContain("NO audio or acoustic assessment");
    expect(instructions).toContain("Never assess this user's pronunciation");
    expect(instructions).toContain("Write all guidance in Italian");
  });
});