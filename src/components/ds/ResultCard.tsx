import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { FeatureMode } from "@/lib/feature-state";

export const RESULT_CARD_STYLE = "rounded-2xl bg-secondary/40 p-5 md:p-6";

export function resultSpacing(mode: FeatureMode) {
  return mode === "widget" ? "mt-4" : "mt-10";
}

/** Shared padding; optional mode aligns empty and populated result placement. */
export function ResultCard({ children, className, mode }: { children: ReactNode; className?: string | undefined; mode?: FeatureMode | undefined }) {
  return <div data-result-card className={cn(RESULT_CARD_STYLE, mode && resultSpacing(mode), className)}>{children}</div>;
}
