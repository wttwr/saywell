import { describe, expect, it } from "vitest";
import { swapTargets } from "./translate-targets";

describe("translation target swap", () => {
  it("replaces the active target when the old source is absent", () => {
    expect(swapTargets(["Italian", "Finnish"], 0, "English"))
      .toEqual({ targets: ["English", "Finnish"], active: 0 });
  });

  it("reuses the existing old-source target after the removed tab", () => {
    expect(swapTargets(["Italian", "Finnish", "English"], 0, "English"))
      .toEqual({ targets: ["Finnish", "English"], active: 1 });
  });

  it("reuses the existing old-source target before the removed tab", () => {
    expect(swapTargets(["English", "Finnish", "Italian"], 2, "English"))
      .toEqual({ targets: ["English", "Finnish"], active: 0 });
  });

  it("keeps IDs unique even when a previous layout contains duplicates", () => {
    const swapped = swapTargets(["Italian", "English", "English", "Finnish"], 0, "English");
    expect(swapped).toEqual({ targets: ["English", "Finnish"], active: 0 });
  });

  it("keeps a same-language swap stable", () => {
    expect(swapTargets(["English", "Italian"], 0, "English"))
      .toEqual({ targets: ["English", "Italian"], active: 0 });
  });

  it("ignores a missing active target", () => {
    expect(swapTargets([], 0, "English")).toBeNull();
  });
});