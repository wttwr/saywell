import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { SPEECH_LOCALES } from "@/lib/speech";
import { useI18n } from "@/lib/i18n";

type Props = {
  language: string;
  onText: (text: string) => void;
  className?: string;
  label?: string;
};

type Phase = "idle" | "recording" | "transcribing" | "error";

/** Voice input: records from the mic, then transcribes with ElevenLabs Scribe v2. */
export function DictateButton({ language, onText, className = "", label = "Voice input" }: Props) {
  const { t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const recRef = useRef<MediaRecorder | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
    return () => {
      const r = recRef.current;
      if (r && r.state !== "inactive") r.stop();
    };
  }, []);

  if (!supported) return null;

  const transcribe = async (blob: Blob) => {
    setPhase("transcribing");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      const locale = SPEECH_LOCALES[language];
      if (locale) fd.append("language", locale.slice(0, 2));
      const res = await fetch("/api/stt", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { text } = (await res.json()) as { text: string };
      setPhase("idle");
      if (!text) return;
      onTextRef.current(text);
      const container = containerRef.current;
      requestAnimationFrame(() => {
        const field = container?.querySelector<HTMLTextAreaElement | HTMLInputElement>(
          "textarea, input",
        );
        if (!field) return;
        field.focus();
        const end = field.value.length;
        field.setSelectionRange(end, end);
      });
    } catch (e) {
      console.error("Transcription failed", e);
      setPhase("error");
      setTimeout(() => setPhase((p) => (p === "error" ? "idle" : p)), 2500);
    }
  };

  const toggle = async (ev: React.MouseEvent<HTMLButtonElement>) => {
    containerRef.current = ev.currentTarget.parentElement;
    if (phase === "recording") {
      recRef.current?.stop();
      return;
    }
    if (phase === "transcribing") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size) void transcribe(blob);
        else setPhase("idle");
      };
      recRef.current = rec;
      rec.start();
      setPhase("recording");
    } catch (e) {
      console.error("Microphone unavailable", e);
      setPhase("error");
      setTimeout(() => setPhase((p) => (p === "error" ? "idle" : p)), 2500);
    }
  };

  if (phase === "transcribing" || phase === "error") {
    return (
      <span
        role="status"
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground ${className}`}
      >
        {phase === "transcribing" && <Loader2 className="size-3.5 animate-spin" />}
        {phase === "transcribing" ? t("dictate.transcribing") : t("dictate.failed")}
      </span>
    );
  }

  const recording = phase === "recording";
  const aria = recording ? t("dictate.stop") : label;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={aria}
      title={aria}
      aria-pressed={recording}
      className={`rounded-full transition-colors ${
        recording
          ? "animate-pulse bg-primary p-1 text-primary-foreground"
          : "bg-secondary p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
      } ${className}`}
    >
      {recording ? <Square className="size-2.5 fill-current" /> : <Mic className="size-4" />}
    </button>
  );
}
