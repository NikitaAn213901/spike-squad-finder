import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { REGISTRATION_STATUS, formatDateTime, plural, toLocalInputValue } from "@/lib/volley";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/tournaments/")({
  head: () => ({
    meta: [
      { title: "Волейбольные турниры города — ВолейСити" },
      {
        name: "description",
        content:
          "Ближайшие турниры по волейболу: даты, площадки, статус регистрации и зарегистрированные команды.",
      },
      { property: "og:title", content: "Волейбольные турниры города — ВолейСити" },
      {
        property: "og:description",
        content: "Заявите команду на турнир и следите за составом участников.",
      },
    ],
  }),
  component: TournamentsPage,
});

type RegStatus = keyof typeof REGISTRATION_STATUS;

type TournamentRow = {
  id: string;
  organizer_id: string;
  title: string;
  location: string;
  starts_at: string;
  registration: RegStatus;
  max_teams: number | null;
  description: string | null;
  tournament_teams: { id: string; status: string }[];
};

const regStyles: Record<RegStatus, string> = {
  open: "bg-emerald-100 text-emerald-800",
  closed: "bg-amber-100 text-amber-900",
  finished: "bg-slate-200 text-slate-700",
};

function TournamentsPage() {
  const { isOrganizer } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*, tournament_teams(id, status)")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as unknown as TournamentRow[];
    },
  });

  const tournaments = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Турниры</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Ближайшие городские турниры по волейболу: статус регистрации, команды и составы.
          </p>
        </div>
        {isOrganizer && <CreateTournamentDialog />}
      </div>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Загружаем турниры…</p>
      ) : tournaments.length === 0 ? (
        <Card className="mt-10">
          <CardContent className="py-12 text-center text-muted-foreground">
            Пока нет анонсированных турниров.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tournaments.map((t) => {
            const confirmed = t.tournament_teams.filter((x) => x.status === "confirmed").length;
            return (
              <Link key={t.id} to="/tournaments/$tournamentId" params={{ tournamentId: t.id }}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl leading-snug">{t.title}</CardTitle>
                      <Badge className={`shrink-0 border-0 ${regStyles[t.registration]}`}>
                        {REGISTRATION_STATUS[t.registration]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-accent" />
                      {formatDateTime(t.starts_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 text-accent" />
                      {t.location}
                    </span>
                    <span className="flex items-center gap-2">
                      <Shield className="size-4 text-accent" />
                      {confirmed} {plural(confirmed, "команда", "команды", "команд")} подтверждено
                      {t.max_teams ? ` из ${t.max_teams}` : ""}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateTournamentDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    starts_at: toLocalInputValue(),
    registration: "open" as RegStatus,
    max_teams: 8,
    description: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Нужен вход");
      const { error } = await supabase.from("tournaments").insert({
        organizer_id: user.id,
        title: form.title.trim(),
        location: form.location.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        registration: form.registration,
        max_teams: Number(form.max_teams) || null,
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Турнир создан");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
    onError: (e: Error) => toast.error("Не удалось создать: " + e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Создать турнир
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый турнир</DialogTitle>
          <DialogDescription>Название, дата, место и статус регистрации.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.location.trim()) {
              toast.error("Заполните название и место");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="t-title">Название</Label>
            <Input
              id="t-title"
              maxLength={120}
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Кубок города 4×4"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-location">Место</Label>
            <Input
              id="t-location"
              maxLength={160}
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="t-date">Дата и время</Label>
              <Input
                id="t-date"
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-max">Максимум команд</Label>
              <Input
                id="t-max"
                type="number"
                min={2}
                max={64}
                value={form.max_teams}
                onChange={(e) => setForm({ ...form, max_teams: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Статус регистрации</Label>
            <Select
              value={form.registration}
              onValueChange={(v) => setForm({ ...form, registration: v as RegStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REGISTRATION_STATUS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-desc">Описание</Label>
            <Textarea
              id="t-desc"
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Формат, взнос, регламент…"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              Опубликовать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
