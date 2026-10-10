import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Check, Copy, Volume2, VolumeX } from "lucide-react";

import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { useSavedStore, type SavedKind } from "@/lib/saved-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved — Your kept words and phrases | SayWell 会说" },
      {
        name: "description",
        content: "Review the dictionary entries, translations and style phrasings you saved.",
      },
      { property: "og:title", content: "Saved — Your kept words and phrases | SayWell 会说" },
      {
        property: "og:description",
        content: "All your saved words, translations and phrasings in one calm list.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SavedPage,
});

const FILTERS: { key: SavedKind | "all"; label: TranslationKey }[] = [
  { key: "all", label: "saved.all" },
  { key: "dictionary", label: "saved.dictionary" },
  { key: "translation", label: "saved.translation" },
  { key: "style", label: "saved.style" },
];

const KIND_LABEL: Record<SavedKind, TranslationKey> = {
  dictionary: "saved.dictionary",
  translation: "saved.translation",
  style: "saved.style",
};

function SavedPage() {
  const { t, ln, lang } = useI18n();
  const speech = useSpeech();
  const { items, remove } = useSavedStore();
  const [filter, setFilter] = useState<SavedKind | "all">("all");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "all" || i.kind === filter) &&
        (!q || [i.text, i.detail, i.source].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [items, filter, query]);

  const onCopy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const locale = lang === "zh" ? "zh-CN" : lang === "it" ? "it-IT" : "en-US";

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("saved.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("saved.subtitle")}</p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {t(f.label)}
            </button>
          ))}
        </div>

        {items.length > 0 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("saved.search")}
            className="mt-6 w-full border-b border-border bg-transparent pb-3 text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        )}

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <Bookmark className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-4 text-base text-foreground">{t("saved.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("saved.emptyBody")}</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("saved.noMatches")}</p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {visible.map((i) => {
              const playing = speech.playingId === i.id;
              const failed = speech.errorId === i.id;
              return (
                <li key={i.id} className="rounded-2xl bg-secondary/40 p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground">
                      {t(KIND_LABEL[i.kind])}
                    </span>
                    <span>
                      {i.sourceLanguage ? `${ln(i.sourceLanguage)} → ` : ""}
                      {ln(i.language)}
                    </span>
                    <span>· {new Date(i.savedAt).toLocaleDateString(locale)}</span>
                  </div>
                  {i.source && i.kind !== "dictionary" && (
                    <p className="mt-3 text-sm text-muted-foreground">{i.source}</p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-xl leading-relaxed text-foreground">
                    {i.text}
                  </p>
                  {i.transliteration && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{i.transliteration}</p>
                  )}
                  {i.detail && <p className="mt-2 text-sm text-muted-foreground">{i.detail}</p>}
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={() => speech.speak(i.id, i.text, i.language)}
                      title={playing ? t("translate.stop") : t("translate.listen")}
                      aria-label={playing ? t("translate.stop") : t("translate.listen")}
                      className={cn(
                        "flex items-center gap-1.5 text-sm transition-colors",
                        playing ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {failed ? (
                        <VolumeX className="size-4" />
                      ) : (
                        <Volume2 className={cn("size-4", playing && "animate-pulse")} />
                      )}
                      {playing ? t("translate.stop") : t("translate.listen")}
                    </button>
                    <button
                      onClick={() => onCopy(i.id, i.text)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copiedId === i.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiedId === i.id ? t("translate.copied") : t("translate.copy")}
                    </button>
                    <button
                      onClick={() => remove(i.id)}
                      title={t("saved.unsave")}
                      aria-label={t("saved.unsave")}
                      className="ml-auto flex items-center text-primary transition-colors hover:text-foreground"
                    >
                      <Bookmark className="size-4 fill-current" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
