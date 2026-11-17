import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AUTO_DETECT, LANGUAGES } from "@/lib/languages";

const schema = z.object({
  situation: z.string().min(1).max(300),
  language: z.string().min(1),
  style: z.enum(["everyday", "simple", "polite"]),
  explanationLanguage: z.string().min(1).default("English"),
});

export type SituationExpression = { text: string; meaning: string; transliteration?: string; note?: string };
export type SituationGroup = { title: string; expressions: SituationExpression[] };
export type SituationsResult = { language: string; groups: SituationGroup[] };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const STYLE: Record<string, string> = {
  everyday: "natural everyday register, as people really speak",
  simple: "short, simple, easy-to-remember sentences for learners",
  polite: "polite, courteous register suitable with strangers and staff",
};

export const exploreSituations = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<SituationsResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The situations service is not configured.");

    const system = [
      data.language === AUTO_DETECT
        ? "Detect the language of the situation text and generate 6-10 practical expressions in that language."
        : `Generate 6-10 practical expressions in ${data.language} that a person would actually say in this real-life situation.`,
      `Return the actual expression language in "language", using exactly one of these names: ${LANGUAGES.join(", ")}. Never return "Auto-detect" as the result language.`,
      `Style: ${STYLE[data.style]}.`,
      "Prefer natural, commonly used full expressions over literal translations or isolated vocabulary. Avoid repetitive or overly generic suggestions.",
      `Group them into 2-4 groups by conversation stage or purpose (e.g. arriving, asking, paying). Group titles are short and in ${data.explanationLanguage}.`,
      `For each expression give "meaning" in ${data.explanationLanguage}, and an optional one-sentence "note" in ${data.explanationLanguage} only when it adds useful usage context.`,
      "If the language uses a non-Latin script, add a transliteration (pinyin, romaji, etc.); otherwise omit it.",
      'Reply with ONLY JSON: {"language":"...","groups":[{"title":"...","expressions":[{"text":"...","meaning":"...","transliteration":"...","note":"..."}]}]}. No markdown.',
    ].join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Situation: ${data.situation}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests right now. Please try again shortly.");
    if (res.status === 402) throw new Error("Credits are exhausted.");
    if (!res.ok) throw new Error("Could not explore expressions. Please try again.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = (json.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Could not read the result. Please try again.");
    }

    const groups: SituationGroup[] = (Array.isArray(parsed["groups"]) ? parsed["groups"] : [])
      .map((g: unknown) => {
        const o = (g ?? {}) as Record<string, unknown>;
        const expressions = (Array.isArray(o["expressions"]) ? o["expressions"] : [])
          .map((e: unknown) => {
            const x = (e ?? {}) as Record<string, unknown>;
            const out: SituationExpression = { text: str(x["text"]), meaning: str(x["meaning"]) };
            if (str(x["transliteration"])) out.transliteration = str(x["transliteration"]);
            if (str(x["note"])) out.note = str(x["note"]);
            return out;
          })
          .filter((e) => e.text);
        return { title: str(o["title"]), expressions };
      })
      .filter((g) => g.expressions.length > 0);

    if (groups.length === 0) throw new Error("Could not read the result. Please try again.");
    const detected = z.enum(LANGUAGES).safeParse(parsed["language"]);
    if (data.language === AUTO_DETECT && !detected.success) {
      throw new Error("Could not detect the expression language. Please try again.");
    }
    return { language: data.language === AUTO_DETECT && detected.success ? detected.data : data.language, groups };
  });
