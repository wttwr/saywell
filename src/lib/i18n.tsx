import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const APP_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "zh", label: "中文" },
] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number]["code"];

const en = {
  "nav.translate": "Translate",
  "nav.check": "Check",
  "nav.appLanguage": "App language",

  "translate.title": "Lingua",
  "translate.subtitle": "One text, as many languages as you need.",
  "translate.from": "From",
  "translate.sourceLanguage": "Source language",
  "translate.translateTo": "Translate to",
  "translate.placeholder": "Type or paste text here...",
  "translate.characters": "characters",
  "translate.translating": "Translating...",
  "translate.add": "Add",
  "translate.addLanguage": "Add language",
  "translate.selectLanguage": "Select language",
  "translate.remove": "Remove",
  "translate.swap": "Swap languages",
  "translate.emptyTranslation": "Translation",
  "translate.error": "Translation failed. Please try again.",
  "translate.copy": "Copy",
  "translate.copied": "Copied",
  "translate.listen": "Listen",
  "translate.stop": "Stop",
  "translate.noAudio": "Audio not available for this language",
  "translate.allLanguages": "All languages",
  "translate.sourceLabel": "Source",
  "mode.carousel": "Carousel",
  "mode.side": "Horizontal split",
  "mode.stacked": "Vertical split",

  "check.title": "Check",
  "check.subtitle": "See whether your writing is correct and sounds natural.",
  "check.language": "Language",
  "check.placeholder": "Type or paste a sentence or paragraph...",
  "check.button": "Check",
  "check.checking": "Checking...",
  "check.characters": "characters",
  "check.error": "The check failed. Please try again.",
  "check.suggestedVersion": "Suggested version",
  "check.reasons": "Reasons",
  "check.original": "Original",
  "check.suggestion": "Suggestion",
  "check.reason": "Reason",
  "check.copy": "Copy",
  "check.copied": "Copied",
  "status.Looks good": "Looks good",
  "status.A few issues found": "A few issues found",
  "status.Changes recommended": "Changes recommended",
  "label.Grammar": "Grammar",
  "label.Typo": "Typo",
  "label.Naturalness": "Naturalness",
} as const;

export type TranslationKey = keyof typeof en;

const it: Record<TranslationKey, string> = {
  "nav.translate": "Traduci",
  "nav.check": "Controlla",
  "nav.appLanguage": "Lingua dell'app",

  "translate.title": "Lingua",
  "translate.subtitle": "Un testo, tutte le lingue che ti servono.",
  "translate.from": "Da",
  "translate.sourceLanguage": "Lingua di partenza",
  "translate.translateTo": "Traduci in",
  "translate.placeholder": "Scrivi o incolla il testo qui...",
  "translate.characters": "caratteri",
  "translate.translating": "Traduzione in corso...",
  "translate.add": "Aggiungi",
  "translate.addLanguage": "Aggiungi lingua",
  "translate.selectLanguage": "Seleziona lingua",
  "translate.remove": "Rimuovi",
  "translate.swap": "Scambia lingue",
  "translate.emptyTranslation": "Traduzione",
  "translate.error": "Traduzione non riuscita. Riprova.",
  "translate.copy": "Copia",
  "translate.copied": "Copiato",
  "translate.listen": "Ascolta",
  "translate.stop": "Ferma",
  "translate.noAudio": "Audio non disponibile per questa lingua",
  "translate.allLanguages": "Tutte le lingue",
  "translate.sourceLabel": "Originale",
  "mode.carousel": "Carosello",
  "mode.side": "Divisione orizzontale",
  "mode.stacked": "Divisione verticale",

  "check.title": "Controlla",
  "check.subtitle": "Scopri se il tuo testo è corretto e suona naturale.",
  "check.language": "Lingua",
  "check.placeholder": "Scrivi o incolla una frase o un paragrafo...",
  "check.button": "Controlla",
  "check.checking": "Controllo in corso...",
  "check.characters": "caratteri",
  "check.error": "Controllo non riuscito. Riprova.",
  "check.suggestedVersion": "Versione suggerita",
  "check.reasons": "Motivi",
  "check.original": "Originale",
  "check.suggestion": "Suggerimento",
  "check.reason": "Motivo",
  "check.copy": "Copia",
  "check.copied": "Copiato",
  "status.Looks good": "Va bene così",
  "status.A few issues found": "Alcuni problemi trovati",
  "status.Changes recommended": "Modifiche consigliate",
  "label.Grammar": "Grammatica",
  "label.Typo": "Errore di battitura",
  "label.Naturalness": "Naturalezza",
};

const zh: Record<TranslationKey, string> = {
  "nav.translate": "翻译",
  "nav.check": "检查",
  "nav.appLanguage": "界面语言",

  "translate.title": "Lingua",
  "translate.subtitle": "一段文字，翻译成你需要的所有语言。",
  "translate.from": "源语言",
  "translate.sourceLanguage": "源语言",
  "translate.translateTo": "翻译成",
  "translate.placeholder": "在此输入或粘贴文字…",
  "translate.characters": "个字符",
  "translate.translating": "翻译中…",
  "translate.add": "添加",
  "translate.addLanguage": "添加语言",
  "translate.selectLanguage": "选择语言",
  "translate.remove": "移除",
  "translate.swap": "交换语言",
  "translate.emptyTranslation": "译文",
  "translate.error": "翻译失败，请重试。",
  "translate.copy": "复制",
  "translate.copied": "已复制",
  "translate.listen": "朗读",
  "translate.stop": "停止",
  "translate.noAudio": "该语言暂不支持朗读",
  "translate.allLanguages": "所有语言",
  "translate.sourceLabel": "原文",
  "mode.carousel": "轮播",
  "mode.side": "水平分屏",
  "mode.stacked": "垂直分屏",

  "check.title": "检查",
  "check.subtitle": "看看你的表达是否正确、是否地道。",
  "check.language": "语言",
  "check.placeholder": "输入或粘贴一句话或一段文字…",
  "check.button": "检查",
  "check.checking": "检查中…",
  "check.characters": "个字符",
  "check.error": "检查失败，请重试。",
  "check.suggestedVersion": "建议版本",
  "check.reasons": "原因",
  "check.original": "原文",
  "check.suggestion": "建议",
  "check.reason": "原因",
  "check.copy": "复制",
  "check.copied": "已复制",
  "status.Looks good": "没有问题",
  "status.A few issues found": "发现少量问题",
  "status.Changes recommended": "建议修改",
  "label.Grammar": "语法",
  "label.Typo": "拼写错误",
  "label.Naturalness": "地道度",
};

const DICTIONARIES: Record<AppLanguage, Record<TranslationKey, string>> = {
  en,
  it,
  zh,
};

const STORAGE_KEY = "lingua.appLanguage";

type I18nValue = {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (saved && saved in DICTIONARIES) setLangState(saved);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
      },
      t: (key) => DICTIONARIES[lang][key] ?? en[key] ?? key,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const FALLBACK_I18N: I18nValue = {
  lang: "en",
  setLang: () => {},
  t: (key) => en[key] ?? key,
};

export function useI18n() {
  return useContext(I18nContext) ?? FALLBACK_I18N;
}
