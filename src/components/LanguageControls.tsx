import { ChevronDown, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/languages";

export function LanguageSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  label: string;
}) {
  return (
    <div className="relative inline-flex rounded-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <span className="pointer-events-none flex h-9 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground">
        {value}
        <ChevronDown className="size-3.5 opacity-60" />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer rounded-full opacity-0"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AddLanguageSelect({
  selected,
  onAdd,
  label,
  addLabel,
  options = LANGUAGES,
  excluded = [],
}: {
  selected: string[];
  onAdd: (value: string) => void;
  label: string;
  addLabel: string;
  options?: readonly string[];
  excluded?: string[];
}) {
  const available = options.filter((option) => !selected.includes(option) && !excluded.includes(option));
  return (
    <div className="relative inline-flex rounded-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <span className="pointer-events-none flex h-8 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 text-sm text-muted-foreground">
        <Plus className="size-3.5" />
        {addLabel}
      </span>
      <select
        aria-label={label}
        value=""
        disabled={available.length === 0}
        onChange={(event) => {
          if (event.target.value) onAdd(event.target.value);
          event.target.value = "";
        }}
        className="absolute inset-0 size-full cursor-pointer rounded-full opacity-0 disabled:cursor-not-allowed"
      >
        <option value="" disabled>{label}</option>
        {options.filter((option) => !excluded.includes(option)).map((option) => (
          <option key={option} value={option} disabled={selected.includes(option)}>
            {selected.includes(option) ? `✓ ${option}` : option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LanguageShortcuts({
  values,
  current,
  onSelect,
  onChange,
  addLabel,
  selectLabel,
}: {
  values: string[];
  current: string;
  onSelect: (value: string) => void;
  onChange: (values: string[]) => void;
  addLabel: string;
  selectLabel: string;
}) {
  return (
    <>
      {values.map((value) => (
        <Button
          key={value}
          type="button"
          variant={value === current ? "pillActive" : "pill"}
          size="compact"
          onClick={() => onSelect(value)}
        >
          {value}
        </Button>
      ))}
      <AddLanguageSelect
        selected={values}
        onAdd={(value) => onChange([...values, value])}
        label={selectLabel}
        addLabel={addLabel}
      />
    </>
  );
}

export function LanguageList({
  values,
  onChange,
  label,
  addLabel,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  label: string;
  addLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((value) => (
        <span key={value} className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary px-3.5 text-sm text-secondary-foreground">
          {value}
          <Button
            type="button"
            variant="quiet"
            size="iconSm"
            onClick={() => onChange(values.filter((item) => item !== value))}
            aria-label={`Remove ${value}`}
            className="-mr-2 size-6 rounded-full"
          >
            <X className="size-3.5" />
          </Button>
        </span>
      ))}
      <AddLanguageSelect
        selected={values}
        onAdd={(value) => onChange([...values, value])}
        label={label}
        addLabel={addLabel}
      />
    </div>
  );
}