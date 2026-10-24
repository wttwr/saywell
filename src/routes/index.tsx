import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, CheckCheck, Languages, LayoutGrid, List, MessageCircleQuestion, Plus, Search, Sparkles, X } from "lucide-react";
import { DEFAULT_LAYOUT, FEATURES, moveItem, sanitizeLayout, type FeatureId } from "@/lib/features";
import { useI18n } from "@/lib/i18n";
import { TranslateFeature } from "./translate";
import { StyleFeature } from "./style";
import { DictionaryFeature } from "./dictionary";
import { CheckFeature } from "./check";
import { InterpretFeature } from "./interpret";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workspace — SayWell 会说" },
      { name: "description", content: "Your SayWell tools side by side: compact cards you can add, remove and reorder." },
      { property: "og:title", content: "Workspace — SayWell 会说" },
      { property: "og:description", content: "Compact SayWell cards you can arrange, with one tap to the full view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkspacePage,
});

const WIDGETS = {
  translate: TranslateFeature,
  check: CheckFeature,
  style: StyleFeature,
  interpret: InterpretFeature,
  dictionary: DictionaryFeature,
} as const;

const KEY = "saywell.dashboard";
const VIEW_KEY = "saywell.workspaceView";
type View = "dashboard" | "list";

const ICONS = { translate: Languages, check: CheckCheck, style: Sparkles, interpret: MessageCircleQuestion, dictionary: BookOpen } as const;

function useView() {
  const [view, setView] = useState<View>("dashboard");
  useEffect(() => {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "list" || v === "dashboard") setView(v);
  }, []);
  const save = (v: View) => { setView(v); localStorage.setItem(VIEW_KEY, v); };
  return [view, save] as const;
}

function useLayout() {
  const [layout, setLayout] = useState<FeatureId[]>(DEFAULT_LAYOUT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLayout(sanitizeLayout(JSON.parse(raw)));
    } catch {}
  }, []);
  const save = (next: FeatureId[]) => {
    setLayout(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  return [layout, save] as const;
}

const iconBtn =
  "rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30";

function WorkspacePage() {
  const { t } = useI18n();
  const [layout, setLayout] = useLayout();
  const [editing, setEditing] = useState(false);
  const [view, setView] = useView();
  const [query, setQuery] = useState("");
  const byId = Object.fromEntries(FEATURES.map((f) => [f.id, f]));
  const available = FEATURES.filter((f) => !layout.includes(f.id));
  const q = query.trim().toLowerCase();
  const shown = q ? layout.filter((id) => t(byId[id]!.label).toLowerCase().includes(q)) : layout;
  const editingActive = editing && !q;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("workspace.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("workspace.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
        <div role="group" aria-label={t("workspace.view")} className="flex rounded-full bg-secondary p-1">
          {([["dashboard", LayoutGrid, "workspace.viewDashboard"], ["list", List, "workspace.viewList"]] as const).map(([v, Icon, label]) => (
            <button key={v} onClick={() => setView(v)} aria-pressed={view === v} aria-label={t(label)} title={t(label)}
              className={`rounded-full p-1.5 transition-colors ${view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="size-4" />
            </button>
          ))}
        </div>
        {!q && (
          <button
            onClick={() => setEditing((e) => !e)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${editing ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
          >
            {editing ? t("workspace.done") : t("workspace.customize")}
          </button>
        )}
        </div>
      </header>
      <div className="mb-6 flex items-center gap-3 border-b border-border pb-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("workspace.search")}
          aria-label={t("workspace.search")}
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            title="Clear search"
            className="shrink-0 rounded-full bg-secondary p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {editingActive && available.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("workspace.add")}</span>
          {available.map((f) => (
            <button
              key={f.id}
              onClick={() => setLayout([...layout, f.id])}
              className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Plus className="size-3.5" /> {t(f.label)}
            </button>
          ))}
        </div>
      )}
      {layout.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">{t("workspace.empty")}</p>
      )}
      {layout.length > 0 && shown.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">{t("workspace.noResults")}</p>
      )}
      {view === "list" && !editingActive ? (
        <ul className="flex flex-col gap-2">
          {shown.map((id) => {
            const f = byId[id]!;
            const Icon = ICONS[f.id];
            return (
              <li key={f.id}>
                <Link to={f.focusPath} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-4 py-4 transition-colors hover:bg-secondary/50">
                  <span className="rounded-full bg-secondary p-2 text-foreground"><Icon className="size-4" /></span>
                  <span className="flex-1 text-base font-medium">{t(f.label)}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map((id, i) => {
          const f = byId[id]!;
          const Widget = WIDGETS[f.id];
          return (
            <section key={f.id} className={`flex h-[540px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background ${f.id === "translate" ? "lg:col-span-2" : ""}`}>
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="text-base font-medium">{t(f.label)}</h2>
                <div className="flex items-center">
                {editingActive ? (
                  <>
                    <button className={iconBtn} aria-label={t("workspace.moveUp")} disabled={i === 0} onClick={() => setLayout(moveItem(layout, i, -1))}><ArrowUp className="size-4" /></button>
                    <button className={iconBtn} aria-label={t("workspace.moveDown")} disabled={i === layout.length - 1} onClick={() => setLayout(moveItem(layout, i, 1))}><ArrowDown className="size-4" /></button>
                    <button className={iconBtn} aria-label={t("workspace.remove")} onClick={() => setLayout(layout.filter((x) => x !== id))}><X className="size-4" /></button>
                  </>
                ) : (
                <Link
                  to={f.focusPath}
                  aria-label={t("workspace.open")}
                  title={t("workspace.open")}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
                )}
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <Widget mode="widget" />
              </div>
            </section>
          );
        })}
      </div>
      )}
    </main>
  );
}
