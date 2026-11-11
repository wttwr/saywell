import { LanguageSelectorBar } from "@/components/ds/LanguageSelectorBar";
import { TextInputSurface } from "@/components/ds/TextInputSurface";
import { EmptyResultCard } from "@/components/ds/EmptyResultCard";
import { SaveButton } from "@/components/SaveButton";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Info, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TextActions } from "@/components/TextActions";
import { useSpeech } from "@/lib/speech";

import { INPUT_LANGUAGES, LANGUAGES } from "@/lib/languages";
import { checkText } from "@/lib/check.functions";
import {
  diffCorrected,
  findIssueForSegment,
  matchesCheckSubmission,
  type SubmittedCheckResult,
} from "@/lib/check-diff";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useDefaultOnce, useSettings } from "@/lib/settings";
import { markSeeded, sendToFeature, useFeatureState, type FeatureMode } from "@/lib/feature-state";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check — Is your writing correct and natural? | SayWell 会说" },
      {
        name: "description",
        content:
          "Paste a sentence or paragraph and see whether it is grammatically correct and sounds natural in the language you chose.",
      },
      { property: "og:title", content: "Check your writing — SayWell 会说" },
      {
        property: "og:description",
        content:
          "A calm grammar and naturalness check with minimal, conservative corrections and clear reasons.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckPage,
});

const CJK_BOUNDARY = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/;

function CheckPage() {
  return <CheckFeature mode="focus" />;
}

export function CheckFeature({ mode = "focus" }: { mode?: FeatureMode }) {
  const runCheck = useServerFn(checkText);
  const speech = useSpeech();
  const { t, lang, ln } = useI18n();

  const [text, setText] = useFeatureState("check", "text", "");
  const [language, setLanguage] = useFeatureState("check", "language", "English");
  const [shortcuts, setShortcuts] = useFeatureState<string[]>("check", "shortcuts", []);
  const [result, setResult] = useFeatureState<SubmittedCheckResult | null>("check", "result", null);
  const [loading, setLoading] = useFeatureState("check", "loading", false);
  const [error, setError] = useFeatureState<string | null>("check", "error", null);
  const [copied, setCopied] = useState(false);
  const [openIssue, setOpenIssue] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // A result only applies to the exact submitted text and language, never to a later draft.
  const validResult =
    result && matchesCheckSubmission(result.submission, text, language) ? result : null;

  const { settings } = useSettings();
  useDefaultOnce(() => {
    if (!markSeeded("check")) return;
    setLanguage(settings.checkLanguage);
    setShortcuts(settings.checkShortcuts);
  });

  // Pick up anything typed or pasted before the page finished loading.
  useEffect(() => {
    const value = textareaRef.current?.value ?? "";
    if (value) setText((prev) => (prev ? prev : value));
  }, []);

  const canCheck = Boolean(language) && text.trim().length > 0;

  const onCheck = async () => {
    const trimmed = (textareaRef.current?.value ?? text).trim();
    if (!trimmed || !language || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const explanationLanguage =
        lang === "it" ? "Italian" : lang === "zh" ? "Simplified Chinese" : "English";
      const data = await runCheck({ data: { text: trimmed, language, explanationLanguage } });
      setResult({ ...data, submission: { text: trimmed, language } });
      setOpenIssue(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("check.error"));
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async () => {
    if (!validResult) return;
    await navigator.clipboard.writeText(validResult.corrected ?? validResult.submission.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const openIn = (feature: "interpret" | "style") => {
    if (!validResult) return;
    sendToFeature(feature, {
      text: validResult.corrected ?? validResult.submission.text,
      language: validResult.detectedLanguage ?? validResult.submission.language,
      shortcuts: [...settings[`${feature}Shortcuts`]],
    });
    void navigate({ to: feature === "interpret" ? "/interpret" : "/style" });
  };

  return (
    <main className={mode === "widget" ? `flex min-h-full flex-1 flex-col bg-background px-4 ${result ? "pb-8" : "pb-4"}` : "min-h-screen bg-background px-5 py-10 md:px-10 md:py-16"}>
      <div className={mode === "widget" ? "mx-auto flex w-full max-w-3xl flex-1 flex-col" : "mx-auto max-w-3xl"}>
        <header className={mode === "widget" ? "sr-only" : "mb-10"}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("check.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("check.subtitle")}</p>
        </header>

        <LanguageSelectorBar
          label={t("check.language")}
          shortcutsLabel={t("check.changeTo")}
          value={language}
          onChange={setLanguage}
          shortcuts={shortcuts}
          setShortcuts={setShortcuts}
          compact={mode === "widget"}
        />

        <TextInputSurface
          value={text}
          onChange={setText}
          onClear={() => {
            setText("");
            setResult(null);
          }}
          placeholder={t("check.placeholder")}
          language={language}
          textareaRef={textareaRef}
          widget={mode === "widget"}
          wrapperClassName={mode === "widget" ? "" : "mt-6"}
          textareaClassName={mode === "widget" ? "min-h-24 pr-8" : "min-h-56 pr-8"}
          actionLabel={loading ? t("check.checking") : t("check.button")}
          onAction={onCheck}
          actionDisabled={loading || !canCheck}
        />

        {error && <p className="mt-10 text-base text-destructive">{error}</p>}

        {validResult?.languageMismatch && validResult.detectedLanguage && (
          <p className="mt-8 flex items-start gap-2 rounded-xl border border-primary/40 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {t("check.languageMismatch")
                .replaceAll("{detected}", ln(validResult.detectedLanguage))
                .replaceAll("{selected}", ln(language))}
            </span>
          </p>
        )}

        {loading && (
          <div className="mt-10 space-y-3">
            <div className="h-5 w-1/3 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
          </div>
        )}

        {!validResult && !loading && (
          <EmptyResultCard title={t("check.results")} hint={t("check.empty")} className={mode === "widget" ? "mt-4" : "mt-10"} />
        )}

        {validResult && !loading && (
          <section className="mt-10">
            {(() => {
              const actionText = validResult.corrected ?? validResult.submission.text;
              const actionLanguage = validResult.detectedLanguage ?? validResult.submission.language;
              const segments = validResult.corrected
                ? diffCorrected(validResult.submission.text, validResult.corrected)
                : [];
              return (
                <div className="divide-y divide-border/60">
                  {/* Original sentence, subtly separated above the corrected version */}
                  {validResult.corrected && (
                    <div className="py-5">
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("check.yourSentence")}
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
                        {validResult.submission.text}
                      </p>
                    </div>
                  )}

                  {/* Corrected sentence: primary focus, changed words highlighted and clickable */}
                  <div className="py-5">
                    {validResult.corrected ? (
                      <>
                        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {t("check.suggestedVersion")}
                        </h2>
                        <p className="mt-2 whitespace-pre-wrap text-xl leading-relaxed text-foreground">
                          {segments.map((seg, i) => {
                            const issueIndex = seg.changed
                              ? findIssueForSegment(validResult.issues, seg.text)
                              : -1;
                            const expanded = issueIndex >= 0 && openIssue === issueIndex;
                            const prev = segments[i - 1]?.text ?? "";
                            const glue =
                              i > 0 &&
                              !CJK_BOUNDARY.test(prev[prev.length - 1] ?? "") &&
                              !CJK_BOUNDARY.test(seg.text[0] ?? "")
                                ? " "
                                : "";
                            return seg.changed ? (
                              <span key={i}>
                                {glue}
                              <Button
                                type="button"
                                variant="ghost"
                                aria-expanded={expanded}
                                onClick={() => {
                                  if (issueIndex < 0) return;
                                  setOpenIssue((prevOpen) => (prevOpen === issueIndex ? null : issueIndex));
                                }}
                                className="inline h-auto gap-1 rounded bg-primary/10 px-0.5 py-0 align-baseline text-xl font-medium text-primary hover:bg-primary/15 hover:text-primary"
                              >
                                <span className="underline decoration-primary underline-offset-4">{seg.text}</span>
                                <ChevronDown
                                  aria-hidden="true"
                                  className={`ml-1 inline-block align-middle transition-transform ${expanded ? "rotate-180" : ""}`}
                                />
                              </Button>
                              </span>
                            ) : (
                              <span key={i}>
                                {glue}
                                {seg.text}
                              </span>
                            );
                          })}
                        </p>
                      </>
                    ) : (
                      <p className="text-xl font-medium leading-relaxed text-foreground">
                        {t("check.looksGood")}
                      </p>
                    )}
                    {validResult.summary && (
                      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                        {validResult.summary}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <TextActions
                        playing={speech.playingId === "check:corrected"}
                        failed={speech.errorId === "check:corrected"}
                        copied={copied}
                        onListen={() => void speech.speak("check:corrected", actionText, actionLanguage)}
                        onCopy={() => void onCopy()}
                      />
                      <SaveButton
                        item={{
                          kind: "check",
                          text: actionText,
                          language: actionLanguage,
                          detail: validResult.summary,
                          ...(validResult.corrected &&
                          validResult.submission.text !== validResult.corrected
                            ? { source: validResult.submission.text }
                            : {}),
                        }}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto gap-1.5 p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
                          >
                            <MoreHorizontal />
                            {t("check.moreActions")}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" aria-label={t("check.moreActions")}>
                          <DropdownMenuItem onSelect={() => openIn("interpret")}>
                            <ArrowUpRight />
                            {t("nav.interpret")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openIn("style")}>
                            <ArrowUpRight />
                            {t("nav.style")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Reasons share the existing highlight/accordion interaction in both views. */}
                  {validResult.issues.length > 0 && (
                    <div className="py-5">
                      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t(validResult.issues.length === 1 ? "check.reason" : "check.reasons")}
                      </h2>
                    <ul className="mt-3 space-y-3">
                      {validResult.issues.map((issue, i) => {
                        const open = openIssue === i;
                        return (
                          <li key={i} className="rounded-lg bg-secondary p-4">
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => setOpenIssue(open ? null : i)}
                              aria-expanded={open}
                              className="flex h-auto w-full items-center justify-between gap-3 whitespace-normal p-0 text-left font-normal hover:bg-transparent"
                            >
                              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <span className="text-base text-muted-foreground">
                                  <span className="line-through decoration-muted-foreground/40">
                                    {issue.original}
                                  </span>
                                  {" → "}
                                  <span className="font-medium text-foreground">{issue.suggestion}</span>
                                </span>
                                <span className="flex flex-wrap items-center gap-2">
                                {(issue.labels ?? []).map((label) => (
                                  <span
                                    key={label}
                                    className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary"
                                  >
                                    {t(`label.${label}` as TranslationKey)}
                                  </span>
                                ))}
                                </span>
                              </span>
                              <ChevronDown
                                className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                              />
                            </Button>
                            {open && (
                              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                                {issue.reason}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        )}
      </div>
    </main>
  );
}
