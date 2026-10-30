import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useDefaultOnce, useSettings } from "@/lib/settings";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { SaveButton } from "@/components/SaveButton";
import { TextActions } from "@/components/TextActions";
import { exploreSituations, type SituationsResult } from "@/lib/situations.functions";
import { useSpeech } from "@/lib/speech";

import { LanguageSelectorBar } from "@/components/ds/LanguageSelectorBar";
import { TextInputSurface } from "@/components/ds/TextInputSurface";
import { ResultCard } from "@/components/ds/ResultCard";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { markSeeded, sendToFeature, useFeatureState, type FeatureMode } from "@/lib/feature-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/situations")({
  head: () => ({
    meta: [
      { title: "Situations — Everyday expressions | SayWell 会说" },
      { name: "description", content: "Find useful expressions for everyday situations." },
      { property: "og:title", content: "Situations — Everyday expressions | SayWell 会说" },
      { property: "og:description", content: "Discover useful phrases for the supermarket, transport, restaurants and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <SituationsFeature mode="focus" />,
});

const PRESETS = ["supermarket", "transport", "restaurant", "hotel", "doctor", "shopping"] as const;
const STYLES = ["everyday", "simple", "polite"] as const;

const chip = (on: boolean) =>
  cn(
    "rounded-full px-3.5 py-1.5 text-sm transition-colors",
    on ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground",
  );

export function SituationsFeature({ mode = "focus" }: { mode?: FeatureMode }) {
  const { t, lang } = useI18n();
  const run = useServerFn(exploreSituations);
  const speech = useSpeech();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [result, setResult] = useFeatureState<SituationsResult | null>("situations", "result", null);
  const [loading, setLoading] = useFeatureState("situations", "loading", false);
  const [error, setError] = useFeatureState<string | null>("situations", "error", null);
  const widget = mode === "widget";
  const [preset, setPreset] = useFeatureState<string>("situations", "preset", "supermarket");
  const [custom, setCustom] = useFeatureState("situations", "custom", "");
  const [language, setLanguage] = useFeatureState("situations", "language", "Italian");
  const [shortcuts, setShortcuts] = useFeatureState<string[]>("situations", "shortcuts", [
    "English",
    "Italian",
    "Chinese (Simplified)",
  ]);
  const [style, setStyle] = useFeatureState<string>("situations", "style", "everyday");
  const { settings } = useSettings();
  const navigate = useNavigate();
  useDefaultOnce(() => {
    if (!markSeeded("situations")) return;
    setLanguage(settings.situationsLanguage);
    setShortcuts(settings.situationsShortcuts);
  });
  const SEND = [
    { feature: "interpret", to: "/interpret", label: "nav.interpret", shortcuts: settings.interpretShortcuts },
    { feature: "style", to: "/style", label: "nav.style", shortcuts: settings.styleShortcuts },
    { feature: "listen", to: "/listen", label: "nav.listen", shortcuts: settings.listenShortcuts },
  ] as const;
  const ready = Boolean(custom.trim() || preset);
  const ref = useRef<HTMLTextAreaElement>(null);
  const k = (s: string) => s as TranslationKey;
  const situationText = custom.trim() || t(k(`situations.${preset}`));
  const globalLanguage = lang === "it" ? "Italian" : lang === "zh" ? "Simplified Chinese" : "English";

  const onExplore = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await run({ data: { situation: situationText, language, style: style as "everyday" | "simple" | "polite", explanationLanguage: globalLanguage } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("style.error"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={widget ? "flex min-h-full flex-1 flex-col bg-background px-4 pb-4" : "min-h-screen bg-background px-5 py-10 md:px-10 md:py-16"}>
      <div className={widget ? "mx-auto flex w-full max-w-3xl flex-1 flex-col" : "mx-auto max-w-3xl"}>
        <header className={widget ? "sr-only" : "mb-8 md:mb-12"}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t(k("nav.situations"))}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(k("situations.subtitle"))}</p>
        </header>

        <LanguageSelectorBar
          label={t(k("situations.target"))}
          shortcutsLabel={t("style.changeTo")}
          value={language}
          onChange={setLanguage}
          shortcuts={shortcuts}
          setShortcuts={setShortcuts}
          compact={widget}
        />

        <div className={cn("flex flex-wrap items-center gap-2 md:gap-3", widget ? "mt-3" : "mt-6")}>
          <span className="text-sm text-muted-foreground">{t(k("situations.style"))}</span>
          {STYLES.map((s) => (
            <button key={s} type="button" aria-pressed={style === s} onClick={() => setStyle(s)} className={chip(style === s)}>
              {t(k(`situations.${s}`))}
            </button>
          ))}
        </div>

        <div className={cn("flex flex-wrap items-center gap-2 md:gap-3", widget ? "hidden" : "mt-6")}>
          <span className="text-sm text-muted-foreground">{t(k("situations.situation"))}</span>
          {PRESETS.map((p) => (
            <button key={p} type="button" aria-pressed={!custom.trim() && preset === p}
              onClick={() => { setPreset(p); setCustom(""); }} className={chip(!custom.trim() && preset === p)}>
              {t(k(`situations.${p}`))}
            </button>
          ))}
        </div>

        <TextInputSurface
          value={custom}
          onChange={setCustom}
          onClear={() => setCustom("")}
          placeholder={t(k("situations.custom"))}
          language=""
          textareaRef={ref}
          widget={widget}
          textareaClassName={widget ? "min-h-16" : "mt-6 min-h-24"}
          buttonClassName={widget ? "top-1" : "top-6"}
          actionLabel={loading ? t("style.exploring") : t(k("situations.explore"))}
          onAction={() => void onExplore()}
          actionDisabled={!ready || loading}
        />

        {error && <p className="mt-8 text-base text-destructive">{error}</p>}
        {loading ? (
          <div className={cn("space-y-3", widget ? "mt-4" : "mt-10")}>
            <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-3/5 animate-pulse rounded bg-secondary" />
          </div>
        ) : (
          <ResultCard className={widget ? "mt-4" : "mt-10"}>
            {!result ? (
              <>
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(k("situations.results"))}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(k("situations.empty"))}</p>
              </>
            ) : (
              <div className="space-y-8">
                {result.groups.map((g, gi) => (
                  <section key={gi}>
                    {g.title && <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.title}</h2>}
                    <ul className="mt-3 divide-y divide-border/60">
                      {g.expressions.map((e, ei) => {
                        const id = `situations:${gi}:${ei}`;
                        return (
                          <li key={ei} className="py-4 first:pt-0 last:pb-0">
                            <p className="whitespace-pre-wrap break-words text-xl leading-relaxed text-foreground">{e.text}</p>
                            {e.transliteration && <p className="mt-1 text-sm text-muted-foreground">{e.transliteration}</p>}
                            {e.meaning && <p className="mt-2 text-sm leading-relaxed text-foreground/80">{e.meaning}</p>}
                            {e.note && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.note}</p>}
                            <div className="mt-3 flex flex-wrap items-center gap-4">
                              <TextActions playing={speech.playingId === id} failed={speech.errorId === id} copied={copiedId === id}
                                onListen={() => void speech.speak(id, e.text, result.language)}
                                onCopy={() => void navigator.clipboard.writeText(e.text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1600); })} />
                              <SaveButton item={{ kind: "translation", text: e.text, language: result.language, source: e.meaning, sourceLanguage: globalLanguage === "Simplified Chinese" ? "Chinese (Simplified)" : globalLanguage, ...(e.transliteration ? { transliteration: e.transliteration } : {}), ...(e.note ? { detail: e.note } : {}) }} />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                              {SEND.map((s) => (
                                <button key={s.feature} type="button"
                                  onClick={() => { sendToFeature(s.feature, { text: e.text, language: result.language, shortcuts: [...s.shortcuts] }); void navigate({ to: s.to }); }}
                                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                                  <ArrowUpRight className="size-3.5" />{t(k(s.label))}
                                </button>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </ResultCard>
        )}
      </div>
    </main>
  );
}
