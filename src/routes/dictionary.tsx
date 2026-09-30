import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Info,
  Loader2,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";


import { INPUT_LANGUAGES, LANGUAGES } from "@/lib/languages";
import { useI18n, type AppLanguage, type TranslationKey } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { lookUpWord, type DictionaryEntry } from "@/lib/dictionary.functions";
import { MultilingualTranslation } from "@/components/MultilingualTranslation";
import { useDefaultOnce, useSettings } from "@/lib/settings";

export const Route = createFileRoute("/dictionary")({
  head: () => ({
    meta: [
      { title: "Dictionary — Look up words and keep them | SayWell 会说" },
      {
        name: "description",
        content:
          "Look up any word, phrasal verb, expression or abbreviation, see its meaning, origin and examples, and browse the ones you kept.",
      },
      { property: "og:title", content: "Dictionary — Look up words and keep them | SayWell 会说" },
      {
        property: "og:description",
        content: "Meanings, expanded forms, etymology and pronunciation, with your own saved list.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DictionaryPage,
});

const TYPE_KEYS: Record<DictionaryEntry["type"], TranslationKey> = {
  single_word: "vocab.type.single_word",
  phrasal_verb: "vocab.type.phrasal_verb",
  expression: "vocab.type.expression",
  abbreviation: "vocab.type.abbreviation",
};

function looksLikeSentence(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/[;:!?]/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 6) return true;
  if (/\.\s/.test(trimmed) || (/\./.test(trimmed) && words.length > 1)) return true;
  const clauseMarkers = [
    " i ", " you ", " he ", " she ", " it ", " we ", " they ",
    " is ", " are ", " was ", " were ", " am ",
    " has ", " have ", " had ", " do ", " does ", " did ",
    " will ", " would ", " could ", " should ", " may ", " might ", " can ",
    " cannot ", " can't ", " don't ", " doesn't ", " didn't ",
  ];
  const lower = ` ${trimmed.toLowerCase()} `;
  return clauseMarkers.some((m) => lower.includes(m));
}

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

function explanationLanguage(lang: AppLanguage): string {
  switch (lang) {
    case "it":
      return "Italian";
    case "zh":
      return "Simplified Chinese";
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
  const { ln } = useI18n();
  return (
    <div className="relative inline-flex">
      <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
        {ln(value)}
        <ChevronDown className="size-3.5 opacity-60" />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {INPUT_LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {ln(l)}
          </option>
        ))}
      </select>
    </div>
  );
}

function DictionaryPage() {
  const { t, lang, ln } = useI18n();
  const speech = useSpeech();

  const [language, setLanguage] = useState(() => defaultDictionaryLanguage(lang));
  const [shortcuts, setShortcuts] = useState<string[]>([
    "English",
    "Italian",
    "Chinese (Simplified)",
  ]);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const { settings } = useSettings();
  useDefaultOnce(() => {
    setLanguage(settings.dictionaryLanguage);
    setShortcuts(settings.dictionaryShortcuts);
  });

  // Instant lookup: stay quiet while typing, validate only after a pause.
  useEffect(() => {
    const text = query.trim();

    // Typing (or clearing) always hides the previous warning immediately.
    setError(null);

    setSuggestions([]);

    if (!text) {
      setEntry(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      if (looksLikeSentence(text)) {
        setEntry(null);
        setError(t("vocab.sentenceNotAllowed"));
        setLoading(false);
        return;
      }

      setLoading(true);
      setEntry(null);
      setSuggestions([]);

      lookUpWord({
        data: { text, language, explanationLanguage: explanationLanguage(lang) },
      })
        .then((result) => {
          if (cancelled) return;
          setEntry(result.entry);
          setSuggestions(result.suggestions ?? []);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Could not look up that word.");
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, language, lang]);


  const onCopy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
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
        {failed && !compact && (
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

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-sm text-muted-foreground">{t("vocab.language")}</span>
            <SelectPill label={t("vocab.language")} value={language} onChange={setLanguage} />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-sm text-muted-foreground">{t("vocab.changeTo")}</span>
            {shortcuts.map((s) => (
              <button
                key={s}
                onClick={() => setLanguage(s)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  s === language
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {ln(s)}
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
                  const v = e.target.value;
                  if (v) setShortcuts((prev) => (prev.includes(v) ? prev : [...prev, v]));
                  e.target.value = "";
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              >
                <option value="" disabled>
                  {t("translate.addLanguage")}
                </option>
                {LANGUAGES.map((o) => (
                  <option key={o} value={o} disabled={shortcuts.includes(o)}>
                    {shortcuts.includes(o) ? `✓ ${ln(o)}` : ln(o)}
                  </option>
                ))}
              </select>
            </div>
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
          {loading && (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {!loading && !error && suggestions.length > 0 && (
          <section className="mt-8 rounded-xl bg-secondary/50 px-4 py-3">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                {t("vocab.noExactMatch")} {t("vocab.didYouMean")}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full bg-secondary px-3.5 py-1.5 text-sm text-secondary-foreground transition-colors hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {entry && (
          <section className="mt-10">
            {(entry.languageMismatch || entry.correctedFrom) && (
              <p className="mb-4 flex items-start gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span className="space-y-1">
                  {entry.correctedFrom && (
                    <span className="block">
                      {t("vocab.nearestMatch")
                        .replaceAll("{input}", entry.correctedFrom)
                        .replaceAll("{match}", entry.text)}
                    </span>
                  )}
                  {entry.languageMismatch && entry.detectedLanguage && (
                    <span className="block">
                      {t("vocab.languageMismatch")
                        .replaceAll("{detected}", ln(entry.detectedLanguage))
                        .replaceAll("{selected}", ln(language))}
                    </span>
                  )}
                </span>
              </p>
            )}
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
                  <span className="mt-3 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {t(TYPE_KEYS[entry.type])}
                  </span>
                </div>
                <div className="flex shrink-0 items-start gap-4">
                  {actionButton(`dict:${entry.text}`, entry.text, entry.language)}
                </div>

              </div>

              {entry.expandedForm && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("vocab.expandedForm")}
                  </p>
                  <p className="mt-1 text-base text-foreground">{entry.expandedForm}</p>
                </div>
              )}

              <p className="mt-5 text-base text-foreground/80">{entry.meaning}</p>

              {entry.imageUrl && (
                <img
                  src={entry.imageUrl}
                  alt={entry.text}
                  loading="lazy"
                  className="mt-5 max-h-64 w-full rounded-xl object-cover"
                />
              )}

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

              {entry.etymology && (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("vocab.etymology")}
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{entry.etymology}</p>
                </div>
              )}

              {entry.note && (
                <p className="mt-4 text-sm text-muted-foreground">{entry.note}</p>
              )}
            </div>
            <MultilingualTranslation entry={entry} />
          </section>
        )}

      </div>
    </main>
  );
}
