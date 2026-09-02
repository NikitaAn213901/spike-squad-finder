import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, Volleyball, X } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Возможно, ссылка устарела или страница была перемещена.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            На главную
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
          Страница не загрузилась
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Что-то пошло не так. Попробуйте обновить или вернуться на главную.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Попробовать снова
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            На главную
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
      { title: "Городское волейбольное сообщество" },
      {
        name: "description",
        content: "Открытые тренировки и турниры по волейболу в городе.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
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

const navLinks = [
  { to: "/trainings", label: "Игры" },
  { to: "/tournaments", label: "Турниры" },
  { to: "/teams", label: "Команды" },
  { to: "/ratings", label: "Рейтинг" },
  { to: "/profile", label: "Профиль" },
] as const;

function SiteHeader() {
  const { user, profile, isOrganizer, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Volleyball className="size-5" />
          </span>
          <span className="font-display text-lg font-extrabold uppercase tracking-tight">
            Волей<span className="text-accent">Сити</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold">{profile?.full_name || "Игрок"}</div>
                <div className="text-xs text-muted-foreground">
                  {isOrganizer ? "Организатор" : "Игрок"}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                Выйти
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Войти</Link>
            </Button>
          )}
        </div>

        <button
          className="ml-auto inline-flex size-10 items-center justify-center rounded-lg border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
              >
                Выйти ({profile?.full_name || "профиль"})
              </Button>
            ) : (
              <Button asChild className="mt-2">
                <Link to="/auth" onClick={() => setOpen(false)}>
                  Войти
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>ВолейСити — сообщество городского волейбола</span>
        <div className="flex gap-4">
          <Link to="/trainings" className="hover:text-foreground">
            Тренировки
          </Link>
          <Link to="/tournaments" className="hover:text-foreground">
            Турниры
          </Link>
          <Link to="/teams" className="hover:text-foreground">
            Команды
          </Link>
          <Link to="/ratings" className="hover:text-foreground">
            Рейтинг
          </Link>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
