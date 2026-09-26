import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Globe, Settings } from "lucide-react";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

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

  return (
    <div className="bg-background px-5 pt-6 md:px-10 md:pt-8">
      <nav className="mx-auto flex max-w-6xl items-center gap-1">
        <Link
          to="/"
          className="mr-1 flex items-center rounded-full py-1 pl-1 pr-5"
          activeOptions={{ exact: false }}
        >
          <img
            src={logoAsset.url}
            alt="SayWell 会说"
            className="h-12 w-auto object-contain"
          />
        </Link>
        <Link
          to="/"
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}
          activeOptions={{ exact: true }}
        >
          {t("nav.translate")}
        </Link>
        <Link
          to="/check"
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}
        >
          {t("nav.check")}
        </Link>
        <Link
          to="/style"
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}
        >
          {t("nav.style")}
        </Link>
        <Link
          to="/dictionary"
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}
        >
          {t("nav.vocabulary")}
        </Link>
        <Link
          to="/settings"
          title={t("nav.settings")}
          aria-label={t("nav.settings")}
          className="ml-1 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-accent text-accent-foreground" }}
        >
          <Settings className="size-4" />
        </Link>



        <div className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Globe className="size-4" />
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
