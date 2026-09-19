import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Copy, Search, Volume2, VolumeX } from "lucide-react";

import { LANGUAGES } from "@/lib/languages";
import { useI18n, type AppLanguage, type TranslationKey } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { useVocabulary, type VocabularyType } from "@/lib/vocabulary";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "Vocabulary — Words and expressions worth keeping | Lingua" },
      {
        name: "description",
        content:
          "Browse, filter and search the words, phrasal verbs and expressions you want to learn.",
      },
      { property: "og:title", content: "Vocabulary — Words and expressions worth keeping" },
      {
        property: "og:description",
        content: "Filter by language and type, search instantly, and listen to every item.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VocabularyPage,
});

const TYPE_KEYS: Record<VocabularyType, TranslationKey> = {
  single_word: "vocab.type.single_word",
  phrasal_verb: "vocab.type.phrasal_verb",
  expression: "vocab.type.expression",
};

function defaultVocabularyLanguage(lang: AppLanguage): string {
  switch (lang) {
    case "it":
      return "Italian";
    case "zh":
      return "Chinese (Simplified)";
    default:
      return "English";
  }
}

function SelectPill({
  value,
  display,
  onChange,
  options,
  label,
}: {
  value: string;
  display: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <div className="relative inline-flex">
      <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
        {display}
        <ChevronDown className="size-3.5 opacity-60" />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function VocabularyPage() {
  const { t, lang } = useI18n();
  const speech = useSpeech();
  const { items } = useVocabulary();

  const [language, setLanguage] = useState(() => defaultVocabularyLanguage(lang));
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(defaultVocabularyLanguage(lang));
  }, [lang]);

  const inLanguage = useMemo(
    () => items.filter((i) => i.language === language),
    [items, language],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inLanguage;
    return inLanguage.filter(
      (i) =>
        i.text.toLowerCase().includes(q) || i.meaning.toLowerCase().includes(q),
    );
  }, [inLanguage, query]);

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
            {t("vocab.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("vocab.subtitle")}</p>
        </header>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t("vocab.language")}</span>
            <SelectPill
              label={t("vocab.language")}
              value={language}
              display={language}
              onChange={setLanguage}
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t("vocab.typeLabel")}</span>
            <SelectPill
              label={t("vocab.typeLabel")}
              value={type}
              display={
                type === "all" ? t("vocab.type.all") : t(TYPE_KEYS[type])
              }
              onChange={(v) => setType(v as "all" | VocabularyType)}
              options={typeOptions}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 border-b border-border pb-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("vocab.searchPlaceholder")}
            aria-label={t("vocab.searchPlaceholder")}
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground">
          {language} ·{" "}
          {type === "all" ? t("vocab.type.all") : t(TYPE_KEYS[type])}
        </p>

        {inLanguage.length === 0 ? (
          <div className="mt-10">
            <p className="text-base font-medium text-foreground">{t("vocab.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("vocab.emptyBody")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-base text-muted-foreground">{t("vocab.noMatches")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {filtered.map((item) => {
              const id = `vocab:${item.id}`;
              const playing = speech.playingId === id;
              const failed = speech.errorId === id;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0">
                    <p className="text-lg text-foreground">{item.text}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.meaning}</p>
                    <span className="mt-2 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                      {t(TYPE_KEYS[item.type])}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <button
                      onClick={() => speech.speak(id, item.text, item.language)}
                      title={playing ? t("translate.stop") : t("translate.listen")}
                      aria-label={playing ? t("translate.stop") : t("translate.listen")}
                      aria-pressed={playing}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
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
                      onClick={() => onCopy(id, item.text)}
                      title={t("translate.copy")}
                      aria-label={t("translate.copy")}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copiedId === id ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiedId === id ? t("translate.copied") : t("translate.copy")}
                    </button>
                    {failed && (
                      <span className="text-xs text-muted-foreground">{t("translate.noAudio")}</span>
                    )}
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
