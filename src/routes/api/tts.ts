import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DEFAULT_VOICE, VOICE_IDS } from "@/lib/voices";

const Body = z.object({
  text: z.string().trim().min(1).max(2500),
  voiceId: z.string().optional(),
});


export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["ELEVENLABS_API_KEY"];
        if (!key) return new Response("Speech is not configured", { status: 500 });
        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        const voice = parsed.voiceId && VOICE_IDS.includes(parsed.voiceId) ? parsed.voiceId : DEFAULT_VOICE;
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: { "xi-api-key": key, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: parsed.text,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          },
        );
        if (!res.ok || !res.body) {
          const err = await res.text();
          console.error(`ElevenLabs TTS failed [${res.status}]: ${err}`);
          return new Response(err || "Speech failed", { status: res.status || 502 });
        }
        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
