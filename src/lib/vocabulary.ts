import { useCallback, useEffect, useState } from "react";

export type VocabularyType = "single_word" | "phrasal_verb" | "expression";

export const VOCABULARY_TYPES: VocabularyType[] = [
  "single_word",
  "phrasal_verb",
  "expression",
];

export type VocabularyItem = {
  id: string;
  language: string;
  text: string;
  meaning: string;
  type: VocabularyType;
  addedAt: string;
};

const STORAGE_KEY = "lingua.vocabulary";

/** Starter items so the list is useful before saving from Translate exists. */
const STARTER_ITEMS: VocabularyItem[] = [
  {
    id: "starter-fi-1",
    language: "Finnish",
    text: "varata",
    meaning: "to book / reserve",
    type: "single_word",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "starter-fi-2",
    language: "Finnish",
    text: "pitää huolta",
    meaning: "to look after / take care of",
    type: "expression",
    addedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "starter-en-1",
    language: "English",
    text: "look after",
    meaning: "to take care of someone or something",
    type: "phrasal_verb",
    addedAt: "2026-01-03T00:00:00.000Z",
  },
  {
    id: "starter-en-2",
    language: "English",
    text: "by the way",
    meaning: "used to add a side remark",
    type: "expression",
    addedAt: "2026-01-04T00:00:00.000Z",
  },
  {
    id: "starter-it-1",
    language: "Italian",
    text: "magari",
    meaning: "maybe / I wish",
    type: "single_word",
    addedAt: "2026-01-05T00:00:00.000Z",
  },
];

function read(): VocabularyItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return STARTER_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VocabularyItem[]) : STARTER_ITEMS;
  } catch {
    return STARTER_ITEMS;
  }
}

function write(items: VocabularyItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

/**
 * Modular vocabulary store. Reads on mount (client only) so the Translate
 * page can later add items through `addItem`.
 */
export function useVocabulary() {
  const [items, setItems] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const addItem = useCallback(
    (item: Omit<VocabularyItem, "id" | "addedAt">) => {
      setItems((prev) => {
        const next = [
          ...prev,
          { ...item, id: crypto.randomUUID(), addedAt: new Date().toISOString() },
        ];
        write(next);
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      write(next);
      return next;
    });
  }, []);

  return { items, addItem, removeItem };
}
