import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { SPEECH_LOCALES } from "@/lib/speech";

type Props = {
  language: string;
  onText: (text: string) => void;
  className?: string;
  label?: string;
};

/** Voice input via the browser's speech recognition. Hidden when unsupported. */
export function DictateButton({ language, onText, className = "", label = "Voice input" }: Props) {
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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={listening}
      className={`rounded-full p-1.5 transition-colors ${
        listening
          ? "animate-pulse bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
      } ${className}`}
    >
      <Mic className="size-4" />
    </button>
  );
}
