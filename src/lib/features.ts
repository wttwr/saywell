import type { TranslationKey } from "@/lib/i18n";

/**
 * Registry of features that can appear as dashboard widgets or in Focus Mode.
 * Order here is the default dashboard order; add, remove or reorder entries freely.
 */
export type FeatureId = "check" | "interpret";

export interface FeatureDefinition {
  id: FeatureId;
  label: TranslationKey;
  focusPath: "/check" | "/interpret";
}

export const FEATURES: FeatureDefinition[] = [
  { id: "check", label: "nav.check" as TranslationKey, focusPath: "/check" },
  { id: "interpret", label: "nav.interpret" as TranslationKey, focusPath: "/interpret" },
];
