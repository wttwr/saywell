import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ChevronDown, Info, X } from "lucide-react";

import { LanguageSelectorBar } from "@/components/ds/LanguageSelectorBar";
import { TextInputSurface } from "@/components/ds/TextInputSurface";
import { ResultCard } from "@/components/ds/ResultCard";
import { SaveButton } from "@/components/SaveButton";
import { TextActions } from "@/components/TextActions";
import { AUTO_DETECT, INPUT_LANGUAGES, LANGUAGES } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { useDefaultOnce, useSettings } from "@/lib/settings";
import { markSeeded, useFeatureState, type FeatureMode } from "@/lib/feature-state";
import {
  interpretText,
  type InterpretExample,
  type InterpretResult,
} from "@/lib/interpret.functions";

export const Route = createFileRoute("/interpret")({
  head: () => ({
    meta: [
      { title: "Interpret — Understand tone and meaning | SayWell 会说" },
      {
        name: "description",
        content: "Understand the meaning and usage behind any word, phrase or sentence.",
      },
      { property: "og:title", content: "Interpret — Read between the lines | SayWell 会说" },
      {
        property: "og:description",
        content: "Paste any expression and see what it means and how it's used.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterpretPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ExampleList({ items }: { items: InterpretExample[] }) {
  return (
    <ul className="space-y-4">
      {items.map((ex, i) => (
        <li key={i}>
          <p className="text-lg leading-relaxed text-foreground">{ex.text}</p>
          {ex.transliteration && (
            <p className="mt-0.5 text-sm text-muted-foreground">{ex.transliteration}</p>
          )}
          {ex.note && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ex.note}</p>}
        </li>
      ))}
    </ul>
  );
}

function InterpretPage() {
  return <InterpretFeature mode="focus" />;
}

export function InterpretFeature({ mode = "focus" }: { mode?: FeatureMode }) {
  const run = useServerFn(interpretText);
  const { t, lang, ln } = useI18n();
  const [text, setText] = useFeatureState("interpret", "text", "");
  const [context, setContext] = useFeatureState("interpret", "context", "");
  const [language, setLanguage] = useFeatureState("interpret", "language", AUTO_DETECT);
  const [shortcuts, setShortcuts] = useFeatureState<string[]>("interpret", "shortcuts", [
    "English",
    "Italian",
    "Chinese (Simplified)",
  ]);
  const [copied, setCopied] = useState(false);
  const speech = useSpeech();
  const { settings } = useSettings();
  useDefaultOnce(() => {
    if (!markSeeded("interpret")) return;
    setLanguage(settings.interpretLanguage);
    setShortcuts(settings.interpretShortcuts);
  });
  const [result, setResult] = useFeatureState<InterpretResult | null>("interpret", "result", null);
  const [loading, setLoading] = useFeatureState("interpret", "loading", false);
  const [error, setError] = useFeatureState<string | null>("interpret", "error", null);
  const ref = useRef<HTMLTextAreaElement>(null);

  const onInterpret = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const explanationLanguage =
        lang === "it" ? "Italian" : lang === "zh" ? "Simplified Chinese" : "English";
      setResult(await run({ data: { text: trimmed, language, explanationLanguage, context: context.trim() } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("interpret.error"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={mode === "widget" ? "flex min-h-full flex-1 flex-col bg-background px-4 pb-4" : "min-h-screen bg-background px-5 py-10 md:px-10 md:py-16"}>
      <div className={mode === "widget" ? "mx-auto flex w-full max-w-3xl flex-1 flex-col" : "mx-auto max-w-3xl"}>
        <header className={mode === "widget" ? "sr-only" : "mb-8 md:mb-12"}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("nav.interpret")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("interpret.subtitle")}</p>
        </header>

        <LanguageSelectorBar
          label={t("interpret.language")}
          shortcutsLabel={t("style.changeTo")}
          value={language}
          onChange={setLanguage}
          shortcuts={shortcuts}
          setShortcuts={setShortcuts}
          compact={mode === "widget"}
        />

        <div className={mode === "widget" ? "mt-4" : "mt-8"}>
          <label htmlFor="interpret-context" className="text-xs text-muted-foreground">
            {t("interpret.contextLabel")}
          </label>
          <input
            id="interpret-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t("interpret.contextPlaceholder")}
            className="mt-1 w-full border-b border-border bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
          />
        </div>

        <TextInputSurface
          value={text}
          onChange={setText}
          onClear={() => {
            setText("");
            setResult(null);
          }}
          placeholder={t("interpret.placeholder")}
          language={language}
          textareaRef={ref}
          widget={mode === "widget"}
          textareaClassName={mode === "widget" ? "min-h-20" : "mt-8 min-h-32"}
          buttonClassName={mode === "widget" ? "top-1" : "top-8"}
          actionLabel={loading ? t("interpret.loading") : t("interpret.action")}
          onAction={onInterpret}
          actionDisabled={!text.trim() || loading}
        />

        {error && <p className="mt-8 text-base text-destructive">{error}</p>}

        {loading && (
          <div className="mt-10 space-y-3">
            <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-3/5 animate-pulse rounded bg-secondary" />
          </div>
        )}

        {!loading && result && (
          <div className="mt-10">
            {result.issue && (
              <p className="mb-6 flex items-start gap-2 rounded-xl border border-primary/40 bg-secondary/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{result.issue}</span>
              </p>
            )}

            <div className="space-y-8 rounded-2xl bg-secondary/40 p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <p className="text-2xl leading-snug text-foreground">{text.trim()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <TextActions
                    playing={speech.playingId === "interpret:input"}
                    failed={speech.errorId === "interpret:input"}
                    copied={copied}
                    onListen={() =>
                      speech.speak("interpret:input", text.trim(), result.detectedLanguage)
                    }
                    onCopy={async () => {
                      await navigator.clipboard.writeText(text.trim());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    }}
                  />
                  <SaveButton
                    item={{
                      kind: "interpret",
                      text: text.trim(),
                      language: result.detectedLanguage,
                      detail: result.explanation.meaning,
                    }}
                  />
                </div>
              </div>

              <Section title={t("interpret.meaning")}>
                <p className="text-base leading-relaxed text-foreground">
                  {result.explanation.meaning}
                </p>
                {result.explanation.literal && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium">{t("interpret.literal")}: </span>
                    {result.explanation.literal}
                  </p>
                )}
              </Section>
              {result.explanation.usage && (
                <Section title={t("interpret.usage")}>
                  <p className="text-base leading-relaxed text-foreground">
                    {result.explanation.usage}
                  </p>
                </Section>
              )}
              {result.explanation.examples.length > 0 && (
                <Section title={t("interpret.examples")}>
                  <ExampleList items={result.explanation.examples} />
                </Section>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
