import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(5000),
  from: z.string().min(1),
  targets: z.array(z.string().min(1)).min(1).max(8),
});

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Translation service is not configured.");

    const sourceNote =
      data.from === "auto" ? "Detect the source language." : `The source language is ${data.from}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator. Translate the user's text faithfully and naturally. " +
              sourceNote +
              " Reply with ONLY a JSON object of the form " +
              '{"<language name>": {"translation": "...", "alternatives": [{"text": "...", "note": "..."}]}}. ' +
              "The note is optional and must be a short neutral remark such as 'More common in everyday speech', " +
              "'Slightly more formal', 'More literal' or 'More concise'. " +
              "Only include alternatives that are genuinely useful: meaningfully different wording, structure or idiom, " +
              "still accurate, grammatical and natural. Return an empty alternatives array when the only sensible " +
              "renderings would be near-identical, purely cosmetic, or uncertain. Never invent variety. " +
              "At most 4 alternatives per language. No markdown, no commentary.",
          },
          {
            role: "user",
            content: `Target languages: ${data.targets.join(", ")}\n\nText:\n${data.text}`,
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests right now. Please try again shortly.");
    if (res.status === 402) throw new Error("Translation credits are exhausted.");
    if (!res.ok) throw new Error("Translation failed. Please try again.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Could not read the translation result. Please try again.");
    }

    const results: Record<string, string> = {};
    const alternatives: Record<string, { text: string; note?: string }[]> = {};

    for (const target of data.targets) {
      const entry = (parsed[target] ?? Object.values(parsed)[0]) as unknown;
      if (typeof entry === "string") {
        results[target] = entry;
        alternatives[target] = [];
        continue;
      }
      const obj = (entry ?? {}) as { translation?: unknown; alternatives?: unknown };
      results[target] = typeof obj.translation === "string" ? obj.translation : "";
      const list = Array.isArray(obj.alternatives) ? obj.alternatives : [];
      alternatives[target] = list
        .map((a) => {
          if (typeof a === "string") return { text: a };
          const o = (a ?? {}) as { text?: unknown; note?: unknown };
          return {
            text: typeof o.text === "string" ? o.text : "",
            note: typeof o.note === "string" && o.note.trim() ? o.note.trim() : undefined,
          };
        })
        .filter(
          (a) =>
            a.text.trim().length > 0 &&
            a.text.trim() !== (results[target] ?? "").trim(),
        )
        .slice(0, 4);
    }
    return { results, alternatives };
  });
