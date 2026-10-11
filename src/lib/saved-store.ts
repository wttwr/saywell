import { useCallback, useEffect, useState } from "react";

export type SavedKind = "dictionary" | "translation" | "style" | "check";

export type SavedItem = {
  id: string;
  kind: SavedKind;
  /** Main saved text (headword, translation or style phrasing). */
  text: string;
  /** Language of `text`. */
  language: string;
  /** Secondary text: meaning, original source text, or style label. */
  detail?: string;
  /** Original text (translation source / style input). */
  source?: string;
  sourceLanguage?: string;
  transliteration?: string;
  /** Optional link tying several items saved together (e.g. one card). */
  groupId?: string;
  savedAt: string;
};

const STORAGE_KEY = "saywell.saved";
const listeners = new Set<(items: SavedItem[]) => void>();

function read(): SavedItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(items));
}

export const savedKey = (kind: SavedKind, text: string, language: string) =>
  `${kind}|${language}|${text.trim().toLowerCase()}`;

/** Favourites kept in this browser, shared across all pages. */
export function useSavedStore() {
  const [items, setItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    setItems(read());
    listeners.add(setItems);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setItems(read());
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(setItems);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isSaved = useCallback(
    (kind: SavedKind, text: string, language: string) =>
      items.some((i) => i.id === savedKey(kind, text, language)),
    [items],
  );

  const toggle = useCallback((item: Omit<SavedItem, "id" | "savedAt">) => {
    const id = savedKey(item.kind, item.text, item.language);
    const current = read();
    if (current.some((i) => i.id === id)) write(current.filter((i) => i.id !== id));
    else write([{ ...item, id, savedAt: new Date().toISOString() }, ...current]);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((i) => i.id !== id));
  }, []);

  // Save or remove a whole group of items (e.g. one multilingual card) at once.
  const toggleGroup = useCallback(
    (group: (Omit<SavedItem, "id" | "savedAt"> & { groupId: string })[]) => {
      const gid = group[0]?.groupId;
      if (!gid) return;
      const current = read();
      if (current.some((i) => i.groupId === gid)) {
        write(current.filter((i) => i.groupId !== gid));
      } else {
        const now = new Date().toISOString();
        const existingIds = new Set(current.map((i) => i.id));
        const toAdd = group
          .filter(
            (i) =>
              i.text.trim() && !existingIds.has(savedKey(i.kind, i.text, i.language)),
          )
          .map((i) => ({
            ...i,
            id: savedKey(i.kind, i.text, i.language),
            savedAt: now,
          }));
        const updated = current.map((i) =>
          group.some(
            (g) => g.text.trim() && savedKey(g.kind, g.text, g.language) === i.id,
          )
            ? { ...i, groupId: gid }
            : i,
        );
        write([...toAdd, ...updated]);
      }
    },
    [],
  );

  return { items, isSaved, toggle, toggleGroup, remove };
}
