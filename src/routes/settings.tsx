import { createFileRoute } from "@tanstack/react-router";
import { LanguageList, LanguageSelect } from "@/components/LanguageControls";
import { LANGUAGES, SOURCE_LANGUAGES } from "@/lib/languages";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useSettings, type Settings } from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Default languages | SayWell 会说" },
      {
        name: "description",
        content:
          "Choose the languages each section starts with: translate, check, style and dictionary defaults, saved automatically.",
      },
      { property: "og:title", content: "Settings — Default languages | SayWell 会说" },
      {
        property: "og:description",
        content: "Set the languages every section opens with. Changes are saved as you make them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { t } = useI18n();
  const { settings, update } = useSettings();

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
          <p className="mt-3 text-xs text-muted-foreground">{t("settings.note")}</p>
        </header>

        <div className="space-y-10">
          {section(
            "settings.translate",
            <>
              <Field label={t("settings.defaultSource")}>
                <LanguageSelect
                  label={t("settings.defaultSource")}
                  value={settings.translateSource}
                  onChange={set("translateSource")}
                  options={SOURCE_LANGUAGES}
                />
              </Field>
              <Field label={t("settings.defaultTargets")}>
                <LanguageList addLabel={t("translate.add")}
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
                <LanguageSelect
                  label={t("settings.defaultLanguage")}
                  value={settings.checkLanguage}
                  onChange={set("checkLanguage")}
                  options={LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList addLabel={t("translate.add")}
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
                <LanguageSelect
                  label={t("settings.defaultLanguage")}
                  value={settings.styleLanguage}
                  onChange={set("styleLanguage")}
                  options={LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList addLabel={t("translate.add")}
                  label={t("settings.shortcuts")}
                  values={settings.styleShortcuts}
                  onChange={set("styleShortcuts")}
                />
              </Field>
            </>,
          )}

          {section(
            "settings.dictionary",
            <>
              <Field label={t("settings.defaultLanguage")}>
                <LanguageSelect
                  label={t("settings.defaultLanguage")}
                  value={settings.dictionaryLanguage}
                  onChange={set("dictionaryLanguage")}
                  options={LANGUAGES}
                />
              </Field>
              <Field label={t("settings.shortcuts")}>
                <LanguageList addLabel={t("translate.add")}
                  label={t("settings.shortcuts")}
                  values={settings.dictionaryShortcuts}
                  onChange={set("dictionaryShortcuts")}
                />
              </Field>
              <Field label={t("settings.defaultMultilingual")}>
                <p className="text-xs text-muted-foreground">{t("settings.sourceExcluded")}</p>
                <LanguageList addLabel={t("translate.add")}
                  label={t("settings.defaultMultilingual")}
                  values={settings.dictionaryTranslateTo}
                  onChange={set("dictionaryTranslateTo")}
                />
              </Field>
            </>,
          )}
        </div>
      </div>
    </main>
  );
}
