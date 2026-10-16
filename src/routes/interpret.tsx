import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { X } from "lucide-react";

import { DictateButton } from "@/components/DictateButton";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/interpret")({
  head: () => ({
    meta: [
      { title: "Interpret — Understand tone and meaning | SayWell 会说" },
      {
        name: "description",
        content: "Understand the tone, intent and hidden meaning behind a message or phrase.",
      },
      { property: "og:title", content: "Interpret — Read between the lines | SayWell 会说" },
      {
        property: "og:description",
        content: "Paste any message and see what it really means, how it sounds and why.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterpretPage,
});

function InterpretPage() {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("nav.interpret")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("interpret.subtitle")}</p>
        </header>

        <div className="relative">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("interpret.placeholder")}
            className="min-h-32 w-full resize-none bg-transparent pr-10 text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {text ? (
            <button
              type="button"
              onClick={() => {
                setText("");
                ref.current?.focus();
              }}
              aria-label="Clear text"
              title="Clear text"
              className="absolute right-0 top-0 rounded-full bg-secondary p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            <DictateButton language="Auto-detect" onText={setText} className="absolute right-0 top-0" />
          )}
        </div>

        <button
          disabled={!text.trim()}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {t("interpret.action")}
        </button>
      </div>
    </main>
  );
}
