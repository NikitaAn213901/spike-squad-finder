import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Check, MapPin, Ticket, Users, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LEVELS, SIGNUP_STATUS, formatDateTime, plural, type Level } from "@/lib/volley";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/trainings/$trainingId")({
  head: () => ({
    meta: [
      { title: "Тренировка по волейболу — ВолейСити" },
      {
        name: "description",
        content: "Детали тренировки: место, время, уровень, свободные места и заявки игроков.",
      },
      { property: "og:title", content: "Тренировка по волейболу — ВолейСити" },
      {
        property: "og:description",
        content: "Подайте заявку на участие — организатор подтвердит место.",
      },
    ],
  }),
  component: TrainingDetail,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center" role="alert">
      <h1 className="text-2xl font-bold">Не удалось загрузить тренировку</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Тренировка не найдена</h1>
    </div>
  ),
});

type Signup = {
  id: string;
  user_id: string;
  status: "pending" | "confirmed" | "rejected";
  comment: string | null;
  created_at: string;
};

type Training = {
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
};

function TrainingDetail() {
  const { trainingId } = Route.useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["training", trainingId],
    queryFn: async () => {
      const [{ data: training, error }, { data: signups, error: sErr }] = await Promise.all([
        supabase.from("trainings").select("*").eq("id", trainingId).maybeSingle(),
        supabase
          .from("training_signups")
          .select("id, user_id, status, comment, created_at")
          .eq("training_id", trainingId)
          .order("created_at", { ascending: true }),
      ]);
      if (error) throw error;
      if (sErr) throw sErr;

      const ids = (signups ?? []).map((s) => s.user_id);
      const profiles = ids.length
        ? ((await supabase.from("profiles").select("id, full_name, city, phone").in("id", ids))
            .data ?? [])
        : [];
      const nameById = new Map(profiles.map((p) => [p.id, p]));
      return {
        training: training as Training | null,
        signups: (signups ?? []) as Signup[],
        nameById,
      };
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "confirmed" | "rejected" }) => {
      const { error } = await supabase.from("training_signups").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["training", trainingId] });
      void queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Статус заявки обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Войдите, чтобы подать заявку");
      const { error } = await supabase.from("training_signups").insert({
        training_id: trainingId,
        user_id: user.id,
        status: "pending",
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success("Заявка отправлена организатору");
      void queryClient.invalidateQueries({ queryKey: ["training", trainingId] });
      void queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_signups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Заявка отозвана");
      void queryClient.invalidateQueries({ queryKey: ["training", trainingId] });
      void queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <p className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Загрузка…</p>;
  }
  if (!data?.training) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Тренировка не найдена</h1>
        <Button asChild className="mt-4">
          <Link to="/trainings">К списку тренировок</Link>
        </Button>
      </div>
    );
  }

  const t = data.training;
  const signups = data.signups;
  const confirmed = signups.filter((s) => s.status === "confirmed");
  const pending = signups.filter((s) => s.status === "pending");
  const rejected = signups.filter((s) => s.status === "rejected");
  const free = Math.max(t.slots_total - confirmed.length, 0);
  const isOwner = user?.id === t.organizer_id;
  const mySignup = signups.find((s) => s.user_id === user?.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/trainings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Все тренировки
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
        <Badge className="border-0 bg-accent text-accent-foreground">{LEVELS[t.level]}</Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <InfoTile icon={<CalendarDays className="size-4" />} label="Когда">
          {formatDateTime(t.starts_at)} · {t.duration_minutes} мин
        </InfoTile>
        <InfoTile icon={<MapPin className="size-4" />} label="Где">
          {t.location}
        </InfoTile>
        <InfoTile icon={<Users className="size-4" />} label="Места">
          {confirmed.length} / {t.slots_total} · свободно {free}
        </InfoTile>
      </div>

      {(t.description || t.price) && (
        <Card className="mt-6">
          <CardContent className="space-y-2 py-6 text-sm">
            {t.price && (
              <p className="flex items-center gap-2 font-medium">
                <Ticket className="size-4 text-accent" /> {t.price}
              </p>
            )}
            {t.description && <p className="whitespace-pre-line text-muted-foreground">{t.description}</p>}
          </CardContent>
        </Card>
      )}

      {!isOwner && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Участие</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!user ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Войдите, чтобы подать заявку на участие.
                </p>
                <Button asChild size="sm">
                  <Link to="/auth">Войти</Link>
                </Button>
              </div>
            ) : mySignup ? (
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className={
                    mySignup.status === "confirmed"
                      ? "border-0 bg-emerald-100 text-emerald-800"
                      : mySignup.status === "rejected"
                        ? "border-0 bg-rose-100 text-rose-800"
                        : "border-0 bg-amber-100 text-amber-900"
                  }
                >
                  {SIGNUP_STATUS[mySignup.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {mySignup.status === "confirmed"
                    ? "Место забронировано за вами"
                    : mySignup.status === "pending"
                      ? "Организатор рассмотрит заявку"
                      : "Организатор отклонил заявку"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancel.mutate(mySignup.id)}
                  disabled={cancel.isPending}
                >
                  Отозвать заявку
                </Button>
              </div>
            ) : free === 0 ? (
              <p className="text-sm text-muted-foreground">
                Свободных мест нет, но можно подать заявку в лист ожидания.
              </p>
            ) : null}

            {user && !mySignup && (
              <div className="space-y-3">
                <Textarea
                  maxLength={300}
                  placeholder="Комментарий организатору (необязательно)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
                  Подать заявку{profile?.full_name ? ` как ${profile.full_name}` : ""}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <section className="mt-8 space-y-6">
        <SignupList
          title={`Подтверждённые игроки (${confirmed.length})`}
          rows={confirmed}
          nameById={data.nameById}
          isOwner={isOwner}
          onReject={(id) => setStatus.mutate({ id, status: "rejected" })}
        />
        {(isOwner || pending.length > 0) && (
          <SignupList
            title={`Заявки в ожидании (${pending.length})`}
            rows={pending}
            nameById={data.nameById}
            isOwner={isOwner}
            onConfirm={(id) => setStatus.mutate({ id, status: "confirmed" })}
            onReject={(id) => setStatus.mutate({ id, status: "rejected" })}
            emptyText="Новых заявок нет"
          />
        )}
        {isOwner && rejected.length > 0 && (
          <SignupList
            title={`Отклонённые (${rejected.length})`}
            rows={rejected}
            nameById={data.nameById}
            isOwner={isOwner}
            onConfirm={(id) => setStatus.mutate({ id, status: "confirmed" })}
          />
        )}
      </section>

      {isOwner && free > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Осталось {free} {plural(free, "свободное место", "свободных места", "свободных мест")}.
        </p>
      )}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

type ProfileLite = { id: string; full_name: string; city: string; phone: string | null };

function SignupList({
  title,
  rows,
  nameById,
  isOwner,
  onConfirm,
  onReject,
  emptyText = "Пока пусто",
}: {
  title: string;
  rows: Signup[];
  nameById: Map<string, ProfileLite>;
  isOwner: boolean;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
  emptyText?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((s) => {
              const p = nameById.get(s.user_id);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{p?.full_name || "Игрок"}</div>
                    <div className="text-xs text-muted-foreground">
                      {[p?.city, s.comment].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      {onConfirm && (
                        <Button size="sm" onClick={() => onConfirm(s.id)}>
                          <Check className="size-4" /> Подтвердить
                        </Button>
                      )}
                      {onReject && (
                        <Button size="sm" variant="outline" onClick={() => onReject(s.id)}>
                          <X className="size-4" /> Отклонить
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
