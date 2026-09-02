import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Администрирование ролей — ВолейСити" },
      {
        name: "description",
        content:
          "Панель администратора: выдача прав организатора игрокам волейбольного сообщества города.",
      },
      { property: "og:title", content: "Администрирование ролей — ВолейСити" },
      {
        property: "og:description",
        content: "Управляйте ролями участников: игрок, организатор, администратор.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Row = {
  id: string;
  full_name: string;
  city: string;
  roles: string[];
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  async function load() {
    setFetching(true);
    const [{ data: profiles }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, city").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map<string, string[]>();
    (roleRows ?? []).forEach((r) => {
      map.set(r.user_id, [...(map.get(r.user_id) ?? []), r.role as string]);
    });
    setRows(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        city: p.city,
        roles: map.get(p.id) ?? [],
      })),
    );
    setFetching(false);
  }

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) => r.full_name.toLowerCase().includes(s) || r.city.toLowerCase().includes(s),
    );
  }, [rows, q]);

  async function toggleRole(row: Row, role: "organizer" | "admin") {
    setBusy(row.id + role);
    const has = row.roles.includes(role);
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", row.id).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: row.id, role });
    setBusy(null);
    if (error) {
      toast.error("Не удалось изменить роль: " + error.message);
      return;
    }
    toast.success(has ? "Право снято" : "Право выдано");
    await load();
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-muted-foreground">Загрузка…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Нужен вход</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Войдите в аккаунт администратора, чтобы управлять ролями.
        </p>
        <Button asChild className="mt-4">
          <Link to="/auth">Войти</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Доступ только для администраторов</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          У вашего аккаунта нет прав администратора.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold">Роли участников</h1>
          <p className="text-sm text-muted-foreground">
            Выдавайте игрокам право создавать игры и турниры
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Поиск по имени или городу"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {fetching ? (
        <p className="text-sm text-muted-foreground">Загружаем участников…</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((row) => {
            const admin = row.roles.includes("admin");
            const organizer = row.roles.includes("organizer");
            return (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{row.full_name || "Без имени"}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    {row.city || "Город не указан"}
                    {admin && <Badge>Администратор</Badge>}
                    {organizer && <Badge variant="secondary">Организатор</Badge>}
                    {!admin && !organizer && <Badge variant="outline">Игрок</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    variant={organizer ? "outline" : "default"}
                    disabled={busy === row.id + "organizer"}
                    onClick={() => void toggleRole(row, "organizer")}
                  >
                    {organizer ? "Снять организатора" : "Сделать организатором"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === row.id + "admin" || row.id === user.id}
                    onClick={() => void toggleRole(row, "admin")}
                  >
                    {admin ? "Снять администратора" : "Сделать администратором"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Никого не найдено</p>
          )}
        </div>
      )}
    </div>
  );
}
