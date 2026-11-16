import { Check, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceMemo } from "@/components/ds/VoiceMemo";
import { useI18n } from "@/lib/i18n";
import { normalize, type DiffOp } from "@/lib/pronunciation";
import { cn } from "@/lib/utils";
import { tipsLanguageMismatch, type TipsState } from "@/lib/listen-tips";

/** Recognition differences are practice hints, never pronunciation accuracy. */
export function recognitionFeedback(op?: DiffOp) {
  const practice = op?.type === "missing" || op?.type === "different";
  return {
    status: practice ? "practice" : "neutral",
    message: op?.type === "different" ? "listen.wordDifferent" : op?.type === "missing" ? "listen.wordMissing" : op?.type === "match" ? "listen.wordMatched" : "listen.wordUnassessed",
  } as const;
}

export function overallRecognitionFeedback(heard: string, ops: DiffOp[]) {
  if (!heard.trim()) return "listen.nothingHeard";
  if (!ops.length) return "listen.overallUnassessed";
  return ops.some((op) => op.type !== "match") ? "listen.overallDifferent" : "listen.overallMatched";
}

export function ListenResults({ reference, heard, ops, audioUrl, onRetry, onListen, tips, selectedLanguage, onGetTips }: {
  reference: string;
  heard: string;
  ops: DiffOp[];
  audioUrl: string;
  onRetry: () => void;
  onListen: (word: string) => void;
  tips?: TipsState;
  selectedLanguage?: string;
  onGetTips?: () => void;
}) {
  const { t, ln } = useI18n();
  const referenceOps = ops.filter((op) => op.type !== "extra");
  let position = 0;
  // Keep the original punctuation; use the same character boundaries as comparison.
  const words = (reference.match(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]|[^\s\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]+/gu) ?? []).map((word) => ({
    word,
    op: normalize(word) ? referenceOps[position++] : undefined,
  }));
  const feedbackWords = words.flatMap((entry, index) =>
    recognitionFeedback(entry.op).status === "practice"
      ? [{ ...entry, index }]
      : [],
  );
  const overallFeedback = overallRecognitionFeedback(heard, ops);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("listen.overallFeedback")}</h2>
        <div className="flex items-start gap-2">
          {overallFeedback === "listen.overallMatched" && <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />}
          <p className="text-sm leading-relaxed text-foreground">{t(overallFeedback)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label={t("listen.reference")}>
        {words.map(({ word, op }, index) => normalize(word) ? (
          <span key={index}
            className={cn("inline-flex min-h-10 max-w-full items-center whitespace-normal break-words rounded-lg border px-3 py-2 text-lg font-medium",
              recognitionFeedback(op).status === "practice" ? "border-practice/20 bg-practice/10 text-practice" : "border-border/60 bg-background/70 text-foreground")}>{word}</span>
        ) : <span key={index} className="text-lg text-foreground">{word}</span>)}
      </div>
      {(feedbackWords.length > 0 || heard.trim()) && (
        <section className="space-y-5 border-t border-border/70 pt-5" aria-live="polite">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("check.reasons")}</h2>
          <div className="space-y-4">
            {feedbackWords.map(({ word, op, index }) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className={cn("min-w-0 break-words text-base font-semibold", recognitionFeedback(op).status === "practice" ? "text-practice" : "text-foreground")}>{word}</h3>
                  <Button variant="ghost" size="icon" aria-label={`${t("translate.listen")}: ${word}`} title={t("translate.listen")} onClick={() => onListen(word)}><Volume2 /></Button>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(recognitionFeedback(op).message)}{op?.type === "different" && <> “{op.heard}”.</>}</p>
              </div>
            ))}
          </div>
          {tips?.result && selectedLanguage && tipsLanguageMismatch(tips.result, selectedLanguage) && (
            <p className="text-sm leading-relaxed text-muted-foreground">{t("listen.languageMismatch").replaceAll("{detected}", ln(tips.result.detectedLanguage)).replaceAll("{selected}", ln(selectedLanguage))}</p>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">{t("listen.tipsTitle")}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{t("listen.tipsDisclaimer")}</p>
            </div>
            {tips?.status === "loading" ? <p role="status" className="text-sm text-muted-foreground">{t("listen.tipsLoading")}</p>
              : tips?.status === "error" ? <p role="status" className="text-sm text-muted-foreground">{t(tips.error === "credits" ? "listen.tipsCredits" : "listen.tipsFailed")}</p>
              : tips?.result ? tips.result.tips.length ? tips.result.tips.map(({ phrase, guidance }) => (
                <div key={phrase} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="min-w-0 break-words text-base font-semibold text-foreground">{phrase}</h4>
                    <Button variant="ghost" size="icon" aria-label={`${t("translate.listen")}: ${phrase}`} title={t("translate.listen")} onClick={() => onListen(phrase)}><Volume2 /></Button>
                  </div>
                  <p className="break-words text-sm leading-relaxed text-muted-foreground">{guidance}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">{t("listen.tipsEmpty")}</p> : null}
            {!tips && onGetTips && <Button variant="ghost" size="sm" onClick={onGetTips}>{t("listen.getTips")}</Button>}
          </div>
        </section>
      )}
      <section className="space-y-5 border-t border-border/70 pt-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("listen.results")}</h2>
        {heard && <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("listen.heard")}</p>
          <p className="break-words text-sm leading-relaxed text-foreground">{heard}</p>
        </div>}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <VoiceMemo src={audioUrl} className="min-w-0 basis-40 flex-1" />
            <Button variant="ghost" size="sm" onClick={onRetry} className="text-muted-foreground"><RotateCcw />{t("listen.tryAgain")}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}