import type { KeyboardEvent } from "react";

/** Shared text-entry shortcuts, including IME and repeated-key protection. */
export function handleTextShortcut(
  event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  submit: () => void,
  disabled: boolean,
  change?: (text: string) => void,
) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
  if (event.altKey) {
    if (!change) return;
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    change(`${input.value.slice(0, start)}\n${input.value.slice(end)}`);
    requestAnimationFrame(() => input.setSelectionRange(start + 1, start + 1));
    return;
  }
  event.preventDefault();
  if (!disabled && !event.repeat) submit();
}