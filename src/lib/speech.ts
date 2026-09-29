import { useCallback, useEffect, useRef, useState } from "react";

/** Map app language names to BCP-47 tags used by speech synthesis voices. */
export const SPEECH_LOCALES: Record<string, string> = {
  English: "en-US",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Finnish: "fi-FI",
  Swedish: "sv-SE",
  Norwegian: "nb-NO",
  Danish: "da-DK",
  German: "de-DE",
  French: "fr-FR",
  Spanish: "es-ES",
  Portuguese: "pt-PT",
  Italian: "it-IT",
  Dutch: "nl-NL",
  Polish: "pl-PL",
  Russian: "ru-RU",
  Ukrainian: "uk-UA",
  Turkish: "tr-TR",
  Arabic: "ar-SA",
  Hebrew: "he-IL",
  Hindi: "hi-IN",
  Bengali: "bn-BD",
  Thai: "th-TH",
  Vietnamese: "vi-VN",
  Indonesian: "id-ID",
  Malay: "ms-MY",
  Greek: "el-GR",
  Czech: "cs-CZ",
  Romanian: "ro-RO",
};

/**
 * Minimal browser text-to-speech hook.
 * Only one utterance plays at a time; the API surface is intentionally small
 * so a hosted TTS service can replace the implementation later.
 */
export function useSpeech() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const currentId = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    currentId.current = null;
    setPlayingId(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const speak = useCallback(
    (id: string, text: string, language: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setErrorId(id);
        return;
      }
      const wasPlaying = currentId.current === id;
      stop();
      if (wasPlaying || !text.trim()) return;

      setErrorId(null);
      const locale = SPEECH_LOCALES[language];
      const voices = window.speechSynthesis.getVoices();
      const voice = !locale ? undefined :
        voices.find((v) => v.lang.replace("_", "-") === locale) ??
        voices.find((v) => locale && v.lang.toLowerCase().startsWith(locale.slice(0, 2)));

      if (locale && voices.length > 0 && !voice) {
        setErrorId(id);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (locale) utterance.lang = locale;
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        currentId.current = null;
        setPlayingId(null);
      };
      utterance.onerror = () => {
        currentId.current = null;
        setPlayingId(null);
        setErrorId(id);
      };

      currentId.current = id;
      setPlayingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [stop],
  );

  return { speak, stop, playingId, errorId };
}
