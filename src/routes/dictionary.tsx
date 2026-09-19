import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Search,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

import { LANGUAGES } from "@/lib/languages";
import { useI18n, type AppLanguage, type TranslationKey } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { useVocabulary, type VocabularyType } from "@/lib/vocabulary";
import { lookUpWord, type DictionaryEntry } from "@/lib/dictionary.functions";

export const Route = createFileRoute("/dictionary")({
  head: () => ({
    meta: [
      { title: "Dictionary — Look up words and keep them | Lingua" },
      {
        name: "description",
        content:
          "Look up any word or expression, see its meaning and examples, and save the ones you want to learn.",
      },
      { property: "og:title", content: "Dictionary — Look up words and keep them" },
      {
        property: "og:description",
        content: "Meanings, examples and pronunciation, with a saved list of your own.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DictionaryPage,
});

const TYPE_KEYS: Record<VocabularyType, TranslationKey> = {
  single_word: "vocab.type.single_word",
  phrasal_verb: "vocab.type.phrasal_verb",
  expression: "vocab.type.expression",
};

function defaultDictionaryLanguage(lang: AppLanguage): string {
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
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="relative inline-flex">
      <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
        {value}
        <ChevronDown className="size-3.5 opacity-60" />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function DictionaryPage() {
  const { t, lang } = useI18n();
  const speech = useSpeech();
  const { items, addItem, removeItem } = useVocabulary();

  const [language, setLanguage] = useState(() => defaultDictionaryLanguage(lang));
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(defaultDictionaryLanguage(lang));
  }, [lang]);

  const inLanguage = useMemo(
    () => items.filter((i) => i.language === language),
    [items, language],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inLanguage;
    return inLanguage.filter(
      (i) => i.text.toLowerCase().includes(q) || i.meaning.toLowerCase().includes(q),
    );
  }, [inLanguage, query]);

  const onCopy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const runLookup = async () => {
    const text = query.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setEntry(null);
    try {
      const result = await lookUpWord({ data: { text, language } });
      setEntry(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not look up that word.");
    } finally {
      setLoading(false);
    }
  };

  const alreadySaved =
    entry !== null &&
    items.some(
      (i) =>
        i.language === entry.language &&
        i.text.toLowerCase() === entry.text.toLowerCase(),
    );

  const saveEntry = () => {
    if (!entry || alreadySaved) return;
    addItem({
      language: entry.language,
      text: entry.text,
      meaning: entry.meaning,
      type: entry.type,
    });
  };

  const actionButton = (
    id: string,
    text: string,
    itemLanguage: string,
    compact = false,
  ) => {
    const playing = speech.playingId === id;
    const failed = speech.errorId === id;
    return (
      <div className="flex shrink-0 items-center gap-4">
        <button
          onClick={() => speech.speak(id, text, itemLanguage)}
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
          {!compact && (playing ? t("translate.stop") : t("translate.listen"))}
        </button>
        <button
          onClick={() => onCopy(id, text)}
          title={t("translate.copy")}
          aria-label={t("translate.copy")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {copiedId === id ? <Check className="size-4" /> : <Copy className="size-4" />}
          {!compact && (copiedId === id ? t("translate.copied") : t("translate.copy"))}
        </button>
        {failed && (
          <span className="text-xs text-muted-foreground">{t("translate.noAudio")}</span>
        )}
      </div>
    );
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

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t("vocab.language")}</span>
          <SelectPill label={t("vocab.language")} value={language} onChange={setLanguage} />
        </div>

        <div className="mt-8 flex items-center gap-3 border-b border-border pb-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runLookup();
              }
            }}
            placeholder={t("vocab.searchPlaceholder")}
            aria-label={t("vocab.searchPlaceholder")}
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <button
            onClick={() => void runLookup()}
            disabled={!query.trim() || loading}
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {loading ? t("vocab.lookingUp") : t("vocab.lookup")}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {entry && (
          <section className="mt-10">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("vocab.entry")}
            </p>
            <div className="mt-3 rounded-2xl bg-secondary/40 p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <p className="text-2xl text-foreground">{entry.text}</p>
                  {entry.transliteration && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {entry.transliteration}
                    </p>
                  )}
                  <p className="mt-2 text-base text-foreground/80">{entry.meaning}</p>
                  <span className="mt-3 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {t(TYPE_KEYS[entry.type])}
                  </span>
                </div>
                {actionButton(`dict:${entry.text}`, entry.text, entry.language)}
              </div>

              {entry.senses.length > 0 && (
                <ul className="mt-5 space-y-4 border-t border-border pt-5">
                  {entry.senses.map((sense, i) => (
                    <li key={i}>
                      <p className="text-sm text-foreground">
                        {sense.partOfSpeech && (
                          <span className="mr-2 italic text-muted-foreground">
                            {sense.partOfSpeech}
                          </span>
                        )}
                        {" "}
                        {
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

              {entry.note && (
                <p className="mt-4 text-sm text-muted-foreground">{entry.note}</p>
              )}

              <button
                onClick={saveEntry}
                disabled={alreadySaved}
                className="mt-6 rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {alreadySaved ? t("vocab.savedDone") : t("vocab.save")}
              </button>
            </div>
          </section>
        )}

        <section className="mt-12">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("vocab.saved")} · {language}
          </p>

          {inLanguage.length === 0 ? (
            <div className="mt-6">
              <p className="text-base font-medium text-foreground">{t("vocab.emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("vocab.emptyBody")}</p>
            </div>
          ) : matches.length === 0 ? (
            <p className="mt-6 text-base text-muted-foreground">{t("vocab.noMatches")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {matches.map((item) => {
                const id = `vocab:${item.id}`;
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
                      {actionButton(id, item.text, item.language, true)}
                      <button
                        onClick={() => removeItem(item.id)}
                        title={t("vocab.remove")}
                        aria-label={t("vocab.remove")}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
