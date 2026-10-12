import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Check, Copy, Search, Volume2, VolumeX } from "lucide-react";

import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { groupSavedItems, useSavedStore, type SavedKind } from "@/lib/saved-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  { key: "check", label: "saved.check" },
];

const KIND_LABEL: Record<SavedKind, TranslationKey> = {
  dictionary: "saved.dictionary",
  translation: "saved.translation",
  style: "saved.style",
  check: "saved.check",
};

function SavedPage() {
  const { t, ln, lang } = useI18n();
  const speech = useSpeech();
  const { items, remove, removeGroup } = useSavedStore();
  const [filter, setFilter] = useState<SavedKind | "all">("all");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupSavedItems(items).filter(
      (group) =>
        group.some((i) => filter === "all" || i.kind === filter) &&
        (!q || group.some((i) => [i.text, i.detail, i.source, i.language, i.dictionaryEntry?.etymology, ...i.dictionaryEntry?.senses.map((s) => `${s.definition} ${s.example ?? ""}`) ?? []].some((v) => v?.toLowerCase().includes(q)))),
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
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("saved.search")}
              className="w-full border-b border-border bg-transparent pb-3 pl-7 text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
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
            {visible.map((group) => {
              const i = group[0];
              if (!i) return null;
              const entry = i.dictionaryEntry;
              const grouped = Boolean(i.groupId);
              return (
                <li key={i.groupId ?? i.id} className="rounded-2xl bg-secondary/40 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground">
                      {grouped ? t("vocab.multilingual") : t(KIND_LABEL[i.kind])}
                    </span>
                    <span>
                      {grouped ? ln(i.sourceLanguage ?? i.language) : `${i.sourceLanguage ? `${ln(i.sourceLanguage)} → ` : ""}${ln(i.language)}`}
                    </span>
                    <span>· {new Date(i.savedAt).toLocaleDateString(locale)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => i.groupId ? removeGroup(i.groupId) : remove(i.id)}
                    title={t("saved.unsave")}
                    aria-label={t("saved.unsave")}
                    className="shrink-0 text-primary"
                  >
                    <Bookmark className="size-4 fill-current" />
                  </Button>
                  </div>
                  {i.source && i.kind !== "dictionary" && (
                    <div className={cn("mt-3", grouped && "pb-4")}>
                      {grouped && <p className="text-xs text-muted-foreground">{ln(i.sourceLanguage ?? i.language)} · {t("translate.sourceLabel")}</p>}
                      <p className={grouped ? "mt-1 whitespace-pre-wrap break-words text-xl text-foreground" : "text-sm text-muted-foreground"}>{i.source}</p>
                    </div>
                  )}
                  <div className={cn(grouped && "divide-y divide-border/60")}>
                  {group.map((row) => {
                    const playing = speech.playingId === row.id;
                    const failed = speech.errorId === row.id;
                    return <div key={row.id} className={cn(grouped && "py-4 last:pb-0")}>
                  {grouped && <p className="text-xs font-medium text-muted-foreground">{ln(row.language)}</p>}
                  <p className="mt-2 whitespace-pre-wrap break-words text-xl leading-relaxed text-foreground">
                    {row.text}
                  </p>
                  {row.transliteration && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{row.transliteration}</p>
                  )}
                  {row.detail && <p className="mt-2 text-sm text-muted-foreground">{row.detail}</p>}
                  {entry?.expandedForm && <div className="mt-5"><p className="text-xs text-muted-foreground">{t("vocab.expandedForm")}</p><p className="mt-1 text-foreground">{entry.expandedForm}</p></div>}
                  {entry?.imageUrl && <img src={entry.imageUrl} alt={entry.text} loading="lazy" className="mt-5 max-h-64 w-full rounded-xl object-cover" />}
                  {entry && entry.senses.length > 0 && <ul className="mt-5 space-y-4 border-t border-border pt-5">{entry.senses.map((sense, index) => <li key={index}><p className="text-sm text-foreground">{sense.partOfSpeech && <span className="mr-2 italic text-muted-foreground">{sense.partOfSpeech}</span>}{sense.definition}</p>{sense.example && <p className="mt-1 text-sm text-muted-foreground">{sense.example}{sense.exampleTranslation ? ` — ${sense.exampleTranslation}` : ""}</p>}</li>)}</ul>}
                  {entry?.etymology && <div className="mt-5 border-t border-border pt-5"><p className="text-xs text-muted-foreground">{t("vocab.etymology")}</p><p className="mt-1 text-sm text-foreground/80">{entry.etymology}</p></div>}
                  {entry?.note && <p className="mt-4 text-sm text-muted-foreground">{entry.note}</p>}
                  <div className="mt-4 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => speech.speak(row.id, row.text, row.language)}
                      title={playing ? t("translate.stop") : t("translate.listen")}
                      aria-label={playing ? t("translate.stop") : t("translate.listen")}
                      className={cn(
                        "h-8 gap-1.5 px-0 text-sm font-normal transition-colors",
                        playing ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {failed ? (
                        <VolumeX className="size-4" />
                      ) : (
                        <Volume2 className={cn("size-4", playing && "animate-pulse")} />
                      )}
                      {playing ? t("translate.stop") : t("translate.listen")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => onCopy(row.id, row.text)}
                      className="h-8 gap-1.5 px-0 text-sm font-normal text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copiedId === row.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiedId === row.id ? t("translate.copied") : t("translate.copy")}
                    </Button>
                  </div>
                  </div>;
                  })}
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
