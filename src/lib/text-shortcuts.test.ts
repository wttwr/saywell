import { describe, expect, it, vi } from "vitest";
import type { KeyboardEvent } from "react";
import { handleTextShortcut } from "./text-shortcuts";

function key(overrides = {}) {
  return { key: "Enter", nativeEvent: { isComposing: false }, keyCode: 13, altKey: false, repeat: false,
    preventDefault: vi.fn(), currentTarget: { value: "Hello world", selectionStart: 5, selectionEnd: 6, setSelectionRange: vi.fn() },
    ...overrides } as unknown as KeyboardEvent<HTMLTextAreaElement>;
}
describe("text shortcuts", () => {
  it("Enter submits without inserting a newline", () => {
    const submit = vi.fn(); const event = key();
    handleTextShortcut(event, submit, false);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
  it("Alt+Enter inserts a newline at the selection without submitting", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());
    const submit = vi.fn(); const change = vi.fn(); const event = key({ altKey: true });
    handleTextShortcut(event, submit, false, change);
    expect(change).toHaveBeenCalledWith("Hello\nworld");
    expect(submit).not.toHaveBeenCalled();
    expect(event.currentTarget.setSelectionRange).toHaveBeenCalledWith(6, 6);
    vi.unstubAllGlobals();
  });
  it("does not submit disabled, repeated, or composing input", () => {
    const submit = vi.fn();
    handleTextShortcut(key(), submit, true);
    handleTextShortcut(key({ repeat: true }), submit, false);
    handleTextShortcut(key({ nativeEvent: { isComposing: true } }), submit, false);
    expect(submit).not.toHaveBeenCalled();
  });
});