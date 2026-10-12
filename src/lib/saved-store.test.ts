import { describe, expect, test } from "bun:test";
import { groupSavedItems, savedKey, toggleSavedGroup, type SavedItem } from "./saved-store";

const group = [
  { kind: "translation" as const, text: "ciao", language: "Italian", source: "hello", sourceLanguage: "English", groupId: "hello-card" },
  { kind: "translation" as const, text: "你好", language: "Chinese (Simplified)", source: "hello", sourceLanguage: "English", groupId: "hello-card" },
];
describe("entire multilingual cards", () => {
  test("saves every translation in one listed card", () => {
    const saved = toggleSavedGroup([], group, "2026-10-12");
    expect(saved.map((i) => i.text)).toEqual(["ciao", "你好"]);
    expect(groupSavedItems(saved)).toHaveLength(1);
    expect(groupSavedItems(saved)[0]).toHaveLength(2);
  });
  test("un-saving a card preserves an independently saved translation", () => {
    const individual: SavedItem = { ...group[0], id: savedKey("translation", "ciao", "Italian"), savedAt: "2026-10-11" };
    delete individual.groupId;
    const saved = toggleSavedGroup([individual], group, "2026-10-12");
    expect(saved).toHaveLength(3);
    expect(toggleSavedGroup(saved, group, "2026-10-12")).toEqual([individual]);
  });
  test("legacy grouped rows stay together", () => {
    const legacy = group.map((i) => ({ ...i, id: savedKey(i.kind, i.text, i.language), savedAt: "2026-10-11" }));
    expect(groupSavedItems(legacy).map((g) => g.map((i) => i.text))).toEqual([["ciao", "你好"]]);
  });
});