import { X } from "lucide-react";
import type { RefObject } from "react";

import { DictateButton } from "@/components/DictateButton";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Shared writing box: textarea, clear ✕ / mic, character count and main action. */
export function TextInputSurface({
  value,
  onChange,
  onClear,
  placeholder,
  language,
  textareaRef,
  widget = false,
  wrapperClassName,
  textareaClassName,
  buttonClassName = "top-1",
  actionLabel,
  onAction,
  actionDisabled,
  actionsBefore,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder: string;
  language: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  widget?: boolean;
  wrapperClassName?: string;
  textareaClassName?: string;
  buttonClassName?: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled: boolean;
  actionsBefore?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <>
      <div className={cn(widget ? "relative mt-4 flex flex-1 flex-col" : "relative", wrapperClassName)}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full resize-none bg-transparent pr-10 text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60",
            widget && "flex-1",
            textareaClassName,
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              textareaRef.current?.focus();
            }}
            aria-label="Clear text"
            title="Clear text"
            className={cn(
              "absolute right-0 rounded-full bg-secondary p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              buttonClassName,
            )}
          >
            <X className="size-4" />
          </button>
        ) : (
          <DictateButton language={language} onText={onChange} className={cn("absolute right-0", buttonClassName)} />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.length} {t("check.characters")}
        </span>
        <div className="flex items-center gap-4">
          {actionsBefore}
          <button
            onClick={onAction}
            disabled={actionDisabled}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </>
  );
}
