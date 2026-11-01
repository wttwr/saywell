import { ResultCard } from "@/components/ds/ResultCard";

/** Soft card with a heading and a short hint, shown before a section has results. */
export function EmptyResultCard({ title, hint, className }: { title: string; hint: string; className?: string | undefined }) {
  return (
    <ResultCard className={className}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </ResultCard>
  );
}
