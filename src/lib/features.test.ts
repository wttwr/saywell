import { describe, expect, it } from "vitest";
import { addToLayout, FEATURES, moveItem, moveToEdge, resolveWorkspaceView, sanitizeLayout, searchTools } from "./features";

describe("workspace view preference", () => {
  it("defaults first-time visitors to List", () => {
    expect(resolveWorkspaceView(null)).toBe("list");
    expect(resolveWorkspaceView(undefined)).toBe("list");
    expect(resolveWorkspaceView("invalid")).toBe("list");
  });
  it("preserves a returning visitor's saved view", () => {
    expect(resolveWorkspaceView("dashboard")).toBe("dashboard");
    expect(resolveWorkspaceView("list")).toBe("list");
  });
});

describe("workspace layout", () => {
  it("drops unknown and duplicate cards", () => {
    expect(sanitizeLayout(["check", "bogus", "check", "style"])).toEqual(["check", "style"]);
  });
  it("moves a card and ignores moves past the edge", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });
  it("moves a card to the top or bottom", () => {
    expect(moveToEdge(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveToEdge(["a", "b", "c"], 0, 1)).toEqual(["b", "c", "a"]);
    expect(moveToEdge(["a", "b"], 0, -1)).toEqual(["a", "b"]);
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
  it("adds only the chosen tool at the top and preserves existing order", () => {
    const layout = ["interpret", "check"] as const;
    expect(addToLayout([...layout], "style")).toEqual(["style", "interpret", "check"]);
    expect(addToLayout([...layout], "check")).toEqual(["interpret", "check"]);
  });
});
