import { ResultCard } from "@/components/ds/ResultCard";
import type { FeatureMode } from "@/lib/feature-state";

/** Soft card with a heading and a short hint, shown before a section has results. */
export function EmptyResultCard({ title, hint, className, mode }: { title: string; hint: string; className?: string | undefined; mode?: FeatureMode | undefined }) {
  return (
    <ResultCard className={className} mode={mode}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </ResultCard>
  );
}
