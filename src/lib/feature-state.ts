import { useCallback, useSyncExternalStore } from "react";

/** How a feature is presented: full section page or compact workspace card. */
export type FeatureMode = "focus" | "widget";

// In-memory state shared by every view of a feature, so inputs and results
// survive switching between a workspace widget and Focus Mode.
const store = new Map<string, unknown>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useFeatureState<T>(feature: string, key: string, initial: T) {
  const id = `${feature}:${key}`;
  const value = useSyncExternalStore(
    subscribe,
    () => (store.has(id) ? (store.get(id) as T) : initial),
    () => initial,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = store.has(id) ? (store.get(id) as T) : initial;
      store.set(id, typeof next === "function" ? (next as (p: T) => T)(prev) : next);
      emit();
    },
    // initial is only a fallback; id identifies the slot
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );
  return [value, set] as const;
}

/** True once a feature's defaults were applied, so remounts keep user edits. */
export function markSeeded(feature: string): boolean {
  const id = `${feature}:__seeded`;
  if (store.has(id)) return false;
  store.set(id, true);
  return true;
}
