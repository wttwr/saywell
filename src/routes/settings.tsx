import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Volume2, VolumeX, X } from "lucide-react";

import { INPUT_LANGUAGES, LANGUAGES, SOURCE_LANGUAGES } from "@/lib/languages";
import { APP_LANGUAGES, useI18n, type TranslationKey } from "@/lib/i18n";
import { useSettings, type Settings } from "@/lib/settings";
import { useSpeech } from "@/lib/speech";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { VOICES } from "@/lib/voices";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Default languages | SayWell 会说" },
      {
        name: "description",
        content:
          "Set how SayWell sounds — voice and speech speed — and the languages each section starts with: translate, check, style, interpret and dictionary defaults, saved automatically.",
      },
      { property: "og:title", content: "Settings — Default languages | SayWell 会说" },
      {
        property: "og:description",
        content:
          "Set how SayWell sounds — voice and speech speed — and the languages every section opens with. Changes are saved as you make them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SelectPill({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: readonly string[];
}) {
  const { ln } = useI18n();
  return (
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
        {options.map((o) => (
          <option key={o} value={o}>
            {ln(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function LanguageList({
  values,
  onChange,
  label,
  sourceLanguage,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  label: string;
  /** Shown first, labeled as the source, and not removable. */
  sourceLanguage?: string;
}) {
  const { t, ln } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sourceLanguage && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3.5 py-1.5 text-sm text-secondary-foreground">
          {ln(sourceLanguage)}
          <span className="text-xs text-muted-foreground">
            · {t("translate.sourceLabel")}
          </span>
        </span>
      )}
      {values.map((l) => (
        <span
          key={l}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3.5 py-1.5 text-sm text-secondary-foreground"
        >
          {ln(l)}
          <button
            onClick={() => onChange(values.filter((x) => x !== l))}
            aria-label={`${t("vocab.remove")} ${l}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <div className="relative inline-flex">
        <span className="pointer-events-none rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm text-muted-foreground">
          + {t("translate.add")}
        </span>
        <select
          aria-label={`${t("translate.addLanguage")} — ${label}`}
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v && !values.includes(v)) onChange([...values, v]);
            e.target.value = "";
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        >
          <option value="" disabled>
            {t("translate.addLanguage")}
          </option>
          {LANGUAGES.map((o) => {
            const added = values.includes(o) || o === sourceLanguage;
            return (
              <option key={o} value={o} disabled={added}>
                {added ? `✓ ${ln(o)}` : ln(o)}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { t, lang, setLang, ln } = useI18n();
  const { settings, update } = useSettings();
  const speech = useSpeech();
  const speechExampleId = "settings:speech-example";
  const speechLanguage = { en: "English", it: "Italian", zh: "Chinese (Simplified)" }[lang];
  const speechExamplePlaying = speech.playingId === speechExampleId;
  const speechExampleFailed = speech.errorId === speechExampleId;

  const section = (titleKey: TranslationKey, children: React.ReactNode) => (
    <section className="border-t border-border pt-8">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t(titleKey)}
      </h2>
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );

  const set = <K extends keyof Settings>(key: K) => (value: Settings[K]) => update(key, value);

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </header>

        <div className="space-y-10">
          {section(
            "settings.speech",
            <>
            <Field label={t("settings.voice")}>
              <div className="grid max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      const alreadySelected = settings.voiceId === v.id;
                      update("voiceId", v.id);
                      if (!alreadySelected) {
                        speech.speak(`settings:voice-${v.id}`, `Hello, I'm ${v.name}.`, "English", v.id);
                      }
                    }}
                    aria-pressed={settings.voiceId === v.id}
                    className={`rounded-xl px-3 py-2 text-left transition-colors ${
                      settings.voiceId === v.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="block text-sm font-medium">{v.name}</span>
                    <span className="block text-xs opacity-75">{v.tone[lang]}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t("settings.speechSpeed")}>
              <div className="flex max-w-md items-center gap-4">
                <Slider
                  aria-label={t("settings.speechSpeed")}
                  min={0.1}
                  max={2}
                  step={0.1}
                  value={[settings.speechSpeed]}
                  onValueChange={(values) => {
                    const value = values[0];
                    if (typeof value === "number") update("speechSpeed", value);
                  }}
                />
                <output className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                  {settings.speechSpeed.toFixed(1)}×
                </output>
              </div>
              <div className="mt-4 flex max-w-md items-center justify-between gap-4 rounded-lg bg-secondary/40 px-4 py-3">
                <p className="min-w-0 text-sm text-foreground">{t("settings.speechExample")}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => speech.speak(speechExampleId, t("settings.speechExample"), speechLanguage)}
                  aria-pressed={speechExamplePlaying}
                  aria-label={speechExamplePlaying ? t("translate.stop") : t("translate.listen")}
                  title={speechExamplePlaying ? t("translate.stop") : t("translate.listen")}
                  className="shrink-0 text-muted-foreground"
                >
                  {speechExampleFailed ? <VolumeX /> : <Volume2 className={speechExamplePlaying ? "animate-pulse" : ""} />}
                  {speechExamplePlaying ? t("translate.stop") : t("translate.listen")}
                </Button>
              </div>
            </Field>
            </>,
          )}
          {section(
            "settings.appLanguage",
            <Field label={t("settings.interfaceLanguage")}>
              <div className="flex flex-wrap gap-2">
                {APP_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    aria-pressed={lang === l.code}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                      lang === l.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </Field>,
          )}
          {section(
            "settings.translate",
            <>
              <Field label={t("settings.defaultSource")}>
                <SelectPill
                  label={t("settings.defaultSource")}
                  value={settings.translateSource}
                  onChange={set("translateSource")}
                  options={SOURCE_LANGUAGES}
                />
              </Field>
              <Field label={t("settings.defaultTargets")}>
                <LanguageList
                  label={t("settings.defaultTargets")}
                  values={settings.translateTargets}
                  onChange={set("translateTargets")}
                />
              </Field>
            </>,
          )}

          {section(
            "settings.check",
            <>
              <Field label={t("settings.defaultLanguage")}>
                <SelectPill
                  label={t("settings.defaultLanguage")}
                  value={settings.checkLanguage}
                  onChange={set("checkLanguage")}
                  options={INPUT_LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList
                  label={t("settings.shortcuts")}
                  values={settings.checkShortcuts}
                  onChange={set("checkShortcuts")}
                />
              </Field>
            </>,
          )}

          {section(
            "settings.style",
            <>
              <Field label={t("settings.defaultLanguage")}>
                <SelectPill
                  label={t("settings.defaultLanguage")}
                  value={settings.styleLanguage}
                  onChange={set("styleLanguage")}
                  options={INPUT_LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList
                  label={t("settings.shortcuts")}
                  values={settings.styleShortcuts}
                  onChange={set("styleShortcuts")}
                />
              </Field>
            </>,
          )}

          {section(
            "nav.interpret",
            <>
              <Field label={t("settings.defaultLanguage")}>
                <SelectPill
                  label={t("settings.defaultLanguage")}
                  value={settings.interpretLanguage}
                  onChange={set("interpretLanguage")}
                  options={INPUT_LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList
                  label={t("settings.shortcuts")}
                  values={settings.interpretShortcuts}
                  onChange={set("interpretShortcuts")}
                />
              </Field>
            </>,
          )}

          {section(
            "nav.listen",
            <>
              <Field label={t("settings.defaultLanguage")}>
                <SelectPill
                  label={t("settings.defaultLanguage")}
                  value={settings.listenLanguage}
                  onChange={set("listenLanguage")}
                  options={INPUT_LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList
                  label={t("settings.shortcuts")}
                  values={settings.listenShortcuts}
                  onChange={set("listenShortcuts")}
                />
              </Field>
            </>,
          )}

          {section(
            "settings.dictionary",
            <>
              <Field label={t("settings.defaultLanguage")}>
                <SelectPill
                  label={t("settings.defaultLanguage")}
                  value={settings.dictionaryLanguage}
                  onChange={set("dictionaryLanguage")}
                  options={INPUT_LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList
                  label={t("settings.shortcuts")}
                  values={settings.dictionaryShortcuts}
                  onChange={set("dictionaryShortcuts")}
                />
              </Field>
              <Field label={t("settings.defaultMultilingual")}>
                <LanguageList
                  label={t("settings.defaultMultilingual")}
                  values={settings.dictionaryTranslateTo}
                  onChange={set("dictionaryTranslateTo")}
                  sourceLanguage={settings.dictionaryLanguage}
                />
              </Field>
            </>,
          )}
        </div>
      </div>
    </main>
  );
}
