import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useI18n, type TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SavedContent } from "@/components/SavedContent";
import { groupSavedItems, useSavedStore, type SavedKind } from "@/lib/saved-store";
import { cn } from "@/lib/utils";
import { DictateButton } from "@/components/DictateButton";

export const Route = createFileRoute("/saved")({
  validateSearch: (search: Record<string, unknown>): { detail?: string } =>
    typeof search.detail === "string" ? { detail: search.detail } : {},
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

function SavedPage() {
  const { t, ln, lang } = useI18n();
  const { detail } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { items, remove, removeGroup } = useSavedStore();
  const [filter, setFilter] = useState<SavedKind | "all">("all");
  const [langFilter, setLangFilter] = useState("all");
  const [pairFilter, setPairFilter] = useState("all");
  const [query, setQuery] = useState("");
  const labels = { en: { back: "Back to Saved", details: "View details" }, it: { back: "Torna a Salvati", details: "Visualizza dettagli" }, zh: { back: "返回收藏", details: "查看详情" } }[lang];
  const selected = groupSavedItems(items).find((group) => (group[0]?.groupId ?? group[0]?.id) === detail);

  const { languages, pairs } = useMemo(() => {
    const ls = new Set<string>();
    const ps = new Set<string>();
    for (const i of items) {
      if (i.language) ls.add(i.language);
      if (i.sourceLanguage) ls.add(i.sourceLanguage);
      if (i.sourceLanguage && i.language) ps.add(`${i.sourceLanguage}>${i.language}`);
    }
    return { languages: [...ls].sort(), pairs: [...ps].sort() };
  }, [items]);

  const activeCount =
    (filter !== "all" ? 1 : 0) + (langFilter !== "all" ? 1 : 0) + (pairFilter !== "all" ? 1 : 0);
  const FT = {
    en: { filter: "Filter", section: "Section", language: "Language", pair: "From → to", any: "All", reset: "Reset" },
    it: { filter: "Filtra", section: "Sezione", language: "Lingua", pair: "Da → a", any: "Tutte", reset: "Azzera" },
    zh: { filter: "筛选", section: "板块", language: "语言", pair: "从 → 到", any: "全部", reset: "重置" },
  }[lang as "en" | "it" | "zh"] ?? { filter: "Filter", section: "Section", language: "Language", pair: "From → to", any: "All", reset: "Reset" };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupSavedItems(items).filter(
      (group) =>
        group.some((i) => filter === "all" || i.kind === filter) &&
        (langFilter === "all" || group.some((i) => i.language === langFilter || i.sourceLanguage === langFilter)) &&
        (pairFilter === "all" || group.some((i) => `${i.sourceLanguage}>${i.language}` === pairFilter)) &&
        (!q || group.some((i) => [i.text, i.detail, i.source, i.language, i.dictionaryEntry?.etymology, ...i.dictionaryEntry?.senses.map((s) => `${s.definition} ${s.example ?? ""}`) ?? []].some((v) => v?.toLowerCase().includes(q)))),
    );
  }, [items, filter, langFilter, pairFilter, query]);

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("saved.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("saved.subtitle")}</p>
        </header>

        {detail ? (
          <div>
            <Button variant="ghost" onClick={() => void navigate({ search: {} })} className="mb-6 h-auto gap-2 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
              <ArrowLeft />{labels.back}
            </Button>
            {selected ? <SavedContent key={detail} group={selected} /> : <p className="text-sm text-muted-foreground">{t("saved.noMatches")}</p>}
          </div>
        ) : <>
        {items.length > 0 && (
          <div className="mt-6 flex items-center gap-3 border-b border-border pb-3">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "order-last flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                    activeCount ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <SlidersHorizontal className="size-4" />
                  {FT.filter}
                  {activeCount > 0 && <span>· {activeCount}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-4">
                {[
                  {
                    label: FT.section,
                    value: filter,
                    set: (v: string) => setFilter(v as SavedKind | "all"),
                    options: FILTERS.filter((f) => f.key !== "all").map((f) => ({ value: f.key, label: t(f.label) })),
                  },
                  {
                    label: FT.language,
                    value: langFilter,
                    set: setLangFilter,
                    options: languages.map((l) => ({ value: l, label: ln(l) })),
                  },
                  {
                    label: FT.pair,
                    value: pairFilter,
                    set: setPairFilter,
                    options: pairs.map((p) => {
                      const [a, b] = p.split(">");
                      return { value: p, label: `${ln(a ?? "")} → ${ln(b ?? "")}` };
                    }),
                  },
                ].map((f) => (
                  <label key={f.label} className="block">
                    <span className="text-xs text-muted-foreground">{f.label}</span>
                    <div className="relative mt-1">
                    <select
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-12 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="all">{FT.any}</option>
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </label>
                ))}
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFilter("all"); setLangFilter("all"); setPairFilter("all"); }}
                    className="text-sm text-primary"
                  >
                    {FT.reset}
                  </button>
                )}
              </PopoverContent>
            </Popover>
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
              const grouped = Boolean(i.groupId);
              const key = i.groupId ?? i.id;
              const summary = i.dictionaryEntry?.meaning ?? i.detail;

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

                  <div className="mt-3 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 whitespace-pre-wrap break-words text-xl leading-relaxed text-foreground">{grouped ? i.source ?? i.text : i.text}</p>
                      {summary && !grouped && <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{summary}</p>}
                      {grouped && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.map((row) => ln(row.language)).join(" · ")}</p>}
                    </div>
                    <Button variant="ghost" size="icon" title={labels.details} aria-label={`${labels.details}: ${i.source ?? i.text}`} onClick={() => void navigate({ search: { detail: key } })} className="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                      <ArrowRight />
                    </Button>
                  </div>
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
                          <div className="mt-4 flex items-center justify-end gap-4">
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
        </>}
      </div>
    </main>
  );
}
