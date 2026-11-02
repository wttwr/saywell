import { describe, expect, it } from "vitest";
import { recognitionFeedback } from "./ListenResults";

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