import { describe, expect, it } from "vitest";
import { overallRecognitionFeedback, recognitionFeedback } from "./ListenResults";

describe("recognition-only feedback", () => {
  it("keeps recognized matches neutral, not scored as good pronunciation", () => {
    expect(recognitionFeedback({ type: "match", word: "Cosa" })).toEqual({ status: "neutral", message: "listen.wordMatched" });
  });
  it("offers practice for a recognition difference without claiming a sound error", () => {
    expect(recognitionFeedback({ type: "different", word: "fatto", heard: "fato" })).toEqual({ status: "practice", message: "listen.wordDifferent" });
  });
  it("keeps words with no assessment neutral", () => {
    expect(recognitionFeedback()).toEqual({ status: "neutral", message: "listen.wordUnassessed" });
  });
  it("marks an unrecognized word as a practice hint, not a scored error", () => {
    expect(recognitionFeedback({ type: "missing", word: "hello" })).toEqual({ status: "practice", message: "listen.wordMissing" });
  });
});

describe("overall recognition feedback", () => {
  it("does not assess pronunciation from matching transcription", () => {
    expect(overallRecognitionFeedback("Cosa", [{ type: "match", word: "Cosa" }])).toBe("listen.overallMatched");
  });
  it("reports differences including extra recognized words", () => {
    expect(overallRecognitionFeedback("Cosa ora", [{ type: "match", word: "Cosa" }, { type: "extra", word: "ora" }])).toBe("listen.overallDifferent");
  });
  it("does not report success when speech was not recognized", () => {
    expect(overallRecognitionFeedback("", [])).toBe("listen.nothingHeard");
  });
  it("does not report a match without comparison data", () => {
    expect(overallRecognitionFeedback("Cosa", [])).toBe("listen.overallUnassessed");
  });
});