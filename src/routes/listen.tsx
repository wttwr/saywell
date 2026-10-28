import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Play, Snail, Square, Volume2 } from "lucide-react";

import { LanguageSelectorBar } from "@/components/ds/LanguageSelectorBar";
import { TextInputSurface } from "@/components/ds/TextInputSurface";
import { ResultCard } from "@/components/ds/ResultCard";
import { VoiceMemo } from "@/components/ds/VoiceMemo";
import { AUTO_DETECT } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { SPEECH_LOCALES, useSpeech } from "@/lib/speech";
import { compareWords, summarize, type DiffOp } from "@/lib/pronunciation";
import { markSeeded, useFeatureState, type FeatureMode } from "@/lib/feature-state";
import { useDefaultOnce, useSettings } from "@/lib/settings";
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

type Attempt = { reference: string; heard: string; ops: DiffOp[]; audioUrl: string };
type Phase = "idle" | "recording" | "transcribing";

const MARK: Record<DiffOp["type"], string> = {
  match: "text-foreground",
  missing: "rounded bg-destructive/10 px-1 text-destructive line-through decoration-destructive/50",
  different: "rounded bg-primary/15 px-1 text-foreground underline decoration-primary decoration-2 underline-offset-4",
  extra: "rounded bg-secondary px-1 text-muted-foreground italic",
};

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
  const { settings } = useSettings();
  useDefaultOnce(() => {
    if (!markSeeded("listen")) return;
    setLanguage(settings.listenLanguage);
    setShortcuts(settings.listenShortcuts);
  });
  const speech = useSpeech();
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const lang = language === AUTO_DETECT ? "" : language;
  const [attempt, setAttempt] = useFeatureState<Attempt | null>("listen", "attempt", null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const [playingMine, setPlayingMine] = useState(false);
  const shown = attempt && attempt.reference === trimmed ? attempt : null;

  useEffect(() => () => {
    const r = recRef.current;
    if (r && r.state !== "inactive") { r.onstop = null; r.stop(); r.stream.getTracks().forEach((tr) => tr.stop()); }
    playerRef.current?.pause();
  }, []);

  const discard = () => {
    playerRef.current?.pause();
    setPlayingMine(false);
    if (attempt) URL.revokeObjectURL(attempt.audioUrl);
    setAttempt(null);
    setError(null);
  };

  const transcribe = async (blob: Blob, reference: string) => {
    setPhase("transcribing");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      const locale = SPEECH_LOCALES[language];
      if (locale) fd.append("language", locale.slice(0, 2));
      const res = await fetch("/api/stt", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { text: heard } = (await res.json()) as { text: string };
      setAttempt({ reference, heard, ops: heard ? compareWords(reference, heard) : [], audioUrl: URL.createObjectURL(blob) });
    } catch (e) {
      console.error("Listen transcription failed", e);
      setError(t("listen.failed"));
    } finally {
      setPhase("idle");
    }
  };

  const toggleRecord = async () => {
    if (phase === "recording") { recRef.current?.stop(); return; }
    if (phase !== "idle" || !trimmed) return;
    speech.stop();
    discard();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(t("listen.micUnsupported"));
      return;
    }
    const reference = trimmed;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size) void transcribe(blob, reference);
        else { setPhase("idle"); setError(t("listen.nothingHeard")); }
      };
      recRef.current = rec;
      rec.start();
      setPhase("recording");
    } catch (e) {
      console.error("Microphone unavailable", e);
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setError(t(denied ? "listen.micDenied" : "listen.failed"));
    }
  };

  const playMine = () => {
    if (!shown) return;
    if (playingMine) { playerRef.current?.pause(); setPlayingMine(false); return; }
    speech.stop();
    const a = new Audio(shown.audioUrl);
    playerRef.current = a;
    a.onended = () => setPlayingMine(false);
    setPlayingMine(true);
    void a.play().catch(() => setPlayingMine(false));
  };

  const recording = phase === "recording";
  const busy = phase === "transcribing";
  const stats = shown ? summarize(shown.ops) : null;
  const refTotal = stats ? stats.match + stats.missing + stats.different : 0;
  const issues = stats ? stats.missing + stats.different : 0;

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
          actionLabel={recording ? t("listen.stop") : busy ? t("listen.transcribing") : t("listen.record")}
          onAction={toggleRecord}
          actionDisabled={!trimmed || busy}
          actionsBefore={
            <>
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
            </>
          }
        />

        {(shown || error || busy) && (
        <ResultCard className={widget ? "mt-4" : "mt-10"}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("listen.results")}</h2>
          {shown && <VoiceMemo src={shown.audioUrl} className="mt-4" />}
          {busy ? (
            <div className="mt-5 space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-secondary" />
            </div>
          ) : error ? (
            <p className="mt-4 text-sm leading-relaxed text-destructive">{error}</p>
          ) : shown ? (
            !shown.heard ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("listen.nothingHeard")}</p>
            ) : (
              <div className="mt-5 space-y-5">
                <p className="flex flex-wrap gap-x-1.5 gap-y-2 text-xl leading-relaxed">
                  {shown.ops.map((o, i) => (
                    <span key={i} className={MARK[o.type]} title={o.type === "match" ? undefined : o.type === "different" ? `${t("listen.different")}: “${o.heard}”` : t(`listen.${o.type}`)}>
                      {o.word}
                    </span>
                  ))}
                </p>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("listen.heard")}</h3>
                  <p className="mt-1 text-base text-foreground">{shown.heard}</p>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {issues === 0 && stats!.extra === 0
                    ? t("listen.allMatched")
                    : t("listen.mismatch").replace("{n}", String(issues + stats!.extra)).replace("{total}", String(refTotal))}
                </p>
                {issues + stats!.extra > 0 && (
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {stats!.missing > 0 && <span className={MARK.missing}>{t("listen.missing")}</span>}
                    {stats!.different > 0 && <span className={MARK.different}>{t("listen.different")}</span>}
                    {stats!.extra > 0 && <span className={MARK.extra}>{t("listen.extra")}</span>}
                  </div>
                )}
              </div>
            )
          ) : null}
        </ResultCard>
        )}
      </div>
    </main>
  );
}
