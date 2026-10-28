import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const BARS = 40;

/** Voice-memo style player: play button, waveform bars from the recording, and time. */
export function VoiceMemo({ src, className }: { src: string; className?: string }) {
  const [peaks, setPeaks] = useState<number[]>(() => Array(BARS).fill(0.2));
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let off = false;
    const a = new Audio(src);
    audioRef.current = a;
    a.ontimeupdate = () => setTime(a.currentTime);
    a.onended = () => { setPlaying(false); setTime(0); };
    (async () => {
      try {
        const buf = await (await fetch(src)).arrayBuffer();
        const ctx = new AudioContext();
        const audio = await ctx.decodeAudioData(buf);
        void ctx.close();
        const data = audio.getChannelData(0);
        const step = Math.floor(data.length / BARS) || 1;
        const out: number[] = [];
        for (let i = 0; i < BARS; i++) {
          let sum = 0;
          for (let j = i * step; j < (i + 1) * step && j < data.length; j++) sum += data[j]! * data[j]!;
          out.push(Math.sqrt(sum / step));
        }
        const max = Math.max(...out, 0.0001);
        if (!off) { setPeaks(out.map((v) => Math.max(0.12, v / max))); setDuration(audio.duration); }
      } catch { /* keep flat bars */ }
    })();
    return () => { off = true; a.pause(); };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * duration;
    setTime(a.currentTime);
  };

  const progress = duration ? time / duration : 0;
  const shownTime = playing || time > 0 ? time : duration;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className={cn("flex items-center gap-4 rounded-full border border-border bg-card px-3 py-2 shadow-sm", className)}>
      <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary/10">
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>
      <div className="flex h-10 flex-1 cursor-pointer items-center gap-[3px]" onClick={seek}>
        {peaks.map((p, i) => (
          <span key={i}
            className={cn("w-[3px] flex-1 rounded-full transition-colors", i / BARS < progress ? "bg-primary" : "bg-muted-foreground/35")}
            style={{ height: `${p * 100}%` }} />
        ))}
      </div>
      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-foreground">{fmt(shownTime)}</span>
    </div>
  );
}
