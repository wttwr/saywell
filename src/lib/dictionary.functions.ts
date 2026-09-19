import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function looksLikeSentence(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/[;:!?]/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 6) return true;
  if (/\.\s/.test(trimmed) || (/\./.test(trimmed) && words.length > 1)) return true;
  const clauseMarkers = [
    " i ", " you ", " he ", " she ", " it ", " we ", " they ",
    " is ", " are ", " was ", " were ", " am ",
    " has ", " have ", " had ", " do ", " does ", " did ",
    " will ", " would ", " could ", " should ", " may ", " might ", " can ",
    " cannot ", " can't ", " don't ", " doesn't ", " didn't ",
  ];
  const lower = ` ${trimmed.toLowerCase()} `;
  return clauseMarkers.some((m) => lower.includes(m));
}

const schema = z.object({
  text: z.string().min(1).max(200),
  language: z.string().min(1),
}).refine((val) => !looksLikeSentence(val.text), {
  message: "This looks like a sentence. Try a single word, phrasal verb, expression or abbreviation.",
});

export type DictionarySense = {
  partOfSpeech?: string;
  definition: string;
  example?: string;
  exampleTranslation?: string;
};

export type DictionaryEntry = {
  text: string;
  language: string;
  transliteration?: string;
  type: "single_word" | "phrasal_verb" | "expression";
  meaning: string;
  senses: DictionarySense[];
  note?: string;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const asSense = (value: unknown): DictionarySense | null => {
  const o = (value ?? {}) as Record<string, unknown>;
  const definition = str(o["definition"]);
  if (!definition) return null;
  const sense: DictionarySense = { definition };
  const pos = str(o["partOfSpeech"]);
  const example = str(o["example"]);
  const exampleTranslation = str(o["exampleTranslation"]);
  if (pos) sense.partOfSpeech = pos;
  if (example) sense.example = example;
  if (exampleTranslation) sense.exampleTranslation = exampleTranslation;
  return sense;
};

export const lookUpWord = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<DictionaryEntry> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The dictionary service is not configured.");

    const system = [
      `You are a concise learner's dictionary for ${data.language}.`,
      `The user looks up a word, phrasal verb or expression in ${data.language}.`,
      "If the input is written in another language, interpret it as the closest equivalent in the target language and use that as the headword.",
      "Give a short plain-English meaning, then 1-3 distinct senses, each with a short natural example sentence in the target language and its English translation.",
      `Classify the item as "single_word", "phrasal_verb" or "expression".`,
      "If the target language uses a non-Latin script, add a transliteration (pinyin, romaji, etc.); otherwise omit it.",
      "Keep everything short and calm. No markdown.",
      'Reply with ONLY a JSON object: {"text":"headword","transliteration":"...","type":"single_word","meaning":"short english meaning","senses":[{"partOfSpeech":"noun","definition":"...","example":"...","exampleTranslation":"..."}],"note":"optional usage note"}.',
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

    if (res.status === 429)
      throw new Error("Too many requests right now. Please try again shortly.");
    if (res.status === 402) throw new Error("Credits are exhausted.");
    if (!res.ok) throw new Error("Could not look up that word. Please try again.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const cleaned = (json.choices?.[0]?.message?.content ?? "")
      .replace(/```json|```/g, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Could not read the result. Please try again.");
    }

    const meaning = str(parsed["meaning"]);
    if (!meaning) throw new Error("No dictionary entry found for that word.");

    const rawType = str(parsed["type"]);
    const type: DictionaryEntry["type"] =
      rawType === "phrasal_verb" || rawType === "expression" ? rawType : "single_word";

    const senses = (Array.isArray(parsed["senses"]) ? parsed["senses"] : [])
      .map(asSense)
      .filter((s): s is DictionarySense => s !== null)
      .slice(0, 3);

    const entry: DictionaryEntry = {
      text: str(parsed["text"]) || data.text.trim(),
      language: data.language,
      type,
      meaning,
      senses,
    };
    const translit = str(parsed["transliteration"]);
    const note = str(parsed["note"]);
    if (translit) entry.transliteration = translit;
    if (note) entry.note = note;
    return entry;
  });
