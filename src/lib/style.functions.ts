import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(1000),
  language: z.string().min(1),
  explanationLanguage: z.string().min(1).default("English"),
});

export type StyleVariant = {
  label: string;
  text: string;
  transliteration?: string;
  explanation?: string;
};

export type StyleResult = {
  primary: StyleVariant;
  alternatives: StyleVariant[];
  note?: string;
};

const asVariant = (value: unknown): StyleVariant | null => {
  const o = (value ?? {}) as Record<string, unknown>;
  const text = typeof o["text"] === "string" ? o["text"].trim() : "";
  if (!text) return null;
  const label = typeof o["label"] === "string" && o["label"].trim() ? o["label"].trim() : "";
  const translit =
    typeof o["transliteration"] === "string" && o["transliteration"].trim()
      ? o["transliteration"].trim()
      : "";
  const explanation =
    typeof o["explanation"] === "string" && o["explanation"].trim() ? o["explanation"].trim() : "";

  const variant: StyleVariant = { label, text };
  if (translit) variant.transliteration = translit;
  if (explanation) variant.explanation = explanation;
  return variant;
};

export const exploreStyles = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<StyleResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The style service is not configured.");

    const system = [
      `The user writes in ${data.language} and wants to see natural ways to say the same thing in ${data.language}.`,
      `Keep every primary and alternative text in ${data.language}; never translate the content being explored.`,
      "The input may be a single word, a short phrase or a sentence. Never require a full sentence.",
      "First give the primary phrasing: the most natural default way to say it. If the user's text is already natural, repeat it unchanged.",
      "Then give alternatives that are natural and MEANINGFULLY different in register, politeness, structure or idiom.",
      `Each alternative has a short label in ${data.explanationLanguage}, chosen only when it genuinely applies, such as: More formal, More casual, Common in everyday speech, Polite, Direct, Idiomatic, More literal, Regional, Written language. Translate these concepts naturally rather than copying the English wording.`,
      "Do not generate every category. Do not invent variations to fill space. Usually 2-5 alternatives; one is fine; none is fine.",
      "All alternatives must preserve the core meaning. If nuance shifts, say so plainly in the explanation.",
      "This is about variation in expression, not correcting the user's writing. Never judge the user's own style, grammar or spelling.",
      "Never say an option is better or worse than another.",
      `If ${data.language} uses a script different from the Latin alphabet, add a transliteration (e.g. pinyin, romaji) for each option. Otherwise omit transliteration entirely.`,
      `Explanations and the note must be written in ${data.explanationLanguage}. Explanations are one short neutral sentence and may be omitted when nothing useful can be said.`,
      "If no meaningful alternative exists, return an empty alternatives array and use a short localized note saying that the primary phrasing is already the most natural option for this context.",
      'Reply with ONLY a JSON object: {"primary":{"text":"...","transliteration":"...","explanation":"..."},"alternatives":[{"label":"More formal","text":"...","transliteration":"...","explanation":"..."}],"note":"..."}. No markdown, no commentary.',
    ].join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests right now. Please try again shortly.");
    if (res.status === 402) throw new Error("Credits are exhausted.");
    if (!res.ok) throw new Error("Could not explore styles. Please try again.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Could not read the result. Please try again.");
    }

    const primary = asVariant(parsed["primary"]);
    if (!primary) throw new Error("Could not read the result. Please try again.");

    const rawAlts = Array.isArray(parsed["alternatives"]) ? parsed["alternatives"] : [];
    const alternatives = rawAlts
      .map(asVariant)
      .filter((v): v is StyleVariant => v !== null && v.text !== primary.text)
      .slice(0, 5);

    const note = typeof parsed["note"] === "string" ? parsed["note"].trim() : "";
    const result: StyleResult = { primary, alternatives };
    if (alternatives.length === 0) {
      const fallbackNote: Record<string, string> = {
        Italian: "La formulazione principale è già l'opzione più naturale in questo contesto.",
        "Simplified Chinese": "主要表达已经是此语境下最自然的说法。",
      };
      result.note =
        note ||
        fallbackNote[data.explanationLanguage] ||
        "The primary phrasing is already the most natural option for this context.";
    }
    return result;
  });
