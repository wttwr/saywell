import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";

describe("Situations default language", () => {
  it("defaults to Auto-detect like the other text tools", () => {
    expect(DEFAULT_SETTINGS.situationsLanguage).toBe("Auto-detect");
  });
});