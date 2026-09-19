import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Copy,
  Plus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { LANGUAGES, SOURCE_LANGUAGES } from "@/lib/languages";
import { translateText } from "@/lib/translate.functions";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lingua — Translate text into many languages at once" },
      {
        name: "description",
        content:
          "Paste text once and translate it into several languages at the same time, then compare every version side by side.",
      },
      { property: "og:title", content: "Lingua — Multi-language text translator" },
      {
        property: "og:description",
        content:
          "A calm, focused translator: one source text, many target languages, all versions in one overview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TranslatePage,
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
  return (
    <div className="relative inline-flex">
      <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors">
        {value}
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
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TranslatePage() {
  const translate = useServerFn(translateText);
  const { t } = useI18n();
  const speech = useSpeech();

  const [source, setSource] = useState("");
  const [from, setFrom] = useState("English");
  const [targets, setTargets] = useState<string[]>(["Chinese (Simplified)", "Italian"]);
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Record<string, string>>({});
  const [alternatives, setAlternatives] = useState<
    Record<string, { text: string; note?: string }[]>
  >({});
  const [showAllAlts, setShowAllAlts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const addRef = useRef<HTMLDivElement>(null);

  const available = useMemo(() => LANGUAGES.filter((l) => !targets.includes(l)), [targets]);
  const activeLang = targets[active];

  const removeTarget = (lang: string) => {
    setTargets((prev) => {
      const next = prev.filter((l) => l !== lang);
      setActive((i) => Math.max(0, Math.min(i, next.length - 1)));
      return next;
    });
  };

  const addTarget = (lang: string) => {
    if (!lang) return;
    setTargets((p) => [...p, lang]);
    setActive(targets.length);
  };

  const swapLanguages = () => {
    const lang = targets[active];
    if (!lang) return;
    const translated = results[lang] ?? "";
    const previousSource = source;
    setFrom(lang);
    setTargets((prev) => prev.map((l, i) => (i === active ? from : l)));
    setSource(translated);
    setResults(translated ? { [from]: previousSource } : {});
  };

  useEffect(() => {
    const trimmed = source.trim();
    if (!trimmed || targets.length === 0) {
      setResults({});
      setError(null);
      return;
    }

    const timeout = setTimeout(() => {
      const run = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await translate({ data: { text: trimmed, from, targets } });
          setResults(data.results);
        } catch (e) {
          setError(e instanceof Error ? e.message : t("translate.error"));
        } finally {
          setLoading(false);
        }
      };
      run();
    }, 700);

    return () => clearTimeout(timeout);
  }, [source, from, targets, translate]);

  const onCopy = async (lang: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 1600);
  };

  const AddControl = (
    <div ref={addRef} className="relative inline-flex shrink-0">
      <span className="pointer-events-none flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground">
        <Plus className="size-4" /> {t("translate.add")}
      </span>
      <select
        aria-label={t("translate.addLanguage")}
        value=""
        disabled={available.length === 0}
        onChange={(e) => e.target.value && addTarget(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      >
        <option value="" disabled>
          {t("translate.selectLanguage")}
        </option>
        {LANGUAGES.map((l) => (
          <option key={l} value={l} disabled={targets.includes(l)}>
            {l}
            {targets.includes(l) ? " ✓" : ""}
          </option>
        ))}
      </select>
    </div>
  );

  const SwapControl = (
    <button
      onClick={swapLanguages}
      title={t("translate.swap")}
      aria-label={t("translate.swap")}
      disabled={!targets[active]}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
    >
      <ArrowLeftRight className="size-4" />
    </button>
  );

  const listenButton = (
    id: string,
    text: string,
    language: string | undefined,
    compact = false,
  ) => {
    const playing = speech.playingId === id;
    const failed = speech.errorId === id;
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => language && speech.speak(id, text, language)}
          disabled={!language || !text.trim()}
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
          {!compact && (playing ? t("translate.stop") : t("translate.listen"))}
        </button>
        {failed && <span className="text-xs text-muted-foreground">{t("translate.noAudio")}</span>}
      </div>
    );
  };

  const copyButton = (lang: string | undefined, value: string, compact = false) => (
    <button
      onClick={() => lang && onCopy(lang, value)}
      disabled={!lang || !value}
      title={t("translate.copy")}
      aria-label={t("translate.copy")}
      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
    >
      {copiedLang === lang ? <Check className="size-4" /> : <Copy className="size-4" />}
      {!compact && (copiedLang === lang ? t("translate.copied") : t("translate.copy"))}
    </button>
  );

  const resultBody = (lang: string | undefined) => {
    const translation = lang ? (results[lang] ?? "") : "";
    if (loading) {
      return (
        <div className="space-y-3">
          <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-secondary" />
        </div>
      );
    }
    if (error) return <p className="text-base text-destructive">{error}</p>;
    if (translation)
      return (
        <p className="whitespace-pre-wrap text-xl leading-relaxed text-foreground">{translation}</p>
      );
    return (
      <p className="text-xl leading-relaxed text-muted-foreground/50">
        {t("translate.emptyTranslation")}
      </p>
    );
  };


  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("translate.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("translate.subtitle")}</p>
        </header>

        <div className="relative grid gap-10 md:grid-cols-2">
          <div className="absolute left-1/2 top-1 z-10 hidden -translate-x-1/2 md:block">
            {SwapControl}
          </div>

          <section className="flex flex-col md:pr-10">
            <div className="flex h-11 items-center">
              <LanguageSelect
                label={t("translate.sourceLanguage")}
                value={from}
                onChange={setFrom}
                options={SOURCE_LANGUAGES}
              />
            </div>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={t("translate.placeholder")}
              className="mt-6 min-h-40 w-full flex-1 resize-none bg-transparent text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {listenButton("source", source, from)}
                <span className="text-xs text-muted-foreground">
                  {source.length} {t("translate.characters")}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {loading && (
                  <span className="text-xs text-muted-foreground">{t("translate.translating")}</span>
                )}
                {copyButton("source", source)}
              </div>
            </div>
          </section>

          <section className="flex flex-col md:pl-10">
            <div className="flex h-11 items-center gap-1">
              <div className="flex flex-1 items-center gap-1 overflow-x-auto">
                {targets.map((lang, i) => (
                  <button
                    key={lang}
                    onClick={() => setActive(i)}
                    className={`group flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm transition-colors ${
                      i === active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {lang}
                    {targets.length > 1 && (
                      <span
                        role="button"
                        aria-label={`${t("translate.remove")} ${lang}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTarget(lang);
                        }}
                        className="opacity-40 transition-opacity hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </span>
                    )}
                  </button>
                ))}
                {AddControl}
              </div>
            </div>

            <div className="mt-6 min-h-56 md:min-h-72">{resultBody(activeLang)}</div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {listenButton(
                `target:${activeLang ?? ""}`,
                activeLang ? (results[activeLang] ?? "") : "",
                activeLang,
              )}
              {copyButton(activeLang, activeLang ? (results[activeLang] ?? "") : "")}
            </div>
          </section>
        </div>

      </div>
    </main>
  );
}
