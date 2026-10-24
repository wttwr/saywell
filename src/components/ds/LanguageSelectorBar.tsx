import { ChevronDown } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { useI18n } from "@/lib/i18n";
import { INPUT_LANGUAGES, LANGUAGES } from "@/lib/languages";

/** Shared language picker + shortcut chips used by Check, Style and Interpret. */
export function LanguageSelectorBar({
  label,
  shortcutsLabel,
  value,
  onChange,
  shortcuts,
  setShortcuts,
  compact = false,
}: {
  label: string;
  shortcutsLabel: string;
  value: string;
  onChange: (v: string) => void;
  shortcuts: string[];
  setShortcuts: Dispatch<SetStateAction<string[]>>;
  /** Widget mode hides the shortcuts row. */
  compact?: boolean;
}) {
  const { t, ln } = useI18n();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="relative inline-flex">
          <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
            {ln(value)}
            <ChevronDown className="size-3.5 opacity-60" />
          </span>
          <select
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            {INPUT_LANGUAGES.map((o) => (
              <option key={o} value={o}>
                {ln(o)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={compact ? "hidden" : "flex flex-wrap items-center gap-2 md:gap-3"}>
        <span className="text-sm text-muted-foreground">{shortcutsLabel}</span>
        {shortcuts.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              s === value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {ln(s)}
          </button>
        ))}
        <div className="relative inline-flex">
          <span className="pointer-events-none rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm text-muted-foreground">
            + {t("translate.add")}
          </span>
          <select
            aria-label={t("translate.addLanguage")}
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) setShortcuts((prev) => (prev.includes(v) ? prev : [...prev, v]));
              e.target.value = "";
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            <option value="" disabled>
              {t("translate.addLanguage")}
            </option>
            {LANGUAGES.map((o) => (
              <option key={o} value={o} disabled={shortcuts.includes(o)}>
                {shortcuts.includes(o) ? `✓ ${ln(o)}` : ln(o)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
