import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Check, ChevronDown, Copy, Search, Volume2, VolumeX, X } from "lucide-react";

import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { groupSavedItems, useSavedStore, type SavedKind } from "@/lib/saved-store";
import { cn } from "@/lib/utils";
import { DictateButton } from "@/components/DictateButton";

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

const DICTATE_LANG: Record<string, string> = {
  en: "English",
  it: "Italian",
  zh: "Chinese (Simplified)",
};

/** Above this length a collapsed card clamps its text to three lines. */
const LONG_TEXT = 160;

function SavedPage() {
  const { t, ln, lang } = useI18n();
  const speech = useSpeech();
  const { items, remove, removeGroup } = useSavedStore();
  const [filter, setFilter] = useState<SavedKind | "all">("all");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const searching = query.trim().length > 0;

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
          <div className="mt-6 flex items-center gap-3 border-b border-border pb-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("saved.search")}
              aria-label={t("saved.search")}
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                title="Clear search"
                className="shrink-0 rounded-full bg-secondary p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : (
              <DictateButton
                language={DICTATE_LANG[lang] ?? "English"}
                onText={setQuery}
                className="shrink-0"
              />
            )}
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
              const key = i.groupId ?? i.id;
              const isOpen = searching || Boolean(open[key]);
              const hasMore =
                Boolean(
                  entry &&
                    (entry.senses.length > 1 ||
                      entry.expandedForm ||
                      entry.imageUrl ||
                      entry.etymology ||
                      entry.note),
                ) ||
                (grouped && group.length > 1) ||
                group.some(
                  (row) =>
                    row.text.length > LONG_TEXT || (row.detail?.length ?? 0) > LONG_TEXT ||
                    (i.source?.length ?? 0) > LONG_TEXT,
                );
              const rows = isOpen || !grouped ? group : group.slice(0, 1);
              const senses = entry ? (isOpen ? entry.senses : entry.senses.slice(0, 1)) : [];

              return (
                <li key={key} className="rounded-2xl bg-secondary/40 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground">
                        {grouped ? t("vocab.multilingual") : t(KIND_LABEL[i.kind])}
                      </span>
                      <span>
                        {grouped ? ln(i.sourceLanguage ?? i.language) : `${i.sourceLanguage ? `${ln(i.sourceLanguage)} → ` : ""}${ln(i.language)}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => (i.groupId ? removeGroup(i.groupId) : remove(i.id))}
                      title={t("saved.unsave")}
                      aria-label={t("saved.unsave")}
                      aria-pressed
                      className="flex shrink-0 items-center gap-1.5 text-sm transition-colors text-primary"
                    >
                      <Bookmark className="size-4 fill-current" />
                      {t("saved.savedLabel")}
                    </button>
                  </div>

                  {i.source && i.kind !== "dictionary" && (
                    <div className={cn("mt-3", grouped && "pb-4")}>
                      {grouped && (
                        <p className="text-xs text-muted-foreground">
                          {ln(i.sourceLanguage ?? i.language)} · {t("translate.sourceLabel")}
                        </p>
                      )}
                      <p
                        className={cn(
                          grouped
                            ? "mt-1 whitespace-pre-wrap break-words text-xl text-foreground"
                            : "text-sm text-muted-foreground",
                          !isOpen && "line-clamp-3",
                        )}
                      >
                        {i.source}
                      </p>
                    </div>
                  )}

                  <div className={cn(grouped && "divide-y divide-border/60")}>
                    {rows.map((row) => {
                      const playing = speech.playingId === row.id;
                      const failed = speech.errorId === row.id;
                      return (
                        <div key={row.id} className={cn(grouped && "py-4 last:pb-0")}>
                          {grouped && (
                            <p className="text-xs font-medium text-muted-foreground">
                              {ln(row.language)}
                            </p>
                          )}
                          <p
                            className={cn(
                              "mt-2 whitespace-pre-wrap break-words text-xl leading-relaxed text-foreground",
                              !isOpen && "line-clamp-3",
                            )}
                          >
                            {row.text}
                          </p>
                          {row.transliteration && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {row.transliteration}
                            </p>
                          )}
                          {row.detail && (
                            <p
                              className={cn(
                                "mt-2 text-sm text-muted-foreground",
                                !isOpen && "line-clamp-3",
                              )}
                            >
                              {row.detail}
                            </p>
                          )}
                          {isOpen && entry?.expandedForm && (
                            <div className="mt-5">
                              <p className="text-xs text-muted-foreground">
                                {t("vocab.expandedForm")}
                              </p>
                              <p className="mt-1 text-foreground">{entry.expandedForm}</p>
                            </div>
                          )}
                          {isOpen && entry?.imageUrl && (
                            <img
                              src={entry.imageUrl}
                              alt={entry.text}
                              loading="lazy"
                              className="mt-5 max-h-64 w-full rounded-xl object-cover"
                            />
                          )}
                          {senses.length > 0 && (
                            <ul className="mt-5 space-y-4 border-t border-border pt-5">
                              {senses.map((sense, index) => (
                                <li key={index}>
                                  <p className="text-sm text-foreground">
                                    {sense.partOfSpeech && (
                                      <span className="mr-2 italic text-muted-foreground">
                                        {sense.partOfSpeech}
                                      </span>
                                    )}
                                    {sense.definition}
                                  </p>
                                  {sense.example && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {sense.example}
                                      {sense.exampleTranslation ? ` — ${sense.exampleTranslation}` : ""}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          {isOpen && entry?.etymology && (
                            <div className="mt-5 border-t border-border pt-5">
                              <p className="text-xs text-muted-foreground">
                                {t("vocab.etymology")}
                              </p>
                              <p className="mt-1 text-sm text-foreground/80">{entry.etymology}</p>
                            </div>
                          )}
                          {isOpen && entry?.note && (
                            <p className="mt-4 text-sm text-muted-foreground">{entry.note}</p>
                          )}
                          <div className="mt-4 flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => speech.speak(row.id, row.text, row.language)}
                              title={playing ? t("translate.stop") : t("translate.listen")}
                              aria-label={playing ? t("translate.stop") : t("translate.listen")}
                              aria-pressed={playing}
                              className={cn(
                                "flex items-center gap-1.5 text-sm transition-colors",
                                playing
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground",
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
                              type="button"
                              onClick={() => onCopy(row.id, row.text)}
                              title={t("translate.copy")}
                              aria-label={t("translate.copy")}
                              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {copiedId === row.id ? (
                                <Check className="size-4" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                              {copiedId === row.id ? t("translate.copied") : t("translate.copy")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpen((prev) => ({ ...prev, [key]: !isOpen }))}
                        aria-expanded={isOpen}
                        className="flex items-center gap-1 rounded-full px-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {isOpen ? t("saved.showLess") : t("saved.showMore")}
                        <ChevronDown
                          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                        />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
