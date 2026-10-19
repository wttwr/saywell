import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, resolveSettings } from "./settings";

describe("section language inheritance", () => {
  it("sections follow the parent language and shortcuts by default", () => {
    const r = resolveSettings({ ...DEFAULT_SETTINGS, sectionLanguage: "Italian", sectionShortcuts: ["French"] });
    expect(r.checkLanguage).toBe("Italian");
    expect(r.dictionaryLanguage).toBe("Italian");
    expect(r.styleShortcuts).toEqual(["French"]);
  });

  it("an overridden section keeps its own value", () => {
    const r = resolveSettings({
      ...DEFAULT_SETTINGS,
      sectionLanguage: "Italian",
      checkLanguage: "German",
      sectionOverrides: ["checkLanguage"],
    });
    expect(r.checkLanguage).toBe("German");
    expect(r.styleLanguage).toBe("Italian");
  });
});
