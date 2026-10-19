import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AUTO_DETECT } from "@/lib/languages";
import { DEFAULT_VOICE, VOICE_IDS } from "@/lib/voices";

/** Content-language preferences. These never change the interface language. */
export type Settings = {
  speechSpeed: number;
  voiceId: string;
  translateSource: string;
  translateTargets: string[];
  checkLanguage: string;
  checkShortcuts: string[];
  styleLanguage: string;
  styleShortcuts: string[];
  interpretLanguage: string;
  interpretShortcuts: string[];
  dictionaryLanguage: string;
  dictionaryShortcuts: string[];
  dictionaryTranslateTo: string[];
  /** Parent defaults that every section follows unless it is overridden. */
  sectionLanguage: string;
  sectionShortcuts: string[];
  /** Child keys that have their own value instead of following the parent. */
  sectionOverrides: string[];
};

export const LANGUAGE_CHILDREN = [
  "translateSource",
  "checkLanguage",
  "styleLanguage",
  "interpretLanguage",
  "dictionaryLanguage",
] as const;
export const SHORTCUT_CHILDREN = [
  "checkShortcuts",
  "styleShortcuts",
  "interpretShortcuts",
  "dictionaryShortcuts",
] as const;
export type ChildKey = (typeof LANGUAGE_CHILDREN)[number] | (typeof SHORTCUT_CHILDREN)[number];
const isChild = (k: string): k is ChildKey =>
  (LANGUAGE_CHILDREN as readonly string[]).includes(k) ||
  (SHORTCUT_CHILDREN as readonly string[]).includes(k);

/** Child sections take the parent value unless the user customised them. */
export function resolveSettings(raw: Settings): Settings {
  const out = { ...raw };
  for (const k of LANGUAGE_CHILDREN) if (!raw.sectionOverrides.includes(k)) out[k] = raw.sectionLanguage;
  for (const k of SHORTCUT_CHILDREN)
    if (!raw.sectionOverrides.includes(k)) out[k] = [...raw.sectionShortcuts];
  return out;
}

export const DEFAULT_SETTINGS: Settings = {
  speechSpeed: 0.8,
  voiceId: DEFAULT_VOICE,
  translateSource: AUTO_DETECT,
  translateTargets: ["Chinese (Simplified)", "Italian"],
  checkLanguage: AUTO_DETECT,
  checkShortcuts: ["English", "Italian", "Chinese (Simplified)"],
  styleLanguage: AUTO_DETECT,
  styleShortcuts: ["English", "Italian", "Chinese (Simplified)"],
  interpretLanguage: AUTO_DETECT,
  interpretShortcuts: ["English", "Italian", "Chinese (Simplified)"],
  dictionaryLanguage: AUTO_DETECT,
  dictionaryShortcuts: ["English", "Italian", "Chinese (Simplified)"],
  dictionaryTranslateTo: ["Italian", "Chinese (Simplified)", "Finnish"],
  sectionLanguage: AUTO_DETECT,
  sectionShortcuts: ["English", "Italian", "Chinese (Simplified)"],
  sectionOverrides: [],
};

const STORAGE_KEY = "lingua.settings";

type SettingsValue = {
  /** Effective values: children already resolved against the parent. */
  settings: Settings;
  /** Stored values, including which children are overridden. */
  raw: Settings;
  isOverridden: (key: ChildKey) => boolean;
  resetToParent: (key: ChildKey) => void;
  /** True once the stored preferences have been read in the browser. */
  loaded: boolean;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

const asStringArray = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((v) => typeof v === "string") ? (value as string[]) : null;

function parse(raw: string): Partial<Settings> {
  const out: Partial<Settings> = {};
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = parsed[key];
    if (key === "speechSpeed") {
      if (typeof value === "number" && Number.isFinite(value)) {
        out.speechSpeed = Math.min(2, Math.max(0.1, Math.round(value * 10) / 10));
      }
      continue;
    }
    if (key === "voiceId") {
      if (typeof value === "string" && VOICE_IDS.includes(value)) out.voiceId = value;
      continue;
    }
    if (Array.isArray(DEFAULT_SETTINGS[key])) {
      const arr = asStringArray(value);
      if (arr) (out[key] as string[] | undefined) = arr;
    } else if (typeof value === "string" && value) {
      (out[key] as string | undefined) = value;
    }
  }
  // Older saves had no parent: keep any section value that was customised.
  if (!Array.isArray(parsed["sectionOverrides"])) {
    out.sectionOverrides = ([...LANGUAGE_CHILDREN, ...SHORTCUT_CHILDREN] as ChildKey[]).filter(
      (k) => k in out && JSON.stringify(out[k]) !== JSON.stringify(DEFAULT_SETTINGS[k]),
    );
  }
  return out;
}

function persist(next: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings((prev) => ({ ...prev, ...parse(raw) }));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const update = useCallback<SettingsValue["update"]>((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (isChild(key as string)) {
        const parent = (LANGUAGE_CHILDREN as readonly string[]).includes(key as string)
          ? prev.sectionLanguage
          : prev.sectionShortcuts;
        const others = prev.sectionOverrides.filter((k) => k !== key);
        // Picking the same value as the parent means following it again.
        next.sectionOverrides =
          JSON.stringify(value) === JSON.stringify(parent) ? others : [...others, key as string];
      }
      persist(next);
      return next;
    });
  }, []);

  const resetToParent = useCallback((key: ChildKey) => {
    setSettings((prev) => {
      const next = { ...prev, sectionOverrides: prev.sectionOverrides.filter((k) => k !== key) };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      settings: resolveSettings(settings),
      raw: settings,
      isOverridden: (k: ChildKey) => settings.sectionOverrides.includes(k),
      resetToParent,
      loaded,
      update,
    }),
    [settings, loaded, update, resetToParent],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

const FALLBACK: SettingsValue = {
  settings: DEFAULT_SETTINGS,
  raw: DEFAULT_SETTINGS,
  isOverridden: () => false,
  resetToParent: () => {},
  loaded: false,
  update: () => {},
};

export function useSettings() {
  return useContext(SettingsContext) ?? FALLBACK;
}

/**
 * Applies a saved default once, the first time preferences are available.
 * Later changes the user makes inside a section are left alone for the session.
 */
export function useDefaultOnce(apply: () => void) {
  const { loaded } = useSettings();
  const done = useRef(false);
  useEffect(() => {
    if (!loaded || done.current) return;
    done.current = true;
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
}
