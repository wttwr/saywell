import { createFileRoute } from "@tanstack/react-router";

import { LanguageSelectorBar } from "@/components/ds/LanguageSelectorBar";
import { TextInputSurface } from "@/components/ds/TextInputSurface";
import { ResultCard } from "@/components/ds/ResultCard";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useFeatureState, type FeatureMode } from "@/lib/feature-state";
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
  const { t } = useI18n();
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
  const ready = Boolean(custom.trim() || preset);
  const k = (s: string) => s as TranslationKey;

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

        <div className={cn("flex flex-wrap items-center gap-2 md:gap-3", widget ? "mt-3" : "mt-6")}>
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
          widget={widget}
          textareaClassName={widget ? "min-h-16" : "mt-6 min-h-24"}
          buttonClassName={widget ? "top-1" : "top-6"}
          actionLabel={t(k("situations.explore"))}
          onAction={() => {}}
          actionDisabled={!ready}
        />

        <ResultCard className={widget ? "mt-4" : "mt-10"}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t(k("situations.results"))}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(k("situations.empty"))}</p>
        </ResultCard>
      </div>
    </main>
  );
}
