import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check as CheckIcon, ChevronDown, Copy } from "lucide-react";

import { LANGUAGES } from "@/lib/languages";
import { checkText, type CheckResult } from "@/lib/check.functions";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useDefaultOnce, useSettings } from "@/lib/settings";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check — Is your writing correct and natural? | SayWays" },
      {
        name: "description",
        content:
          "Paste a sentence or paragraph and see whether it is grammatically correct and sounds natural in the language you chose.",
      },
      { property: "og:title", content: "Check your writing — SayWays" },
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

function statusTone(status: CheckResult["status"]) {
  if (status === "Looks good") return "bg-accent text-accent-foreground";
  if (status === "A few issues found") return "bg-secondary text-secondary-foreground";
  return "bg-secondary text-secondary-foreground";
}

function labelTone(label: string) {
  if (label === "Typo") return "border-border bg-muted text-muted-foreground";
  if (label === "Naturalness") return "border-primary/25 bg-primary/10 text-primary";
  return "border-border bg-secondary text-secondary-foreground";
}

function CheckPage() {
  const runCheck = useServerFn(checkText);
  const { t, lang } = useI18n();

  const [text, setText] = useState("");
  const [language, setLanguage] = useState("English");
  const [shortcuts, setShortcuts] = useState<string[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { settings } = useSettings();
  useDefaultOnce(() => {
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
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("check.error"));
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async () => {
    if (!result?.corrected) return;
    await navigator.clipboard.writeText(result.corrected);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("check.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("check.subtitle")}</p>
        </header>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-sm text-muted-foreground">{t("check.language")}</span>
            <div className="relative inline-flex">
              <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
                {language}
                <ChevronDown className="size-3.5 opacity-60" />
              </span>
              <select
                aria-label={t("check.language")}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-sm text-muted-foreground">{t("check.changeTo")}</span>
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut}
                onClick={() => setLanguage(shortcut)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  shortcut === language
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {shortcut}
              </button>
            ))}
            <div className="relative inline-flex">
              <span className="pointer-events-none rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm text-muted-foreground">
                + {t("translate.add")}
              </span>
              <select
                aria-label={t("translate.addLanguage")}
                value=""
                onChange={(e) => {
                  const next = e.target.value;
                  if (next) {
                    setShortcuts((current) =>
                      current.includes(next) ? current : [...current, next],
                    );
                  }
                  e.target.value = "";
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              >
                <option value="" disabled>
                  {t("translate.addLanguage")}
                </option>
                {LANGUAGES.map((option) => (
                  <option key={option} value={option} disabled={shortcuts.includes(option)}>
                    {shortcuts.includes(option) ? `✓ ${option}` : option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("check.placeholder")}
          className="mt-6 min-h-56 w-full resize-none bg-transparent text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
        />

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {text.length} {t("check.characters")}
          </span>
          <button
            onClick={onCheck}
            disabled={loading || !canCheck}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? t("check.checking") : t("check.button")}
          </button>
        </div>

        {error && <p className="mt-10 text-base text-destructive">{error}</p>}

        {loading && (
          <div className="mt-10 space-y-3">
            <div className="h-5 w-1/3 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
          </div>
        )}

        {result && !loading && (
          <section className="mt-12 space-y-10">
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusTone(result.status)}`}
              >
                {t(`status.${result.status}` as TranslationKey)}
              </span>
              {result.summary && (
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {result.summary}
                </p>
              )}
            </div>

            {result.corrected && (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {t("check.suggestedVersion")}
                  </h2>
                  <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? <CheckIcon className="size-4" /> : <Copy className="size-4" />}
                    {copied ? t("check.copied") : t("check.copy")}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-xl leading-relaxed text-foreground">
                  {result.corrected}
                </p>
              </div>
            )}

            {result.issues.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">{t("check.reasons")}</h2>
                <ul className="mt-4 space-y-8">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="border-t border-border pt-6">
                      <div className="flex flex-wrap gap-2">
                        {(issue.labels ?? []).map((label) => (
                          <span
                            key={label}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${labelTone(label)}`}
                          >
                            {t(`label.${label}` as TranslationKey)}
                          </span>
                        ))}
                      </div>
                      <dl className="mt-4 space-y-3 text-base leading-relaxed">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("check.original")}
                          </dt>
                          <dd className="text-foreground/70 line-through decoration-muted-foreground/40">
                            {issue.original}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("check.suggestion")}
                          </dt>
                          <dd className="font-medium text-foreground">{issue.suggestion}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("check.reason")}
                          </dt>
                          <dd className="text-muted-foreground">{issue.reason}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
