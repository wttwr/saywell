import { useEffect, useState } from "react";
import { Check, Copy, Loader2, RotateCw, Volume2, VolumeX, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { LANGUAGES } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { useSettings } from "@/lib/settings";
import {
  translateLexicalItem,
  type DictionaryEntry,
} from "@/lib/dictionary.functions";

const DEFAULT_LANGUAGES = ["Italian", "Chinese (Simplified)", "Finnish"];

type ItemState = {
  loading: boolean;
  translation?: string;
  transliteration?: string;
  error?: string;
};

export function MultilingualTranslation({
  entry,
  className = "",
}: {
  entry: DictionaryEntry;
  className?: string;
}) {
  const { t, ln } = useI18n();
  const speech = useSpeech();

  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [items, setItems] = useState<Record<string, ItemState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sourceLanguage = entry.language;
  const source = entry.text;

  // Saved preference from Settings; the current source language is always excluded.
  const { settings, loaded } = useSettings();
  const saved = settings.dictionaryTranslateTo;
  useEffect(() => {
    const base = saved.length > 0 ? saved : DEFAULT_LANGUAGES;
    setLanguages(base.filter((l) => l !== sourceLanguage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceLanguage, loaded, saved.join("|")]);

  const persist = (next: string[]) => {
    setLanguages(next.filter((l) => l !== sourceLanguage));
  };

  const fetchFor = (target: string, cancelledRef: { current: boolean }) => {
    setItems((prev) => ({ ...prev, [target]: { loading: true } }));
    translateLexicalItem({
      data: {
        text: source,
        sourceLanguage: entry.language,
        targetLanguage: target,
        type: entry.type,
      },
    })
      .then((res) => {
        if (cancelledRef.current) return;
        setItems((prev) => ({
          ...prev,
          [target]: {
            loading: false,
            translation: res.translation,
            ...(res.transliteration ? { transliteration: res.transliteration } : {}),
          },
        }));
      })
      .catch((e) => {
        if (cancelledRef.current) return;
        setItems((prev) => ({
          ...prev,
          [target]: {
            loading: false,
            error: e instanceof Error ? e.message : "Could not translate.",
          },
        }));
      });
  };

  // Reset only when the looked-up item changes.
  useEffect(() => {
    setItems({});
  }, [source, sourceLanguage, entry.type]);

  // Fetch only languages not already loaded/loading for this item.
  useEffect(() => {
    const ref = { current: false };
    languages.forEach((target) => {
      setItems((prev) => {
        if (prev[target]) return prev;
        fetchFor(target, ref);
        return { ...prev, [target]: { loading: true } };
      });
    });
    return () => {
      ref.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, sourceLanguage, entry.type, languages.join("|")]);

  const onCopy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  // The entry's own language always appears first, labeled as the source.
  const visible = [sourceLanguage, ...languages];

  return (
    <section className={cn("mt-10 rounded-2xl bg-secondary/40 p-5 md:p-6", className)}>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("vocab.translateTo")}</span>
        {languages.map((l) => (
          <span
            key={l}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3.5 py-1.5 text-sm text-secondary-foreground"
          >
            {ln(l)}
            <button
              onClick={() => persist(languages.filter((x) => x !== l))}
              aria-label={`${t("vocab.remove")} ${l}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </span>
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
              if (v && !languages.includes(v)) persist([...languages, v]);
              e.target.value = "";
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            <option value="" disabled>
              {t("translate.addLanguage")}
            </option>
            {LANGUAGES.filter((o) => o !== sourceLanguage).map((o) => (
              <option key={o} value={o} disabled={languages.includes(o)}>
                {languages.includes(o) ? `✓ ${ln(o)}` : ln(o)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length > 0 && (
        <div className="mt-5 flex flex-col divide-y divide-border/60">
          {visible.map((l) => {
            const isSource = l === entry.language;
            const state: ItemState | undefined = isSource
              ? {
                  loading: false,
                  translation: source,
                  ...(entry.transliteration
                    ? { transliteration: entry.transliteration }
                    : {}),
                }
              : items[l];
            const id = `dict-mt:${l}:${source}`;
            const playing = speech.playingId === id;
            const failed = speech.errorId === id;
            return (
              <div
                key={l}
                className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="w-36 shrink-0 pt-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {ln(l)}
                    {isSource && ` · ${t("translate.sourceLabel")}`}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  {state?.loading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : state?.error ? (
                    <button
                      onClick={() => fetchFor(l, { current: false })}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <RotateCw className="size-3.5" />
                      {t("vocab.retry")}
                    </button>
                  ) : (
                    <>
                      <p className="text-lg leading-snug text-foreground">
                        {state?.translation}
                      </p>
                      {state?.transliteration && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {state.transliteration}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                  <button
                    onClick={() => speech.speak(id, state?.translation ?? "", l)}
                    title={playing ? t("translate.stop") : t("translate.listen")}
                    aria-label={`${playing ? t("translate.stop") : t("translate.listen")} ${l}`}
                    aria-pressed={playing}
                    className={`rounded-md p-1.5 transition-colors ${
                      playing
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {failed ? (
                      <VolumeX className="size-4" />
                    ) : (
                      <Volume2 className={`size-4 ${playing ? "animate-pulse" : ""}`} />
                    )}
                  </button>
                  <button
                    onClick={() => onCopy(id, state?.translation ?? "")}
                    title={t("translate.copy")}
                    aria-label={`${t("translate.copy")} ${l}`}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {copiedId === id ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
