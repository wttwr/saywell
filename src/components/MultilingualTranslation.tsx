import { useEffect, useState } from "react";
import { Check, Copy, Loader2, RotateCw, Volume2, VolumeX, X } from "lucide-react";

import { LANGUAGES } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import {
  translateLexicalItem,
  type DictionaryEntry,
} from "@/lib/dictionary.functions";

const STORAGE_KEY = "lingua.dictionary.translateTo";
const DEFAULT_LANGUAGES = ["Italian", "Chinese (Simplified)", "Finnish"];

type ItemState = {
  loading: boolean;
  translation?: string;
  transliteration?: string;
  error?: string;
};

export function MultilingualTranslation({ entry }: { entry: DictionaryEntry }) {
  const { t } = useI18n();
  const speech = useSpeech();

  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [items, setItems] = useState<Record<string, ItemState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Remembered selection (client-only, avoids hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
          setLanguages(parsed as string[]);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: string[]) => {
    setLanguages(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const source = entry.text;

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

  useEffect(() => {
    const ref = { current: false };
    const pending = languages.filter((l) => l !== entry.language);
    setItems(Object.fromEntries(pending.map((l) => [l, { loading: true }])));
    pending.forEach((target) => fetchFor(target, ref));
    return () => {
      ref.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, entry.language, entry.type, languages.join("|")]);

  const onCopy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const visible = languages.filter((l) => l !== entry.language);

  return (
    <section className="mt-10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {t("vocab.multilingual")}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("vocab.translateTo")}</span>
        {languages.map((l) => (
          <span
            key={l}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3.5 py-1.5 text-sm text-secondary-foreground"
          >
            {l}
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
            {LANGUAGES.map((o) => (
              <option key={o} value={o} disabled={languages.includes(o)}>
                {languages.includes(o) ? `✓ ${o}` : o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length > 0 && (
        <div className="mt-5 -mx-1 overflow-x-auto">
          <div className="flex min-w-full gap-8 px-1 pb-2">
            {visible.map((l) => {
              const state = items[l];
              const id = `dict-mt:${l}:${source}`;
              const playing = speech.playingId === id;
              const failed = speech.errorId === id;
              return (
                <div key={l} className="min-w-[9rem] shrink-0">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  {state?.loading ? (
                    <Loader2 className="mt-2 size-4 animate-spin text-muted-foreground" />
                  ) : state?.error ? (
                    <button
                      onClick={() => fetchFor(l, { current: false })}
                      className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <RotateCw className="size-3.5" />
                      {t("vocab.retry")}
                    </button>
                  ) : (
                    <>
                      <p className="mt-1 text-lg text-foreground">{state?.translation}</p>
                      {state?.transliteration && (
                        <p className="text-xs text-muted-foreground">
                          {state.transliteration}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() => speech.speak(id, state?.translation ?? "", l)}
                          title={playing ? t("translate.stop") : t("translate.listen")}
                          aria-label={`${playing ? t("translate.stop") : t("translate.listen")} ${l}`}
                          aria-pressed={playing}
                          className={`transition-colors ${
                            playing
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
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
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {copiedId === id ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
