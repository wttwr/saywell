import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Globe, Menu, Settings, Bookmark } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { APP_LANGUAGES, I18nProvider, useI18n, type AppLanguage } from "../lib/i18n";
import { SettingsProvider } from "../lib/settings";

import appCss from "../styles.css?url";
import logoAsset from "../assets/saywell-logo.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  console.error(normalizedError);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(normalizedError, { boundary: "tanstack_root_error_component" });
  }, [normalizedError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SayWell 会说 — Translate text into multiple languages" },
      { name: "description", content: "SayWell 会说 — Translate text into multiple languages instantly" },
      { name: "author", content: "SayWell 会说" },
      { property: "og:title", content: "SayWell 会说 — Multi-language text translator" },
      { property: "og:description", content: "SayWell 会说 — Translate text into multiple languages instantly" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppNav() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const pill =
    "flex items-center gap-1.5 rounded-full px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:px-4";
  const active = { className: "bg-accent font-medium text-accent-foreground" };
  const links = [
    { to: "/", label: t("nav.translate"), exact: true },
    { to: "/check", label: t("nav.check") },
    { to: "/style", label: t("nav.style") },
    { to: "/dictionary", label: t("nav.vocabulary") },
    { to: "/saved", label: t("nav.saved"), icon: Bookmark },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ] as const;

  const langSelect = (
    <div className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:px-3">
      <Globe className="size-4 shrink-0" />
      <select
        aria-label={t("nav.appLanguage")}
        value={lang}
        onChange={(e) => setLang(e.target.value as AppLanguage)}
        className="cursor-pointer bg-transparent text-sm outline-none"
      >
        {APP_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="bg-background px-5 pt-6 md:px-6 md:pt-8 lg:px-10">
      <nav className="mx-auto flex max-w-6xl items-center gap-0.5 lg:gap-1">
        <Link to="/" className="mr-1 flex shrink-0 items-center rounded-full py-1 pl-1 pr-3 lg:pr-5">
          <img src={logoAsset.url} alt="SayWell 会说" className="h-9 w-auto object-contain" />
        </Link>
        <div className="hidden items-center gap-0.5 md:flex lg:gap-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={pill} activeProps={active} activeOptions={{ exact: "exact" in l }}>
              {"icon" in l && <l.icon className="size-4 shrink-0" />}
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto hidden md:block">{langSelect}</div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Menu"
              className="ml-auto flex size-11 items-center justify-center rounded-full text-foreground hover:bg-secondary md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="mt-8 flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base text-muted-foreground hover:bg-secondary hover:text-foreground"
                  activeProps={active}
                  activeOptions={{ exact: "exact" in l }}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-border pt-4">{langSelect}</div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SettingsProvider>
          <AppNav />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </SettingsProvider>
      </I18nProvider>
    </QueryClientProvider>

  );
}
