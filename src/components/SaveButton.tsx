import { Bookmark } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useSavedStore, type SavedItem } from "@/lib/saved-store";
import { cn } from "@/lib/utils";

/** Several items saved and removed together (e.g. one multilingual card). */
export type GroupItem = Omit<SavedItem, "id" | "savedAt"> & { groupId: string };

/** Bookmark toggle; fills green when the item is in Saved. */
export function SaveButton({
  item,
  group,
  compact = false,
}: {
  item?: Omit<SavedItem, "id" | "savedAt">;
  /** When given, saves/removes the whole group at once. */
  group?: GroupItem[];
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { items, isSaved, toggle, toggleGroup } = useSavedStore();
  const disabled = group
    ? group.length === 0 || group.every((i) => !i.text.trim())
    : !item || !item.text.trim();
  const groupId = group?.[0]?.groupId;
  const saved = groupId
    ? items.some((i) => i.groupId === groupId)
    : item
      ? isSaved(item.kind, item.text, item.language)
      : false;
  const label = saved ? t("saved.unsave") : t("saved.save");
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (group && groupId ? toggleGroup(group) : item && toggle(item))}
      title={label}
      aria-label={label}
      aria-pressed={saved}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40",
        saved ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
      {!compact && (saved ? t("saved.savedLabel") : t("saved.save"))}
    </button>
  );
}
