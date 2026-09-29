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
