import type { TranslationKey } from "@/lib/i18n";

/**
 * Registry of features that can appear as workspace widgets or in Focus Mode.
 * Order here is the default workspace order; add, remove or reorder entries freely.
 */
export type FeatureId = "translate" | "check" | "style" | "interpret" | "listen" | "situations" | "dictionary";

export interface FeatureDefinition {
  id: FeatureId;
  label: TranslationKey;
  focusPath: "/translate" | "/check" | "/style" | "/interpret" | "/listen" | "/situations" | "/dictionary";
}

export const FEATURES: FeatureDefinition[] = [
  { id: "translate", label: "nav.translate" as TranslationKey, focusPath: "/translate" },
  { id: "check", label: "nav.check" as TranslationKey, focusPath: "/check" },
  { id: "style", label: "nav.style" as TranslationKey, focusPath: "/style" },
  { id: "interpret", label: "nav.interpret" as TranslationKey, focusPath: "/interpret" },
  { id: "listen", label: "nav.listen" as TranslationKey, focusPath: "/listen" },
  { id: "situations", label: "nav.situations" as TranslationKey, focusPath: "/situations" },
  { id: "dictionary", label: "nav.vocabulary" as TranslationKey, focusPath: "/dictionary" },
];

export const DEFAULT_LAYOUT: FeatureId[] = ["translate", "check", "interpret"];

export type WorkspaceView = "dashboard" | "list";

/** First visits and invalid preferences use List; valid saved views win. */
export function resolveWorkspaceView(saved: unknown): WorkspaceView {
  return saved === "dashboard" ? "dashboard" : "list";
}

export const TOOL_DESCRIPTIONS: Record<FeatureId, TranslationKey> = {
  translate: "workspace.descriptionTranslate",
  check: "workspace.descriptionCheck",
  style: "workspace.descriptionStyle",
  interpret: "workspace.descriptionInterpret",
  listen: "workspace.descriptionListen",
  situations: "workspace.descriptionSituations",
  dictionary: "workspace.descriptionDictionary",
};

/** The complete directory is independent of the user's visible cards. */
export function searchTools(query: string, label: (key: TranslationKey) => string): FeatureDefinition[] {
  const normalized = query.trim().toLocaleLowerCase();
  return FEATURES.filter((feature) => label(feature.label).toLocaleLowerCase().includes(normalized));
}

/** Explicit additions prepend so the new card is visible at the top; never duplicates. */
export function addToLayout(layout: FeatureId[], id: FeatureId): FeatureId[] {
  return layout.includes(id) ? layout : [id, ...layout];
}

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
  const current = next[index];
  const destination = next[to];
  if (current === undefined || destination === undefined) return list;
  [next[index], next[to]] = [destination, current];
  return next;
}
