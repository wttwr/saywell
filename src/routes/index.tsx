import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Columns3,
  Copy,
  Plus,
  RectangleHorizontal,
  Rows3,
  X,
} from "lucide-react";

import { LANGUAGES, SOURCE_LANGUAGES } from "@/lib/languages";
import { translateText } from "@/lib/translate.functions";
import { useI18n, type TranslationKey } from "@/lib/i18n";

type DisplayMode = "carousel" | "side" | "stacked";

const MODES: { id: DisplayMode; labelKey: TranslationKey; Icon: typeof Columns3 }[] = [
  { id: "carousel", labelKey: "mode.carousel", Icon: RectangleHorizontal },
  { id: "side", labelKey: "mode.side", Icon: Columns3 },
  { id: "stacked", labelKey: "mode.stacked", Icon: Rows3 },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lingua — Translate text into many languages at once" },
      {
        name: "description",
        content:
          "Paste text once and translate it into several languages at the same time, then swipe between results.",
      },
      { property: "og:title", content: "Lingua — Multi-language text translator" },
      {
        property: "og:description",
        content:
          "A calm, focused translator: one source text, many target languages, instant switching between results.",
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

  const [source, setSource] = useState("");
  const [from, setFrom] = useState("English");
  const [targets, setTargets] = useState<string[]>(["Chinese (Simplified)", "Italian"]);
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [mode, setMode] = useState<DisplayMode>("carousel");
  const touchX = useRef<number | null>(null);
  const addRef = useRef<HTMLDivElement>(null);

  const available = useMemo(() => LANGUAGES.filter((l) => !targets.includes(l)), [targets]);
  const activeLang = targets[active];

  const go = (dir: -1 | 1) => {
    if (targets.length < 2) return;
    setActive((i) => (i + dir + targets.length) % targets.length);
  };

  const removeTarget = (lang: string) => {
    setTargets((prev) => {
      const next = prev.filter((l) => l !== lang);
      setActive((i) => Math.max(0, Math.min(i, next.length - 1)));
      return next;
    });
  };

  const replaceTarget = (index: number, lang: string) => {
    setTargets((prev) => {
      if (prev.includes(lang)) return prev;
      const next = [...prev];
      next[index] = lang;
      return next;
    });
  };

  const addTarget = (lang: string) => {
    if (!lang) return;
    setTargets((p) => [...p, lang]);
    setActive(targets.length);
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
          const data = await translate({
            data: {
              text: trimmed,
              from,
              targets,
            },
          });
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


  const onCopy = async (lang: string) => {
    const value = results[lang];
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

  const sourceBody = (
    <>
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
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {source.length} {t("translate.characters")}
        </span>
        {loading && (
          <span className="text-xs text-muted-foreground">{t("translate.translating")}</span>
        )}
      </div>
    </>
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

  const copyButton = (lang: string | undefined) => (
    <button
      onClick={() => lang && onCopy(lang)}
      disabled={!lang || !results[lang]}
      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
    >
      {copiedLang === lang ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copiedLang === lang ? t("translate.copied") : t("translate.copy")}
    </button>
  );

  const targetPanel = (lang: string, index: number) => (
    <section key={lang} className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-11 items-center gap-1">
        <select
          aria-label={lang}
          value={lang}
          onChange={(e) => replaceTarget(index, e.target.value)}
          className="min-w-0 cursor-pointer truncate rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-accent"
        >
          {[lang, ...available].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {targets.length > 1 && (
          <button
            aria-label={`${t("translate.remove")} ${lang}`}
            onClick={() => removeTarget(lang)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="mt-6 min-h-32 flex-1">{resultBody(lang)}</div>
      <div className="mt-6 flex items-center justify-end">{copyButton(lang)}</div>
    </section>
  );

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 md:mb-12">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("translate.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("translate.subtitle")}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
            {MODES.map(({ id, labelKey, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                title={t(labelKey)}
                aria-label={t(labelKey)}
                aria-pressed={mode === id}
                className={`rounded-full p-2 transition-colors ${
                  mode === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </header>

        {mode === "carousel" ? (
          <div className="grid gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-border">
            <section className="order-1 flex flex-col md:order-1 md:pr-10">{sourceBody}</section>

            <section
              className="order-2 flex flex-col md:order-2 md:pl-10"
              onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
              onTouchEnd={(e) => {
                if (touchX.current === null) return;
                const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
                touchX.current = null;
              }}
            >
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

              <div className="mt-6 flex items-center justify-end">{copyButton(activeLang)}</div>
            </section>
          </div>
        ) : mode === "side" ? (
          <div className="overflow-x-auto">
            <div className="flex min-w-full items-stretch divide-x divide-border">
              <section className="flex min-w-[260px] flex-1 flex-col pr-6">{sourceBody}</section>
              {targets.map((lang, i) => (
                <div key={lang} className="flex min-w-[260px] flex-1 px-6 last:pr-0">
                  {targetPanel(lang, i)}
                </div>
              ))}
            </div>
            <div className="mt-6">{AddControl}</div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col divide-y divide-border">
              <section className="flex flex-col pb-8">{sourceBody}</section>
              {targets.map((lang, i) => (
                <div key={lang} className="flex py-8 last:pb-0">
                  {targetPanel(lang, i)}
                </div>
              ))}
            </div>
            <div className="mt-6">{AddControl}</div>
          </div>
        )}
      </div>
    </main>
  );
}
