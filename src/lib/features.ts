import type { TranslationKey } from "@/lib/i18n";

/**
 * Registry of features that can appear as workspace widgets or in Focus Mode.
 * Order here is the default workspace order; add, remove or reorder entries freely.
 */
export type FeatureId = "translate" | "check" | "style" | "interpret" | "listen" | "dictionary";

export interface FeatureDefinition {
  id: FeatureId;
  label: TranslationKey;
  focusPath: "/translate" | "/check" | "/style" | "/interpret" | "/listen" | "/dictionary";
}

export const FEATURES: FeatureDefinition[] = [
  { id: "translate", label: "nav.translate" as TranslationKey, focusPath: "/translate" },
  { id: "check", label: "nav.check" as TranslationKey, focusPath: "/check" },
  { id: "style", label: "nav.style" as TranslationKey, focusPath: "/style" },
  { id: "interpret", label: "nav.interpret" as TranslationKey, focusPath: "/interpret" },
  { id: "listen", label: "nav.listen" as TranslationKey, focusPath: "/listen" },
  { id: "dictionary", label: "nav.vocabulary" as TranslationKey, focusPath: "/dictionary" },
];

export const DEFAULT_LAYOUT: FeatureId[] = ["translate", "check", "interpret"];

/** Keeps only known ids, without duplicates. */
export function sanitizeLayout(value: unknown): FeatureId[] {
  if (!Array.isArray(value)) return DEFAULT_LAYOUT;
  const known = new Set(FEATURES.map((f) => f.id));
  return [...new Set(value)].filter((v): v is FeatureId => known.has(v as FeatureId));
}

export function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to]!, next[index]!];
  return next;
}
