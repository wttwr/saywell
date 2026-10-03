import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { AUTO_DETECT, LANGUAGES } from "@/lib/languages";

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
      data.from === AUTO_DETECT
        ? "The user chose auto-detect."
        : `The language picker is set to ${data.from}, but it is only a preference and may be wrong.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          {
            role: "system",
            content: [
              "You are a professional translator. Translate the user's text faithfully and naturally.",
              sourceNote,
              `Detect the language actually used and return its closest canonical name from this list: ${LANGUAGES.join(", ")}.`,
              "Never reinterpret or translate the input into the selected source language. Always translate from the detected language.",
              'Set "languageConfident" to true only when the detected language is clearly different from the selected language.',
              'Reply with ONLY this JSON shape: {"detectedLanguage":"English","languageConfident":true,"translations":{"Italian":"..."}}. Include every requested target language key. No markdown, no commentary.',
            ].join(" "),
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

    const translations =
      parsed["translations"] && typeof parsed["translations"] === "object"
        ? (parsed["translations"] as Record<string, unknown>)
        : parsed;
    const results: Record<string, string> = {};
    for (const target of data.targets) {
      const exact = translations[target];
      results[target] = typeof exact === "string" ? exact : "";
    }
    const detectedLanguage =
      typeof parsed["detectedLanguage"] === "string" ? parsed["detectedLanguage"].trim() : "";
    const languageMismatch =
      data.from !== AUTO_DETECT &&
      parsed["languageConfident"] === true &&
      LANGUAGES.includes(detectedLanguage as (typeof LANGUAGES)[number]) &&
      detectedLanguage.toLowerCase() !== data.from.toLowerCase();

    return { results, detectedLanguage, languageMismatch };
  });
