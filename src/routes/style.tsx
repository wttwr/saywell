import { LanguageSelectorBar } from "@/components/ds/LanguageSelectorBar";
import { TextInputSurface } from "@/components/ds/TextInputSurface";
import { SaveButton } from "@/components/SaveButton";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Info, Volume2, VolumeX, X } from "lucide-react";

import { AUTO_DETECT, INPUT_LANGUAGES, LANGUAGES } from "@/lib/languages";
import { exploreStyles, type StyleResult, type StyleVariant } from "@/lib/style.functions";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { markSeeded, useFeatureState, type FeatureMode } from "@/lib/feature-state";
import { useDefaultOnce, useSettings } from "@/lib/settings";

export const Route = createFileRoute("/style")({
  head: () => ({
    meta: [
      { title: "Style — Natural ways to say the same thing | SayWell 会说" },
      {
        name: "description",
        content:
          "Explore formal, casual, polite and idiomatic ways to say the same thing in one language.",
      },
      {
        property: "og:title",
        content: "Style — Explore ways to express the same meaning | SayWell 会说",
      },
      {
        property: "og:description",
        content:
          "See several natural alternatives for your text, with a short note on how each one differs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StylePage,
});

function LanguageSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  label: string;
}) {
  const { ln } = useI18n();
  return (
    <div className="relative inline-flex">
      <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
        {ln(value)}
        <ChevronDown className="size-3.5 opacity-60" />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {ln(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function StylePage() {
  return <StyleFeature mode="focus" />;
}

export function StyleFeature({ mode = "focus" }: { mode?: FeatureMode }) {
  const run = useServerFn(exploreStyles);
  const { t, lang, ln } = useI18n();
  const speech = useSpeech();

  const [text, setText] = useFeatureState("style", "text", "");
  const [language, setLanguage] = useFeatureState("style", "language", "English");
  const [shortcuts, setShortcuts] = useFeatureState<string[]>("style", "shortcuts", [
    "English",
    "Italian",
    "Chinese (Simplified)",
  ]);
  const [result, setResult] = useFeatureState<StyleResult | null>("style", "result", null);
  const [loading, setLoading] = useFeatureState("style", "loading", false);
  const [error, setError] = useFeatureState<string | null>("style", "error", null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { settings } = useSettings();
  useDefaultOnce(() => {
    if (!markSeeded("style")) return;
    setLanguage(settings.styleLanguage);
    setShortcuts(settings.styleShortcuts);
  });

  useEffect(() => {
    const existing = textareaRef.current?.value;
    if (existing && !text) setText(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canExplore = text.trim().length > 0 && !loading;
  const showLanguageNotice =
    result && language !== AUTO_DETECT && result.detectedLanguage !== language;

  const onExplore = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const explanationLanguage =
        lang === "it" ? "Italian" : lang === "zh" ? "Simplified Chinese" : "English";
      const data = await run({ data: { text: trimmed, language, explanationLanguage } });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("style.error"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async (id: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const actions = (id: string, value: string, label?: string) => {
    const playing = speech.playingId === id;
    const failed = speech.errorId === id;
    return (
      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={() => speech.speak(id, value, result?.detectedLanguage ?? language)}
          disabled={!value}
          title={playing ? t("translate.stop") : t("translate.listen")}
          aria-label={playing ? t("translate.stop") : t("translate.listen")}
          aria-pressed={playing}
          className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40 ${
            playing ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {failed ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className={`size-4 ${playing ? "animate-pulse" : ""}`} />
          )}
          {playing ? t("translate.stop") : t("translate.listen")}
        </button>
        <button
          onClick={() => onCopy(id, value)}
          disabled={!value}
          title={t("translate.copy")}
          aria-label={t("translate.copy")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          {copiedId === id ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copiedId === id ? t("translate.copied") : t("translate.copy")}
        </button>
        <SaveButton
          item={{
            kind: "style",
            text: value,
            language: result?.detectedLanguage ?? language,
            ...(label ? { detail: label } : {}),
            source: text.trim(),
          }}
        />
        {failed && <span className="text-xs text-muted-foreground">{t("translate.noAudio")}</span>}
      </div>
    );
  };

  const variantBlock = (variant: StyleVariant, id: string) => (
    <div>
      {variant.label && <h3 className="text-sm font-medium text-foreground">{variant.label}</h3>}
      <p className="mt-1 whitespace-pre-wrap text-xl leading-relaxed text-foreground">
        {variant.text}
      </p>
      {variant.transliteration && (
        <p className="mt-1 text-sm text-muted-foreground">{variant.transliteration}</p>
      )}
      {variant.explanation && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{variant.explanation}</p>
      )}
      {actions(id, variant.text, variant.label)}
    </div>
  );

  return (
    <main className={mode === "widget" ? "flex min-h-full flex-1 flex-col bg-background px-4 pb-4" : "min-h-screen bg-background px-5 py-10 md:px-10 md:py-16"}>
      <div className={mode === "widget" ? "mx-auto flex w-full max-w-3xl flex-1 flex-col" : "mx-auto max-w-3xl"}>
        <header className={mode === "widget" ? "sr-only" : "mb-8 md:mb-12"}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("style.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("style.subtitle")}</p>
        </header>

        <LanguageSelectorBar
          label={t("style.language")}
          shortcutsLabel={t("style.changeTo")}
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
          placeholder={t("style.placeholder")}
          language={language}
          textareaRef={textareaRef}
          widget={mode === "widget"}
          textareaClassName={mode === "widget" ? "min-h-20" : "mt-8 min-h-32"}
          buttonClassName={mode === "widget" ? "top-1" : "top-8"}
          actionLabel={loading ? t("style.exploring") : t("style.explore")}
          onAction={onExplore}
          actionDisabled={!canExplore}
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
            {showLanguageNotice && (
              <p className="mb-6 flex items-start gap-2 rounded-xl border border-primary/40 bg-secondary/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {t("style.languageMismatch")
                    .replaceAll("{detected}", ln(result.detectedLanguage))
                    .replaceAll("{selected}", ln(language))}
                </span>
              </p>
            )}
            <section className="border-t border-border pt-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("style.primary")}
              </h2>
              <div className="mt-3">{variantBlock(result.primary, "style:primary")}</div>
            </section>

            {result.alternatives.length > 0 ? (
              <section className="mt-10 border-t border-border pt-6">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("style.alternatives")}
                </h2>
                <div className="mt-5 space-y-8">
                  {result.alternatives.map((alt, i) => (
                    <div key={`${alt.text}-${i}`}>{variantBlock(alt, `style:alt:${i}`)}</div>
                  ))}
                </div>
              </section>
            ) : (
              result.note && (
                <p className="mt-8 text-sm leading-relaxed text-muted-foreground">{result.note}</p>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}
