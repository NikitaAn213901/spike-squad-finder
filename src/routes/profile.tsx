import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, MapPin, Star, Trophy, Users, CalendarCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { POSITIONS, SKILLS, CITIES, ageFromYear } from "@/lib/volley";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль волейболиста — ВолейСити" },
      {
        name: "description",
        content:
          "Карточка игрока: позиция, уровень, посещаемость, турниры, MVP, рейтинг и достижения.",
      },
      { property: "og:title", content: "Профиль волейболиста — ВолейСити" },
      {
        property: "og:description",
        content: "Спортивная карточка игрока со статистикой и достижениями.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-muted-foreground">Загрузка…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Профиль игрока</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Войдите, чтобы заполнить карточку волейболиста и видеть свою статистику.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Войти</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <PlayerCard userId={user.id} />
      <StatsBlock userId={user.id} />
      <AchievementsBlock userId={user.id} />
      <EditForm profile={profile} onSaved={refreshProfile} />
    </div>
  );
}

function PlayerCard({ userId }: { userId: string }) {
  const { profile } = useAuth();
  const age = ageFromYear(profile?.birth_year);

  return (
    <Card className="overflow-hidden border-0 bg-primary text-primary-foreground shadow-lg">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar className="size-24 border-4 border-accent">
          <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name || "Игрок"} />
          <AvatarFallback className="bg-accent text-2xl font-bold text-accent-foreground">
            {(profile?.full_name || "И").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            {profile?.full_name || "Игрок"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-90">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {profile?.city || "Город не указан"}
            </span>
            {age && <span>{age} лет</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile?.position && (
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                {POSITIONS[profile.position as keyof typeof POSITIONS]}
              </Badge>
            )}
            <Badge variant="secondary">
              {SKILLS[(profile?.skill ?? "amateur") as keyof typeof SKILLS]}
            </Badge>
          </div>
          {profile?.bio && <p className="mt-3 text-sm opacity-90">{profile.bio}</p>}
        </div>

        <div className="shrink-0 rounded-2xl bg-primary-foreground/10 px-6 py-4 text-center">
          <div className="text-xs uppercase tracking-wide opacity-80">Рейтинг</div>
          <div className="font-display text-4xl font-extrabold text-accent">
            {profile?.competitive_rating ?? 1000}
          </div>
          <div className="text-xs opacity-80">ELO (турниры)</div>
        </div>
      </div>
      <input type="hidden" value={userId} readOnly />
    </Card>
  );
}

function StatsBlock({ userId }: { userId: string }) {
  const { profile } = useAuth();

  const { data } = useQuery({
    queryKey: ["player-stats", userId],
    queryFn: async () => {
      const [signups, teams] = await Promise.all([
        supabase.from("training_signups").select("attendance").eq("user_id", userId),
        supabase.from("team_members").select("id").eq("user_id", userId),
      ]);
      const rows = signups.data ?? [];
      const played = rows.filter((r) => r.attendance === "attended" || r.attendance === "late").length;
      const marked = rows.filter(
        (r) => r.attendance === "attended" || r.attendance === "late" || r.attendance === "no_show",
      ).length;
      return {
        played,
        attendance: marked ? Math.round((played / marked) * 100) : null,
        tournaments: teams.data?.length ?? 0,
      };
    },
  });

  const items = [
    { icon: CalendarCheck, label: "Сыграно игр", value: data?.played ?? 0 },
    { icon: Trophy, label: "Турниров", value: data?.tournaments ?? 0 },
    { icon: Star, label: "MVP матчей", value: profile?.mvp_count ?? 0 },
    {
      icon: Users,
      label: "Посещаемость",
      value: data?.attendance === null || data?.attendance === undefined ? "—" : `${data.attendance}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label}>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <it.icon className="size-5 text-accent" />
            <div className="font-display text-2xl font-extrabold">{it.value}</div>
            <div className="text-xs text-muted-foreground">{it.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AchievementsBlock({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["achievements", userId],
    queryFn: async () => {
      const [all, mine] = await Promise.all([
        supabase.from("achievements").select("*").order("sort_order"),
        supabase.from("user_achievements").select("code").eq("user_id", userId),
      ]);
      const earned = new Set((mine.data ?? []).map((r) => r.code));
      return (all.data ?? []).map((a) => ({ ...a, earned: earned.has(a.code) }));
    },
  });

  const earnedCount = data?.filter((a) => a.earned).length ?? 0;
  const total = data?.length ?? 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="size-5 text-accent" /> Достижения
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {earnedCount} из {total}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={total ? (earnedCount / total) * 100 : 0} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(data ?? []).map((a) => (
            <div
              key={a.code}
              className={`rounded-xl border p-3 text-sm ${
                a.earned ? "border-accent bg-accent/10" : "border-border opacity-55"
              }`}
            >
              <div className="text-xl">{a.icon}</div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.description}</div>
            </div>
          ))}
          {total === 0 && <p className="text-sm text-muted-foreground">Список достижений пуст.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function EditForm({
  profile,
  onSaved,
}: {
  profile: ReturnType<typeof useAuth>["profile"];
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    full_name: "",
    city: "",
    phone: "",
    avatar_url: "",
    birth_year: "",
    position: "",
    skill: "amateur",
    bio: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      city: profile.city ?? "",
      phone: profile.phone ?? "",
      avatar_url: profile.avatar_url ?? "",
      birth_year: profile.birth_year ? String(profile.birth_year) : "",
      position: profile.position ?? "",
      skill: profile.skill ?? "amateur",
      bio: profile.bio ?? "",
    });
  }, [profile]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 60 }, (_, i) => now - 8 - i);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        city: form.city.trim(),
        phone: form.phone.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        birth_year: form.birth_year ? Number(form.birth_year) : null,
        position: (form.position || null) as never,
        skill: form.skill as never,
        bio: form.bio.trim() || null,
      })
      .eq("id", profile.id);
    setBusy(false);
    if (error) {
      toast.error("Не удалось сохранить: " + error.message);
      return;
    }
    toast.success("Профиль обновлён");
    await onSaved();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Редактировать карточку</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Имя и фамилия</Label>
            <Input
              id="full_name"
              maxLength={100}
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Город</Label>
            <Input
              id="city"
              list="cities"
              maxLength={80}
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <datalist id="cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar_url">Ссылка на фото</Label>
            <Input
              id="avatar_url"
              placeholder="https://…"
              value={form.avatar_url}
              onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Год рождения</Label>
            <Select
              value={form.birth_year}
              onValueChange={(v) => setForm((f) => ({ ...f, birth_year: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Не указан" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Позиция</Label>
            <Select
              value={form.position}
              onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Не указана" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POSITIONS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Уровень</Label>
            <Select value={form.skill} onValueChange={(v) => setForm((f) => ({ ...f, skill: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SKILLS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="bio">О себе</Label>
            <Textarea
              id="bio"
              rows={3}
              maxLength={500}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              Сохранить
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
