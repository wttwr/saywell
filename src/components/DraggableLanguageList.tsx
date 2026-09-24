import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GripVertical, X } from "lucide-react";

import { LANGUAGES } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";

type DraggableLanguageListProps = {
  values: string[];
  onChange: (values: string[]) => void;
  addLabel: string;
  addAriaLabel: string;
  selected?: string;
  onSelect?: (language: string) => void;
  removable?: boolean;
  options?: readonly string[];
  exclude?: string[];
};

function move(values: string[], from: number, to: number) {
  if (from === to || from < 0 || to < 0) return values;
  const next = [...values];
  const [item] = next.splice(from, 1);
  if (!item) return values;
  next.splice(to, 0, item);
  return next;
}

export function DraggableLanguageList({
  values,
  onChange,
  addLabel,
  addAriaLabel,
  selected,
  onSelect,
  removable = false,
  options = LANGUAGES,
  exclude = [],
}: DraggableLanguageListProps) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState<string | null>(null);
  const pointerId = useRef<number | null>(null);

  const reorder = (fromLanguage: string, toLanguage: string) => {
    const from = values.indexOf(fromLanguage);
    const to = values.indexOf(toLanguage);
    const next = move(values, from, to);
    if (next !== values) onChange(next);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerId.current !== event.pointerId || !dragging) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(
      "[data-language-pill]",
    );
    const over = target?.dataset.languagePill;
    if (over && over !== dragging) {
      reorder(dragging, over);
      setDragging(over);
    }
  };

  const finishPointerDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerId.current === event.pointerId) {
      pointerId.current = null;
      setDragging(null);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((language, index) => (
        <span
          key={language}
          data-language-pill={language}
          className={`inline-flex items-center rounded-full transition-opacity ${
            language === selected
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/60 text-secondary-foreground"
          } ${dragging === language ? "opacity-60" : "opacity-100"}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const source = event.dataTransfer.getData("text/plain");
            if (source) reorder(source, language);
            setDragging(null);
          }}
        >
          <button
            type="button"
            draggable
            title={t("languages.dragToReorder")}
            aria-label={`${t("languages.dragToReorder")}: ${language}`}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", language);
              setDragging(language);
            }}
            onDragEnd={() => setDragging(null)}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") return;
              pointerId.current = event.pointerId;
              setDragging(language);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={onPointerMove}
            onPointerUp={finishPointerDrag}
            onPointerCancel={finishPointerDrag}
            onKeyDown={(event) => {
              if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
                return;
              }
              event.preventDefault();
              const nextIndex = event.key === "ArrowLeft" ? index - 1 : index + 1;
              if (nextIndex >= 0 && nextIndex < values.length) onChange(move(values, index, nextIndex));
            }}
            className="cursor-grab touch-none py-1.5 pl-2.5 pr-1 text-current active:cursor-grabbing"
          >
            <GripVertical className="size-3.5 opacity-55" />
          </button>
          <button
            type="button"
            onClick={() => onSelect?.(language)}
            disabled={!onSelect}
            className="py-1.5 pr-3.5 text-sm text-current disabled:cursor-default"
          >
            {language}
          </button>
          {removable && (
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== language))}
              aria-label={`${t("vocab.remove")} ${language}`}
              className="py-1.5 pl-0.5 pr-2.5 text-current opacity-55 transition-opacity hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          )}
        </span>
      ))}
      <div className="relative inline-flex">
        <span className="pointer-events-none rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm text-muted-foreground">
          + {addLabel}
        </span>
        <select
          aria-label={addAriaLabel}
          value=""
          onChange={(event) => {
            const language = event.target.value;
            if (language && !values.includes(language)) onChange([...values, language]);
            event.target.value = "";
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        >
          <option value="" disabled>
            {addAriaLabel}
          </option>
          {options
            .filter((language) => !exclude.includes(language))
            .map((language) => (
              <option key={language} value={language} disabled={values.includes(language)}>
                {values.includes(language) ? `✓ ${language}` : language}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}