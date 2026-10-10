import { Bookmark } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useSavedStore, type SavedItem } from "@/lib/saved-store";
import { cn } from "@/lib/utils";

/** Bookmark toggle; fills green when the item is in Saved. */
export function SaveButton({
  item,
  compact = false,
}: {
  item: Omit<SavedItem, "id" | "savedAt">;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { isSaved, toggle } = useSavedStore();
  const disabled = !item.text.trim();
  const saved = !disabled && isSaved(item.kind, item.text, item.language);
  const label = saved ? t("saved.unsave") : t("saved.save");
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => toggle(item)}
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
