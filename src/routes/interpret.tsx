import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ChevronDown, Info, X } from "lucide-react";

import { DictateButton } from "@/components/DictateButton";
import { AUTO_DETECT, INPUT_LANGUAGES } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
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
        content: "Understand the meaning, usage and grammar behind any word, phrase or sentence.",
      },
      { property: "og:title", content: "Interpret — Read between the lines | SayWell 会说" },
      {
        property: "og:description",
        content: "Paste any expression and see what it means, how it's used and how it's built.",
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
  const run = useServerFn(interpretText);
  const { t, lang, ln } = useI18n();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState(AUTO_DETECT);
  const [result, setResult] = useState<InterpretResult | null>(null);
  const [tab, setTab] = useState<"explanation" | "grammar">("explanation");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  const onInterpret = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const explanationLanguage =
        lang === "it" ? "Italian" : lang === "zh" ? "Simplified Chinese" : "English";
      setResult(await run({ data: { text: trimmed, language, explanationLanguage } }));
      setTab("explanation");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("interpret.error"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const tabBtn = (id: "explanation" | "grammar", label: string) => (
    <button
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
        tab === id
          ? "bg-primary text-primary-foreground"
          : "bg-secondary/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("nav.interpret")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("interpret.subtitle")}</p>
        </header>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="text-sm text-muted-foreground">{t("interpret.language")}</span>
          <div className="relative inline-flex">
            <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
              {ln(language)}
              <ChevronDown className="size-3.5 opacity-60" />
            </span>
            <select
              aria-label={t("interpret.language")}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            >
              {INPUT_LANGUAGES.map((o) => (
                <option key={o} value={o}>
                  {ln(o)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("interpret.placeholder")}
            className="mt-8 min-h-32 w-full resize-none bg-transparent pr-10 text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {text ? (
            <button
              type="button"
              onClick={() => {
                setText("");
                setResult(null);
                ref.current?.focus();
              }}
              aria-label="Clear text"
              title="Clear text"
              className="absolute right-0 top-8 rounded-full bg-secondary p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            <DictateButton language={language} onText={setText} className="absolute right-0 top-8" />
          )}
        </div>

        <button
          onClick={onInterpret}
          disabled={!text.trim() || loading}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {loading ? t("interpret.loading") : t("interpret.action")}
        </button>

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
            <div className="flex gap-2">
              {tabBtn("explanation", t("interpret.tabExplanation"))}
              {tabBtn("grammar", t("interpret.tabGrammar"))}
            </div>

            <div className="mt-8 space-y-8">
              {tab === "explanation" ? (
                <>
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
                </>
              ) : (
                <>
                  {result.grammar.structure.length > 0 && (
                    <Section title={t("interpret.structure")}>
                      <dl className="space-y-2">
                        {result.grammar.structure.map((s, i) => (
                          <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                            <dt className="shrink-0 text-base font-medium text-foreground sm:w-48">
                              {s.part}
                            </dt>
                            <dd className="text-sm leading-relaxed text-muted-foreground sm:pt-0.5">
                              {s.role}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Section>
                  )}
                  {result.grammar.explanation && (
                    <Section title={t("interpret.grammarExplanation")}>
                      <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                        {result.grammar.explanation}
                      </p>
                    </Section>
                  )}
                  {result.grammar.rules.length > 0 && (
                    <Section title={t("interpret.rules")}>
                      <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-foreground">
                        {result.grammar.rules.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </Section>
                  )}
                  {result.grammar.variations.length > 0 && (
                    <Section title={t("interpret.variations")}>
                      <ExampleList items={result.grammar.variations} />
                    </Section>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <p className="mt-10 text-sm text-muted-foreground/70">{t("interpret.empty")}</p>
        )}
      </div>
    </main>
  );
}
