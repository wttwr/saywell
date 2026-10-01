import { AUTO_DETECT, LANGUAGES } from "@/lib/languages";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(5000),
  language: z.string().min(1),
  explanationLanguage: z.string().min(1).default("English"),
});

export type CheckIssue = {
  original: string;
  suggestion: string;
  reason: string;
  labels: ("Grammar" | "Typo" | "Naturalness")[];
};

export type CheckResult = {
  detectedLanguage: string;
  languageMismatch: boolean;
  status: "Looks good" | "A few issues found" | "Changes recommended";
  summary: string;
  corrected: string | null;
  issues: CheckIssue[];
};

export const checkText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<CheckResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The checking service is not configured.");

    const system = [
      `Detect the language actually used and return its closest canonical name from this list: ${LANGUAGES.join(", ")}.`,
      data.language === AUTO_DETECT
        ? "The user chose auto-detect."
        : `The language picker is set to ${data.language}, but it is only a preference and may be wrong. Set languageConfident to true only when the detected language is clearly different.`,
      "Evaluate whether the text is grammatically correct and natural in its detected language. Never translate it into the selected language.",
      "Evaluate only two things: grammar (word forms, agreement, tense, structure, articles/particles/prepositions) and naturalness (whether a fluent speaker would phrase it that way, awkward phrasing, unidiomatic word choice).",
      "Be conservative: make the minimum necessary changes. Preserve the user's wording, tone, formality, meaning and personal style.",
      "Never change something merely because another version is possible, shorter, more elegant, more concise or more formal. Stylistic preference is NOT a naturalness problem.",
      "If both the original and an alternative are correct and natural, keep the original.",
      "If the text is already correct and natural, return status 'Looks good', corrected = null and an empty issues array.",
      "Otherwise return status 'A few issues found' (1-2 minor issues) or 'Changes recommended' (more/serious issues), a corrected version with only the necessary edits, and one issue entry per meaningful change.",
      "Each issue: original (the exact original word or phrase), suggestion, reason (short, clear), labels (array of issue types).",
      "Classify each issue as exactly one of three types: 'Grammar', 'Typo' or 'Naturalness'.",
      "Grammar: the sentence breaks a grammatical or structural rule (tense, verb form, subject-verb agreement, articles, prepositions, word order, missing required element, sentence structure).",
      "Typo: accidental writing mistakes rather than language-knowledge problems (misspellings, repeated letters, missing or extra letters, obvious typing slips). Never label a clear typo as Grammar or Naturalness.",
      "Naturalness: understandable or grammatically possible, but the wording is unusual or unidiomatic for fluent speakers in that context.",
      "Choose the single most appropriate type for each issue. Do NOT add both Grammar and Naturalness by default; use two labels only in the rare case where one issue genuinely belongs to both categories.",
      `Write the summary and every reason in ${data.explanationLanguage}.`,
      "Keep original, suggestion and corrected in the detected language; never translate the text being checked.",
      'Reply with ONLY a JSON object: {"detectedLanguage":"English","languageConfident":true,"status":"...","summary":"...","corrected":null|"...","issues":[{"original":"...","suggestion":"...","reason":"...","labels":["Grammar"]}]}. No markdown, no commentary.',
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
    if (!res.ok) throw new Error("The check failed. Please try again.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: CheckResult;
    try {
      parsed = JSON.parse(cleaned) as CheckResult;
    } catch {
      throw new Error("Could not read the result. Please try again.");
    }

    const valid = ["Grammar", "Typo", "Naturalness"] as const;
    const issues = (Array.isArray(parsed.issues) ? parsed.issues : []).map((issue) => {
      const labels = (Array.isArray(issue.labels) ? issue.labels : []).filter((l) =>
        (valid as readonly string[]).includes(l),
      );
      return { ...issue, labels: labels.length ? labels : ["Grammar" as const] };
    });
    const status =
      parsed.status === "Looks good" ||
      parsed.status === "A few issues found" ||
      parsed.status === "Changes recommended"
        ? parsed.status
        : issues.length === 0
          ? "Looks good"
          : "Changes recommended";

    const fallbackSummary: Record<string, string> = {
      Italian: "Il testo è grammaticalmente corretto e suona naturale. Non sono necessarie modifiche.",
      "Simplified Chinese": "这段文字语法正确，表达自然，无需修改。",
    };

    const rawResult = parsed as CheckResult & { languageConfident?: boolean };
    const detectedLanguage =
      typeof rawResult.detectedLanguage === "string" &&
      LANGUAGES.includes(rawResult.detectedLanguage as (typeof LANGUAGES)[number])
        ? rawResult.detectedLanguage
        : data.language === AUTO_DETECT
          ? "English"
          : data.language;
    const languageMismatch =
      data.language !== AUTO_DETECT &&
      rawResult.languageConfident === true &&
      detectedLanguage.toLowerCase() !== data.language.toLowerCase();

    return {
      detectedLanguage,
      languageMismatch,
      status,
      summary:
        parsed.summary ||
        (status === "Looks good"
          ? fallbackSummary[data.explanationLanguage] ??
            "This text is grammatically correct and sounds natural. No changes are needed."
          : ""),
      corrected: status === "Looks good" ? null : (parsed.corrected ?? null),
      issues: status === "Looks good" ? [] : issues,
    };
  });
