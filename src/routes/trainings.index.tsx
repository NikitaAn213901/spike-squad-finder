import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LEVELS, formatDateTime, plural, toLocalInputValue, type Level } from "@/lib/volley";
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

export const Route = createFileRoute("/trainings/")({
  head: () => ({
    meta: [
      { title: "Открытые тренировки по волейболу — ВолейСити" },
      {
        name: "description",
        content:
          "Расписание открытых волейбольных тренировок города: дата, место, уровень игры и свободные места.",
      },
      { property: "og:title", content: "Открытые тренировки по волейболу — ВолейСити" },
      {
        property: "og:description",
        content: "Найдите тренировку по уровню и подайте заявку организатору.",
      },
    ],
  }),
  component: TrainingsPage,
});

type SignupLite = { id: string; status: string; user_id: string };
type TrainingRow = {
  id: string;
  organizer_id: string;
  title: string;
  location: string;
  starts_at: string;
  duration_minutes: number;
  level: Level;
  slots_total: number;
  price: string | null;
  description: string | null;
  training_signups: SignupLite[];
};

const levelStyles: Record<Level, string> = {
  beginner: "bg-emerald-100 text-emerald-800",
  intermediate: "bg-amber-100 text-amber-900",
  advanced: "bg-rose-100 text-rose-800",
};

function TrainingsPage() {
  const { user, isOrganizer } = useAuth();
  const [levelFilter, setLevelFilter] = useState<"all" | Level>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["trainings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*, training_signups(id, status, user_id)")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as unknown as TrainingRow[];
    },
  });

  const trainings = useMemo(() => {
    const list = data ?? [];
    return levelFilter === "all" ? list : list.filter((t) => t.level === levelFilter);
  }, [data, levelFilter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Тренировки</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Открытые волейбольные тренировки города. Выберите подходящий уровень и подайте заявку —
            организатор подтвердит место.
          </p>
        </div>
        {isOrganizer && <CreateTrainingDialog />}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", ...Object.keys(LEVELS)] as const).map((key) => (
          <button
            key={key}
            onClick={() => setLevelFilter(key as "all" | Level)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              levelFilter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "all" ? "Все уровни" : LEVELS[key as Level]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Загружаем расписание…</p>
      ) : trainings.length === 0 ? (
        <Card className="mt-10">
          <CardContent className="py-12 text-center text-muted-foreground">
            Пока нет тренировок{levelFilter !== "all" ? " с этим уровнем" : ""}.
            {!user && " Войдите, чтобы участвовать."}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((t) => {
            const confirmed = t.training_signups.filter((s) => s.status === "confirmed").length;
            const pending = t.training_signups.filter((s) => s.status === "pending").length;
            const free = Math.max(t.slots_total - confirmed, 0);
            return (
              <Link key={t.id} to="/trainings/$trainingId" params={{ trainingId: t.id }}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-snug">{t.title}</CardTitle>
                      <Badge className={`shrink-0 border-0 ${levelStyles[t.level]}`}>
                        {LEVELS[t.level]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-accent" />
                      {formatDateTime(t.starts_at)} · {t.duration_minutes} мин
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 text-accent" />
                      {t.location}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users className="size-4 text-accent" />
                      {confirmed} из {t.slots_total} · осталось {free}{" "}
                      {plural(free, "место", "места", "мест")}
                    </span>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${Math.min(100, (confirmed / Math.max(t.slots_total, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    {pending > 0 && (
                      <span className="text-xs">
                        {pending} {plural(pending, "заявка", "заявки", "заявок")} в ожидании
                      </span>
                    )}
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

function CreateTrainingDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    starts_at: toLocalInputValue(),
    duration_minutes: 90,
    level: "beginner" as Level,
    slots_total: 12,
    price: "",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Нужен вход");
      const { error } = await supabase.from("trainings").insert({
        organizer_id: user.id,
        title: form.title.trim(),
        location: form.location.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        duration_minutes: Number(form.duration_minutes),
        level: form.level,
        slots_total: Number(form.slots_total),
        price: form.price.trim() || null,
        description: form.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Тренировка создана");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (e: Error) => toast.error("Не удалось создать: " + e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Создать тренировку
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая тренировка</DialogTitle>
          <DialogDescription>Укажите место, время, уровень и количество мест.</DialogDescription>
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
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              maxLength={120}
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Вечерняя игра в зале №2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Место</Label>
            <Input
              id="location"
              maxLength={160}
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="СК «Динамо», ул. Спортивная 5"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="starts">Дата и время</Label>
              <Input
                id="starts"
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Длительность, мин</Label>
              <Input
                id="duration"
                type="number"
                min={30}
                max={480}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Уровень игры</Label>
              <Select
                value={form.level}
                onValueChange={(v) => setForm({ ...form, level: v as Level })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slots">Нужно игроков</Label>
              <Input
                id="slots"
                type="number"
                min={2}
                max={60}
                value={form.slots_total}
                onChange={(e) => setForm({ ...form, slots_total: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Стоимость (необязательно)</Label>
            <Input
              id="price"
              maxLength={60}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="300 ₽ с человека"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Формат игры, что взять с собой…"
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
