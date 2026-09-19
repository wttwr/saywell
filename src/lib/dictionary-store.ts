import { useCallback, useEffect, useState } from "react";

export type DictionaryType =
  | "single_word"
  | "phrasal_verb"
  | "expression"
  | "abbreviation";

export type SavedDictionaryEntry = {
  id: string;
  language: string;
  entry_text: string;
  type: DictionaryType;
  meaning: string;
  expanded_form?: string;
  etymology?: string;
  image_url?: string;
  transliteration?: string;
  date_added: string;
};

const STORAGE_KEY = "lingua.dictionary";

function read(): SavedDictionaryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedDictionaryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: SavedDictionaryEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

/** Local store of looked-up / saved dictionary entries. */
export function useDictionaryStore() {
  const [entries, setEntries] = useState<SavedDictionaryEntry[]>([]);

  useEffect(() => {
    setEntries(read());
  }, []);

  const saveEntry = useCallback(
    (entry: Omit<SavedDictionaryEntry, "id" | "date_added">) => {
      setEntries((prev) => {
        const exists = prev.some(
          (e) =>
            e.language === entry.language &&
            e.entry_text.toLowerCase() === entry.entry_text.toLowerCase(),
        );
        if (exists) return prev;
        const next = [
          {
            ...entry,
            id: crypto.randomUUID(),
            date_added: new Date().toISOString(),
          },
          ...prev,
        ];
        write(next);
        return next;
      });
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      write(next);
      return next;
    });
  }, []);

  return { entries, saveEntry, removeEntry };
}
