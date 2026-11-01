import { useState } from "react";
import { ChevronDown, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceMemo } from "@/components/ds/VoiceMemo";
import { useI18n } from "@/lib/i18n";
import { normalize, type DiffOp } from "@/lib/pronunciation";
import { cn } from "@/lib/utils";

/** Recognition differences are practice hints, never pronunciation accuracy. */
export function recognitionFeedback(op?: DiffOp) {
  const practice = op?.type === "missing" || op?.type === "different";
  return {
    status: practice ? "practice" : "neutral",
    message: op?.type === "different" ? "listen.wordDifferent" : op?.type === "missing" ? "listen.wordMissing" : op?.type === "match" ? "listen.wordMatched" : "listen.wordUnassessed",
  } as const;
}

export function ListenResults({ reference, heard, ops, audioUrl, onRetry, onListen }: {
  reference: string;
  heard: string;
  ops: DiffOp[];
  audioUrl: string;
  onRetry: () => void;
  onListen: (word: string) => void;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);
  const referenceOps = ops.filter((op) => op.type !== "extra");
  let position = 0;
  // Keep the original punctuation; use the same character boundaries as comparison.
  const words = (reference.match(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]|[^\s\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]+/gu) ?? []).map((word) => ({
    word,
    op: normalize(word) ? referenceOps[position++] : undefined,
  }));
  const active = selected === null ? undefined : words[selected];
  const practice = referenceOps.some((op) => recognitionFeedback(op).status === "practice");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {practice && <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-practice" />{t("listen.practiceHint")}</span>}
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/40" />{t("listen.unassessed")}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label={t("listen.reference")}>
        {words.map(({ word, op }, index) => normalize(word) ? (
          <Button key={index} variant="ghost" aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            className={cn("h-auto min-h-10 max-w-full whitespace-normal break-words rounded-lg border px-3 py-2 text-lg font-medium",
              recognitionFeedback(op).status === "practice" ? "border-practice/20 bg-practice/10 text-practice hover:bg-practice/15 hover:text-practice" : "border-border/60 bg-background/70 text-foreground",
              selected === index && "ring-2 ring-ring ring-offset-2 ring-offset-background")}>{word}</Button>
        ) : <span key={index} className="text-lg text-foreground">{word}</span>)}
      </div>
      {active && (
        <div className="border-t border-border/70 pt-3" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 break-words text-base font-semibold text-foreground">{active.word}</h3>
            <Button variant="ghost" size="icon" aria-label={t("translate.listen")} title={t("translate.listen")} onClick={() => onListen(active.word)}><Volume2 /></Button>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{t(recognitionFeedback(active.op).message)}{active.op?.type === "different" && <> “{active.op.heard}”.</>}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("listen.practiceAdvice")}</p>
        </div>
      )}
      {!heard && <p className="text-sm text-muted-foreground">{t("listen.nothingHeard")}</p>}
      {heard && <details className="group border-t border-border/70 pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground"><ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />{t("listen.heard")}</summary>
        <p className="mt-2 break-words text-sm leading-relaxed text-foreground">{heard}</p>
      </details>}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
        <VoiceMemo src={audioUrl} className="min-w-0 basis-40 flex-1" />
        <Button variant="ghost" size="sm" onClick={onRetry} className="text-muted-foreground"><RotateCcw />{t("listen.tryAgain")}</Button>
      </div>
    </div>
  );
}