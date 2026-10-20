import { AUTO_DETECT, LANGUAGES } from "@/lib/languages";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(1000),
  language: z.string().min(1),
  explanationLanguage: z.string().min(1).default("English"),
  context: z.string().max(1000).optional().default(""),
});

export type InterpretExample = { text: string; transliteration?: string; note?: string };

export type InterpretResult = {
  detectedLanguage: string;
  explanation: { meaning: string; literal?: string; usage: string; examples: InterpretExample[] };
  issue?: string;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const example = (v: unknown): InterpretExample | null => {
  const o = (v ?? {}) as Record<string, unknown>;
  const text = str(o["text"]);
  if (!text) return null;
  const out: InterpretExample = { text };
  const tr = str(o["transliteration"]);
  const note = str(o["note"]);
  if (tr) out.transliteration = tr;
  if (note) out.note = note;
  return out;
};

export const interpretText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<InterpretResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The interpret service is not configured.");

    const system = [
      `Detect the language of the user's text. Return its closest canonical name from this list: ${LANGUAGES.join(", ")}.`,
      data.language === AUTO_DETECT
        ? "The user chose auto-detect."
        : `The language picker is set to ${data.language}, but it is only a preference; analyze the text in its actual language.`,
      "The input may be a word, phrase, sentence or expression. Interpret it like a thoughtful language teacher.",
      `Write ALL explanations and notes in ${data.explanationLanguage}. Keep the expression itself and examples in the original input language. Only add a translation inside notes when it genuinely clarifies meaning.`,
      "explanation.meaning: what it means, including implied or figurative meaning. explanation.literal: the literal meaning only when it differs from the idiomatic one, else empty string.",
      "explanation.usage: when and how people naturally use it — tone, formality, cultural nuance only when real. Never invent cultural interpretations.",
      "explanation.examples: 2-3 realistic examples in different contexts, each with an optional short note.",
      "If ambiguous, explain the most likely interpretations in meaning. If the input is grammatically incorrect, do NOT silently fix it: describe the likely intended meaning and put the grammatical problem in 'issue'; otherwise issue is empty string.",
      "For non-Latin scripts, add transliteration (e.g. pinyin) to examples; otherwise omit it.",
      data.context ? `The text follows this earlier line in a conversation (context only, do not interpret it separately): "${data.context}". Use it to infer tone, intent and meaning.` : "",
      "Be concise; avoid repetition.",
      'Reply with ONLY a JSON object: {"detectedLanguage":"English","explanation":{"meaning":"...","literal":"","usage":"...","examples":[{"text":"...","transliteration":"","note":"..."}]},"issue":""}. No markdown.',
    ].join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests right now. Please try again shortly.");
    if (res.status === 402) throw new Error("Credits are exhausted.");
    if (!res.ok) throw new Error("Could not interpret this text. Please try again.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const cleaned = (json.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
    let p: Record<string, unknown>;
    try {
      p = JSON.parse(cleaned);
    } catch {
      throw new Error("Could not read the result. Please try again.");
    }

    const e = (p["explanation"] ?? {}) as Record<string, unknown>;
    const meaning = str(e["meaning"]);
    if (!meaning) throw new Error("Could not read the result. Please try again.");
    const det = str(p["detectedLanguage"]);
    const detectedLanguage = LANGUAGES.includes(det as (typeof LANGUAGES)[number])
      ? det
      : data.language === AUTO_DETECT
        ? "English"
        : data.language;

    const result: InterpretResult = {
      detectedLanguage,
      explanation: {
        meaning,
        usage: str(e["usage"]),
        examples: arr(e["examples"]).map(example).filter((x): x is InterpretExample => !!x).slice(0, 3),
      },
    };
    const literal = str(e["literal"]);
    if (literal) result.explanation.literal = literal;
    const issue = str(p["issue"]);
    if (issue) result.issue = issue;
    return result;
  });
