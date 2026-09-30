export const LANGUAGES = [
  "English",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Japanese",
  "Korean",
  "Finnish",
  "Swedish",
  "Norwegian",
  "Danish",
  "German",
  "French",
  "Spanish",
  "Portuguese",
  "Italian",
  "Dutch",
  "Polish",
  "Russian",
  "Ukrainian",
  "Turkish",
  "Arabic",
  "Hebrew",
  "Hindi",
  "Bengali",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malay",
  "Greek",
  "Czech",
  "Romanian",
] as const;


/** Special input-language value: let the AI detect the language of the text. */
export const AUTO_DETECT = "Auto-detect";
export const INPUT_LANGUAGES = [AUTO_DETECT, ...LANGUAGES];

/** Wording used inside AI prompts in place of a language name. */
export function promptLanguage(language: string) {
  return language === AUTO_DETECT ? "the language the text is written in (detect it)" : language;
}
export const SOURCE_LANGUAGES = INPUT_LANGUAGES;

const CODES: Record<string, string> = {
  English: "en", "Chinese (Simplified)": "zh-Hans", "Chinese (Traditional)": "zh-Hant",
  Japanese: "ja", Korean: "ko", Finnish: "fi", Swedish: "sv", Norwegian: "no", Danish: "da",
  German: "de", French: "fr", Spanish: "es", Portuguese: "pt", Italian: "it", Dutch: "nl",
  Polish: "pl", Russian: "ru", Ukrainian: "uk", Turkish: "tr", Arabic: "ar", Hebrew: "he",
  Hindi: "hi", Bengali: "bn", Thai: "th", Vietnamese: "vi", Indonesian: "id", Malay: "ms",
  Greek: "el", Czech: "cs", Romanian: "ro",
};
const AUTO_LABELS: Record<string, string> = { en: "Auto-detect", it: "Rilevamento automatico", zh: "自动检测" };
const FIXED: Record<string, Record<string, string>> = {
  zh: { "Chinese (Simplified)": "简体中文", "Chinese (Traditional)": "繁体中文" },
  it: { "Chinese (Simplified)": "Cinese (semplificato)", "Chinese (Traditional)": "Cinese (tradizionale)" },
};

/** Display a language name in the app's interface language. */
export function languageName(name: string, appLang: string): string {
  if (name === AUTO_DETECT) return AUTO_LABELS[appLang] ?? name;
  if (appLang === "en") return name;
  const fixed = FIXED[appLang]?.[name];
  if (fixed) return fixed;
  const code = CODES[name];
  if (!code) return name;
  try {
    const out = new Intl.DisplayNames([appLang], { type: "language" }).of(code);
    if (!out) return name;
    return appLang === "it" ? out.charAt(0).toUpperCase() + out.slice(1) : out;
  } catch {
    return name;
  }
}
