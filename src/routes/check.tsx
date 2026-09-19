import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check as CheckIcon, Copy } from "lucide-react";

import { LANGUAGES } from "@/lib/languages";
import { checkText, type CheckResult } from "@/lib/check.functions";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check — Is your writing correct and natural? | Lingua" },
      {
        name: "description",
        content:
          "Paste a sentence or paragraph and see whether it is grammatically correct and sounds natural in the language you chose.",
      },
      { property: "og:title", content: "Check your writing — Lingua" },
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

function CheckPage() {
  const runCheck = useServerFn(checkText);

  const [text, setText] = useState("");
  const [language, setLanguage] = useState("Finnish");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onCheck = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runCheck({ data: { text: trimmed, language } });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The check failed. Please try again.");
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Check</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See whether your writing is correct and sounds natural.
          </p>
        </header>

        <div className="flex h-11 items-center gap-3">
          <span className="text-sm text-muted-foreground">Language</span>
          <select
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="cursor-pointer rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste a sentence or paragraph..."
          className="mt-6 min-h-56 w-full resize-none bg-transparent text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
        />

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{text.length} characters</span>
          <button
            onClick={onCheck}
            disabled={loading || !text.trim()}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Checking..." : "Check"}
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
                {result.status}
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
                  <h2 className="text-sm font-medium text-muted-foreground">Suggested version</h2>
                  <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? <CheckIcon className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-xl leading-relaxed text-foreground">
                  {result.corrected}
                </p>
              </div>
            )}

            {result.issues.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Reasons</h2>
                <ul className="mt-4 space-y-8">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="border-t border-border pt-6">
                      <div className="flex flex-wrap gap-2">
                        {(issue.labels ?? []).map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <dl className="mt-4 space-y-3 text-base leading-relaxed">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Original
                          </dt>
                          <dd className="text-foreground/70 line-through decoration-muted-foreground/40">
                            {issue.original}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Suggestion
                          </dt>
                          <dd className="font-medium text-foreground">{issue.suggestion}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Reason
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
