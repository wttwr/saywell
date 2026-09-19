import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
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
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function TranslatePage() {
  const translate = useServerFn(translateText);

  const [source, setSource] = useState("");
  const [from, setFrom] = useState("English");
  const [targets, setTargets] = useState<string[]>(["Finnish"]);
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const touchX = useRef<number | null>(null);
  const addRef = useRef<HTMLDivElement>(null);

  const available = useMemo(() => LANGUAGES.filter((l) => !targets.includes(l)), [targets]);
  const activeLang = targets[active];
  const translation = activeLang ? (results[activeLang] ?? "") : "";

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
          setError(e instanceof Error ? e.message : "Translation failed. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      run();
    }, 700);

    return () => clearTimeout(timeout);
  }, [source, from, targets, translate]);

  useEffect(() => {
    if (!adding) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAdding(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [adding]);

  const onCopy = async () => {
    if (!translation) return;
    await navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 md:mb-14">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lingua</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One text, as many languages as you need.
          </p>
        </header>

        <div className="grid gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-border">
          {/* Source — left on desktop, first on mobile */}
          <section className="order-1 flex flex-col md:order-1 md:pr-10">
            <div className="flex h-11 items-center">
              <LanguageSelect
                label="Source language"
                value={from}
                onChange={setFrom}
                options={SOURCE_LANGUAGES}
              />
            </div>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Type or paste text here..."
              className="mt-6 min-h-56 w-full resize-none bg-transparent text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 md:min-h-72"
            />
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{source.length} characters</span>
              {loading && (
                <span className="text-xs text-muted-foreground">Translating...</span>
              )}
            </div>
          </section>

          {/* Target — right on desktop */}
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
                        aria-label={`Remove ${lang}`}
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
                <div ref={addRef} className="shrink-0">
                  {adding && available.length > 0 ? (
                    <select
                      autoFocus
                      aria-label="Add target language"
                      value=""
                      onChange={(e) => {
                        const lang = e.target.value;
                        setAdding(false);
                        if (!lang) return;
                        setTargets((p) => [...p, lang]);
                        setActive(targets.length);
                      }}
                      onBlur={() => setAdding(false)}
                      className="h-9 cursor-pointer rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground outline-none"
                    >
                      <option value="" disabled>
                        Select language
                      </option>
                      {available.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      aria-label="Add target language"
                      onClick={() => setAdding(true)}
                      disabled={available.length === 0}
                      className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      <Plus className="size-4" /> Add
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-6 min-h-56 md:min-h-72">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
                  <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-secondary" />
                </div>
              ) : error ? (
                <p className="text-base text-destructive">{error}</p>
              ) : translation ? (
                <p className="whitespace-pre-wrap text-xl leading-relaxed text-foreground">
                  {translation}
                </p>
              ) : (
                <p className="text-xl leading-relaxed text-muted-foreground/50">Translation</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={onCopy}
                disabled={!translation}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
