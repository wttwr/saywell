import { describe, expect, it } from "vitest";
import { moveItem, sanitizeLayout } from "./features";

describe("dashboard layout", () => {
  it("drops unknown and duplicate cards", () => {
    expect(sanitizeLayout(["check", "bogus", "check", "style"])).toEqual(["check", "style"]);
  });
  it("moves a card and ignores moves past the edge", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });
});
