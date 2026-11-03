import { describe, expect, it } from "vitest";
import { addToLayout, FEATURES, moveItem, sanitizeLayout, searchTools } from "./features";

describe("workspace layout", () => {
  it("drops unknown and duplicate cards", () => {
    expect(sanitizeLayout(["check", "bogus", "check", "style"])).toEqual(["check", "style"]);
  });
  it("moves a card and ignores moves past the edge", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });
});

describe("tool directory", () => {
  it("finds hidden Style and Dictionary by their localized names", () => {
    const layout = ["interpret", "check"];
    for (const [style, dictionary] of [["Style", "Dictionary"], ["Stile", "Dizionario"], ["表达", "词典"]] as const) {
      const label = (key: string) => key === "nav.style" ? style : key === "nav.vocabulary" ? dictionary : key;
      expect(searchTools(` ${style.toUpperCase()} `, label).map((f) => f.id)).toEqual(["style"]);
      expect(searchTools(dictionary, label).map((f) => f.id)).toEqual(["dictionary"]);
    }
    expect(layout).toEqual(["interpret", "check"]);
  });
  it("browses all tools without adding cards", () => {
    expect(searchTools("", (key) => key).map((f) => f.id)).toEqual(FEATURES.map((f) => f.id));
    expect(searchTools("nonexistent-tool", (key) => key)).toEqual([]);
  });
  it("adds only the chosen tool at the end and preserves existing order", () => {
    const layout = ["interpret", "check"] as const;
    expect(addToLayout([...layout], "style")).toEqual(["interpret", "check", "style"]);
    expect(addToLayout([...layout], "check")).toEqual(["interpret", "check"]);
  });
});
