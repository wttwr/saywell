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
  explanationLanguage: z.string().min(1).default("English"),
}).refine((val) => !looksLikeSentence(val.text), {
  message: "Dictionary supports words, phrasal verbs, expressions, and abbreviations, but not full sentences.",
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
  type: "single_word" | "phrasal_verb" | "expression" | "abbreviation";
  meaning: string;
  expandedForm?: string;
  etymology?: string;
  imageUrl?: string;
  senses: DictionarySense[];
  note?: string;
  /** Language actually used for the entry (detected when it differs from the selected one). */
  detectedLanguage?: string;
  /** True only when detection is confident the input is in another language. */
  languageMismatch?: boolean;
  /** Original input when the entry is the nearest match to a misspelling. */
  correctedFrom?: string;
};

export type DictionaryLookup = {
  entry: DictionaryEntry | null;
  /** Plausible alternatives when no single confident match exists. */
  suggestions?: string[];
};

/** Looks for a free, relevant photo on Wikipedia. Returns undefined when none fits. */
async function findImage(query: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return undefined;
    const json = (await res.json()) as {
      type?: string;
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    if (json.type === "disambiguation") return undefined;
    const url = json.originalimage?.source ?? json.thumbnail?.source;
    return typeof url === "string" && url.startsWith("https://") ? url : undefined;
  } catch {
    return undefined;
  }
}


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
  .handler(async ({ data }): Promise<DictionaryLookup> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The dictionary service is not configured.");

    const system = [
      `You are a concise learner's dictionary for ${data.language}.`,
      "The user may look up a single word, a phrasal verb, a fixed expression, or an abbreviation.",
      "Do not treat full sentences as dictionary entries.",
      `First detect the language the user actually typed. Set "detectedLanguage" to that language name in English (for example "English", "Italian"). Never translate the input: always define exactly what the user typed, in its own language.`,
      `If the input is clearly not ${data.language}, build the whole entry in the detected language and set "languageConfident" to true. If the item exists in ${data.language} too, or detection is uncertain, keep ${data.language} as the detected language and set "languageConfident" to false.`,
      `Write the meaning, definitions, example translations, etymology and any note in ${data.explanationLanguage}. Keep the headword and the example sentences in ${data.language}.`,
      "Give a short meaning, then 1-3 distinct senses, each with a short natural example sentence in the target language and its translation.",
      `Classify the item as "single_word", "phrasal_verb", "expression" or "abbreviation".`,
      'If the item is an abbreviation or acronym, set "expandedForm" to its full expanded form; otherwise leave it empty.',
      'Add "etymology" (1-2 readable sentences on the origin and how the meaning developed) only when you are confident it is accurate; otherwise leave it empty. Never invent one.',
      'If the entry refers to a tangible, visually identifiable physical object (dog, chair, violin), set "imageQuery" to the English Wikipedia article title for that object; for abstract words, expressions or abbreviations leave it empty.',
      "If the target language uses a non-Latin script, add a transliteration (pinyin, romaji, etc.); otherwise omit it.",
      'If the input is a real entry, set "matchType" to "exact". If it is misspelled, incomplete or malformed but you are confident which entry was intended, set "matchType" to "corrected" and build the entry for the intended word. If several different words are equally plausible, set "matchType" to "ambiguous", leave the entry fields empty and list 2-4 plausible entries in "suggestions".',
      "Keep everything short and calm. No markdown.",
      'Reply with ONLY a JSON object: {"text":"headword","matchType":"exact","suggestions":[],"detectedLanguage":"English","languageConfident":false,"transliteration":"...","type":"single_word","meaning":"short meaning","expandedForm":"","etymology":"","imageQuery":"","senses":[{"partOfSpeech":"noun","definition":"...","example":"...","exampleTranslation":"..."}],"note":"optional usage note"}.',
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

    const matchType = str(parsed["matchType"]).toLowerCase();
    const suggestions = (Array.isArray(parsed["suggestions"]) ? parsed["suggestions"] : [])
      .map(str)
      .filter(Boolean)
      .slice(0, 4);

    const meaning = str(parsed["meaning"]);
    if (matchType === "ambiguous" || !meaning) {
      if (suggestions.length > 0) return { entry: null, suggestions };
      if (!meaning) throw new Error("No dictionary entry found for that word.");
    }

    const rawType = str(parsed["type"]);
    const validTypes: DictionaryEntry["type"][] = ["single_word", "phrasal_verb", "expression", "abbreviation"];
    const type: DictionaryEntry["type"] = validTypes.includes(rawType as DictionaryEntry["type"])
      ? (rawType as DictionaryEntry["type"])
      : "single_word";

    const senses = (Array.isArray(parsed["senses"]) ? parsed["senses"] : [])
      .map(asSense)
      .filter((s): s is DictionarySense => s !== null)
      .slice(0, 3);

    const detected = str(parsed["detectedLanguage"]);
    const confident = parsed["languageConfident"] === true;
    const mismatch =
      confident &&
      detected.length > 0 &&
      detected.toLowerCase() !== data.language.toLowerCase();
    const usedLanguage = mismatch ? detected : data.language;

    const entry: DictionaryEntry = {
      text: str(parsed["text"]) || data.text.trim(),
      language: usedLanguage,
      type,
      meaning,
      senses,
    };
    if (mismatch) {
      entry.detectedLanguage = detected;
      entry.languageMismatch = true;
    }
    const translit = str(parsed["transliteration"]);
    const note = str(parsed["note"]);
    const expandedForm = str(parsed["expandedForm"]);
    const etymology = str(parsed["etymology"]);
    const imageQuery = str(parsed["imageQuery"]);
    if (translit) entry.transliteration = translit;
    if (note) entry.note = note;
    if (expandedForm && type === "abbreviation") entry.expandedForm = expandedForm;
    if (etymology) entry.etymology = etymology;
    if (imageQuery) {
      const imageUrl = await findImage(imageQuery);
      if (imageUrl) entry.imageUrl = imageUrl;
    }
    return entry;
  });
