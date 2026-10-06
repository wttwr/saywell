import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mic, Square } from "lucide-react";
import { SPEECH_LOCALES } from "@/lib/speech";
import { useI18n } from "@/lib/i18n";

type Props = {
  language: string;
  onText: (text: string) => void;
  className?: string;
  label?: string;
  /** When there is text and we're not listening, children (the ✕ button) render instead. */
  hasText?: boolean;
  children?: ReactNode;
};

const LISTENING: Record<string, string> = { en: "Listening…", it: "In ascolto…", zh: "正在聆听…" };
const BARS = [0, 0.15, 0.3, 0.45, 0.2];

/** Voice input via the browser's speech recognition. */
export function DictateButton({
  language,
  onText,
  className = "",
  label = "Voice input",
  hasText = false,
  children,
}: Props) {
  const { lang } = useI18n() as unknown as { lang?: string };
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => recRef.current?.abort?.();
  }, []);

  if (hasText && !listening) return <>{children}</>;
  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as any;
    const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec = new Rec();
    const locale = SPEECH_LOCALES[language];
    if (locale) rec.lang = locale;
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onTextRef.current(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  if (listening) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="Stop voice input"
        title="Stop voice input"
        aria-pressed
        className={`z-10 flex items-center gap-2 rounded-full bg-primary py-1.5 pl-3 pr-1.5 text-primary-foreground shadow-md ring-4 ring-primary/20 transition-all ${className}`}
      >
        <span className="flex h-4 items-center gap-[3px]" aria-hidden>
          {BARS.map((d, i) => (
            <span
              key={i}
              className="animate-dictate-wave h-full w-[3px] origin-center rounded-full bg-primary-foreground"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </span>
        <span className="text-xs font-medium">{LISTENING[lang ?? "en"] ?? LISTENING.en}</span>
        <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground/20">
          <Square className="size-2.5 fill-current" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`rounded-full bg-secondary p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${className}`}
    >
      <Mic className="size-4" />
    </button>
  );
}
