import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/settings";

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
 * Natural text-to-speech via ElevenLabs (server route /api/tts),
 * falling back to the browser voice if the service fails.
 * Only one clip plays at a time; clicking the same id again stops it.
 */
export function useSpeech() {
  const { settings } = useSettings();
  const speed = settings.speechSpeed;
  const voiceId = settings.voiceId;
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const currentId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    currentId.current = null;
    setPlayingId(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const browserSpeak = useCallback((id: string, text: string, language: string, rate?: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      currentId.current = null;
      setPlayingId(null);
      setErrorId(id);
      return;
    }
    const locale = SPEECH_LOCALES[language];
    const voices = window.speechSynthesis.getVoices();
    const voice = !locale ? undefined :
      voices.find((v) => v.lang.replace("_", "-") === locale) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(locale.slice(0, 2)));
    const u = new SpeechSynthesisUtterance(text);
    if (locale) u.lang = locale;
    if (voice) u.voice = voice;
    u.rate = rate ?? speed;
    const done = (err: boolean) => {
      if (currentId.current !== id) return;
      currentId.current = null;
      setPlayingId(null);
      if (err) setErrorId(id);
    };
    u.onend = () => done(false);
    u.onerror = () => done(true);
    window.speechSynthesis.speak(u);
  }, [speed]);

  const speak = useCallback(
    async (id: string, text: string, language: string, voiceOverride?: string, rate?: number) => {
      const wasPlaying = currentId.current === id;
      stop();
      if (wasPlaying || !text.trim()) return;
      setErrorId(null);
      currentId.current = id;
      setPlayingId(id);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 2500), voiceId: voiceOverride ?? voiceId }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`TTS ${res.status}`);
        const blob = await res.blob();
        if (currentId.current !== id) return;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audio.playbackRate = rate ?? speed;
        audio.preservesPitch = true;
        audioRef.current = audio;
        const finish = () => {
          if (currentId.current !== id) return;
          stop();
        };
        audio.onended = finish;
        audio.onerror = () => {
          finish();
          setErrorId(id);
        };
        await audio.play();
      } catch (e) {
        if ((e as Error).name === "AbortError" || currentId.current !== id) return;
        browserSpeak(id, text, language, rate);
      }
    },
    [stop, browserSpeak, speed, voiceId],
  );

  return { speak, stop, playingId, errorId };
}
