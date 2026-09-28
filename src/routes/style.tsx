import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Volume2, VolumeX } from "lucide-react";

import { exploreStyles, type StyleResult, type StyleVariant } from "@/lib/style.functions";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";


export const Route = createFileRoute("/style")({
  head: () => ({
    meta: [
      { title: "Style — Natural ways to say the same thing | SayWell 会说" },
      {
        name: "description",
        content:
          "Explore formal, casual, polite and idiomatic ways to say the same thing in one language.",
      },
      { property: "og:title", content: "Style — Explore ways to express the same meaning | SayWell 会说" },
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


function StylePage() {
  const run = useServerFn(exploreStyles);
  const { t, lang } = useI18n();
  const speech = useSpeech();

  const [text, setText] = useState("");
  const [result, setResult] = useState<StyleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const language = result?.detectedLanguage || "";

  useEffect(() => {
    const existing = textareaRef.current?.value;
    if (existing && !text) setText(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canExplore = text.trim().length > 0 && !loading;

  const onExplore = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const explanationLanguage =
        lang === "it" ? "Italian" : lang === "zh" ? "Simplified Chinese" : "English";
      const data = await run({ data: { text: trimmed, explanationLanguage } });
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

  const actions = (id: string, value: string) => {
    const playing = speech.playingId === id;
    const failed = speech.errorId === id;
    return (
      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={() => speech.speak(id, value, language)}
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
        {failed && <span className="text-xs text-muted-foreground">{t("translate.noAudio")}</span>}
      </div>
    );
  };

  const variantBlock = (variant: StyleVariant, id: string) => (
    <div>
      {variant.label && (
        <h3 className="text-sm font-medium text-foreground">{variant.label}</h3>
      )}
      <p className="mt-1 whitespace-pre-wrap text-xl leading-relaxed text-foreground">
        {variant.text}
      </p>
      {variant.transliteration && (
        <p className="mt-1 text-sm text-muted-foreground">{variant.transliteration}</p>
      )}
      {variant.explanation && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{variant.explanation}</p>
      )}
      {actions(id, variant.text)}
    </div>
  );

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("style.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("style.subtitle")}</p>
        </header>

        <p className="text-sm text-muted-foreground">{t("style.autoDetect")}</p>


        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("style.placeholder")}
          className="mt-8 min-h-32 w-full resize-none bg-transparent text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
        />

        <button
          onClick={onExplore}
          disabled={!canExplore}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {loading ? t("style.exploring") : t("style.explore")}
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
