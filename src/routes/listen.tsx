import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Mic, RotateCcw, Snail, Volume2 } from "lucide-react";

import { LanguageSelectorBar } from "@/components/ds/LanguageSelectorBar";
import { TextInputSurface } from "@/components/ds/TextInputSurface";
import { ResultCard } from "@/components/ds/ResultCard";
import { AUTO_DETECT } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/speech";
import { useFeatureState, type FeatureMode } from "@/lib/feature-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listen")({
  head: () => ({
    meta: [
      { title: "Listen — Pronunciation practice | SayWell 会说" },
      { name: "description", content: "Practice your pronunciation and improve your speaking." },
      { property: "og:title", content: "Listen — Pronunciation practice | SayWell 会说" },
      { property: "og:description", content: "Hear the reference pronunciation, then record yourself to compare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ListenFeature mode="focus" />,
});

const ghost = "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40";

export function ListenFeature({ mode = "focus" }: { mode?: FeatureMode }) {
  const { t } = useI18n();
  const widget = mode === "widget";
  const [text, setText] = useFeatureState("listen", "text", "");
  const [language, setLanguage] = useFeatureState("listen", "language", AUTO_DETECT);
  const [shortcuts, setShortcuts] = useFeatureState<string[]>("listen", "shortcuts", [
    "English",
    "Italian",
    "Chinese (Simplified)",
  ]);
  const speech = useSpeech();
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const lang = language === AUTO_DETECT ? "" : language;

  return (
    <main className={widget ? "flex min-h-full flex-1 flex-col bg-background px-4 pb-4" : "min-h-screen bg-background px-5 py-10 md:px-10 md:py-16"}>
      <div className={widget ? "mx-auto flex w-full max-w-3xl flex-1 flex-col" : "mx-auto max-w-3xl"}>
        <header className={widget ? "sr-only" : "mb-8 md:mb-12"}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("nav.listen")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("listen.subtitle")}</p>
        </header>

        <LanguageSelectorBar
          label={t("listen.language")}
          shortcutsLabel={t("style.changeTo")}
          value={language}
          onChange={setLanguage}
          shortcuts={shortcuts}
          setShortcuts={setShortcuts}
          compact={widget}
        />

        <TextInputSurface
          value={text}
          onChange={setText}
          onClear={() => setText("")}
          placeholder={t("listen.placeholder")}
          language={language}
          textareaRef={ref}
          widget={widget}
          textareaClassName={widget ? "min-h-20" : "mt-8 min-h-32"}
          buttonClassName={widget ? "top-1" : "top-8"}
          actionLabel={t("listen.record")}
          onAction={() => {}}
          actionDisabled={!trimmed}
        />

        <div className={cn("flex flex-wrap items-center gap-5", widget ? "mt-4" : "mt-8")}>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{t("listen.reference")}</span>
          <button type="button" className={ghost} disabled={!trimmed}
            aria-pressed={speech.playingId === "listen:normal"}
            onClick={() => speech.speak("listen:normal", trimmed, lang)}>
            <Volume2 className={cn("size-4", speech.playingId === "listen:normal" && "animate-pulse")} />
            {speech.playingId === "listen:normal" ? t("translate.stop") : t("translate.listen")}
          </button>
          <button type="button" className={ghost} disabled={!trimmed}
            aria-pressed={speech.playingId === "listen:slow"}
            onClick={() => speech.speak("listen:slow", trimmed, lang, undefined, 0.6)}>
            <Snail className={cn("size-4", speech.playingId === "listen:slow" && "animate-pulse")} />
            {t("listen.slow")}
          </button>
          <button type="button" className={cn(ghost, "ml-auto")} disabled={!trimmed} aria-label={t("listen.record")} title={t("listen.record")}>
            <span className="rounded-full bg-secondary p-2"><Mic className="size-4" /></span>
            {t("listen.record")}
          </button>
        </div>

        <ResultCard className={widget ? "mt-4" : "mt-10"}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("listen.results")}</h2>
            <button type="button" className={ghost} disabled>
              <RotateCcw className="size-4" />
              {t("listen.tryAgain")}
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("listen.resultsEmpty")}</p>
        </ResultCard>
      </div>
    </main>
  );
}
