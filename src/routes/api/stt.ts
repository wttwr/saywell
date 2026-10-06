import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 20 * 1024 * 1024;

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["ELEVENLABS_API_KEY"];
        if (!key) return new Response("Transcription is not configured", { status: 500 });
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        const file = form.get("audio");
        if (!(file instanceof Blob) || file.size === 0) {
          return new Response("No audio", { status: 400 });
        }
        if (file.size > MAX_BYTES) return new Response("Recording too long", { status: 413 });
        const lang = form.get("language");

        const body = new FormData();
        body.append("file", file, "recording.webm");
        body.append("model_id", "scribe_v2");
        body.append("tag_audio_events", "false");
        if (typeof lang === "string" && /^[a-z]{2,3}$/.test(lang)) body.append("language_code", lang);

        const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": key },
          body,
        });
        if (!res.ok) {
          const err = await res.text();
          console.error(`ElevenLabs STT failed [${res.status}]: ${err}`);
          return new Response(err || "Transcription failed", { status: res.status || 502 });
        }
        const data = (await res.json()) as { text?: string };
        return Response.json({ text: (data.text ?? "").trim() }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
