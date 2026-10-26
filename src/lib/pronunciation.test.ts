import { describe, expect, it } from "vitest";
import { compareWords, summarize } from "./pronunciation";

describe("compareWords", () => {
  it("ignores case and punctuation for a perfect match", () => {
    expect(summarize(compareWords("Hello, world!", "hello world"))).toEqual({ match: 2, missing: 0, different: 0, extra: 0 });
  });
  it("flags missing, different and extra words", () => {
    const s = summarize(compareWords("I am going home", "I am gone home now"));
    expect(s).toEqual({ match: 3, missing: 0, different: 1, extra: 1 });
    expect(summarize(compareWords("buongiorno a tutti", "buongiorno tutti"))).toEqual({ match: 2, missing: 1, different: 0, extra: 0 });
  });
  it("compares Chinese character by character", () => {
    const ops = compareWords("我在超市。", "我在超时");
    expect(ops.find((o) => o.type === "different")).toEqual({ type: "different", word: "市", heard: "时" });
  });
});
