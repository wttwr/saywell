import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { useI18n } from "@/lib/i18n";
import { CheckFeature } from "./check";
import { InterpretFeature } from "./interpret";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SayWell 会说" },
      { name: "description", content: "Your SayWell tools side by side: check and interpret text in compact cards." },
      { property: "og:title", content: "Dashboard — SayWell 会说" },
      { property: "og:description", content: "Compact Check and Interpret cards, with one tap to the full view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const WIDGETS = { check: CheckFeature, interpret: InterpretFeature } as const;

function DashboardPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        {FEATURES.map((f) => {
          const Widget = WIDGETS[f.id];
          return (
            <section key={f.id} className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background">
              <div className="flex items-center justify-between px-4 pt-4">
                <h2 className="text-base font-medium">{t(f.label)}</h2>
                <Link
                  to={f.focusPath}
                  aria-label={t("dashboard.open")}
                  title={t("dashboard.open")}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
              <Widget mode="widget" />
            </section>
          );
        })}
      </div>
    </main>
  );
}
