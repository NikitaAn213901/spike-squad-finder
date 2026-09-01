import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Trophy, Users, Volleyball } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { LEVELS, formatDateTime, type Level } from "@/lib/volley";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ВолейСити — тренировки и турниры по волейболу в городе" },
      {
        name: "description",
        content:
          "Городское волейбольное сообщество: открытые тренировки со свободными местами и турниры с командами. Записывайтесь и организуйте игры.",
      },
      { property: "og:title", content: "ВолейСити — волейбол в твоём городе" },
      {
        property: "og:description",
        content: "Открытые тренировки, заявки на участие и городские турниры в одном месте.",
      },
    ],
  }),
  component: Index,
});

type TrainingPreview = {
  id: string;
  title: string;
  location: string;
  starts_at: string;
  level: Level;
  slots_total: number;
  training_signups: { status: string }[];
};

type TournamentPreview = {
  id: string;
  title: string;
  location: string;
  starts_at: string;
};

function Index() {
  const { data } = useQuery({
    queryKey: ["home-preview"],
    queryFn: async () => {
      const [{ data: trainings }, { data: tournaments }] = await Promise.all([
        supabase
          .from("trainings")
          .select("id, title, location, starts_at, level, slots_total, training_signups(status)")
          .order("starts_at", { ascending: true })
          .limit(3),
        supabase
          .from("tournaments")
          .select("id, title, location, starts_at")
          .order("starts_at", { ascending: true })
          .limit(3),
      ]);
      return {
        trainings: (trainings ?? []) as unknown as TrainingPreview[],
        tournaments: (tournaments ?? []) as unknown as TournamentPreview[],
      };
    },
  });

  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium">
            <Volleyball className="size-4 text-accent" /> Городское волейбольное сообщество
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Найди игру, собери команду, выйди на площадку
          </h1>
          <p className="mt-5 max-w-xl text-primary-foreground/80">
            Открытые тренировки с реальным количеством свободных мест и городские турниры с
            составами команд. Игроки подают заявки — организаторы подтверждают.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/trainings">Смотреть тренировки</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/tournaments">Турниры города</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={<Users className="size-5" />} title="Свободные места видно сразу">
            Счётчик мест обновляется, как только организатор подтверждает игрока.
          </Feature>
          <Feature icon={<CalendarDays className="size-5" />} title="Уровень под себя">
            Новичок, средний или продвинутый — фильтр покажет подходящие тренировки.
          </Feature>
          <Feature icon={<Trophy className="size-5" />} title="Турниры и команды">
            Заявляйте команду, добавляйте состав и следите за подтверждением.
          </Feature>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Ближайшие тренировки</h2>
          <Link to="/trainings" className="text-sm font-medium text-accent hover:underline">
            Все тренировки
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {(data?.trainings ?? []).map((t) => {
            const confirmed = t.training_signups.filter((s) => s.status === "confirmed").length;
            return (
              <Link key={t.id} to="/trainings/$trainingId" params={{ trainingId: t.id }}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{t.title}</CardTitle>
                      <Badge variant="secondary">{LEVELS[t.level]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-accent" /> {formatDateTime(t.starts_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-accent" /> {t.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-accent" /> свободно{" "}
                      {Math.max(t.slots_total - confirmed, 0)} из {t.slots_total}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {(data?.trainings ?? []).length === 0 && (
            <Card className="sm:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                Тренировок пока нет — организаторы могут добавить первую.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-12 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Ближайшие турниры</h2>
          <Link to="/tournaments" className="text-sm font-medium text-accent hover:underline">
            Все турниры
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {(data?.tournaments ?? []).map((t) => (
            <Link key={t.id} to="/tournaments/$tournamentId" params={{ tournamentId: t.id }}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-accent" /> {formatDateTime(t.starts_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-accent" /> {t.location}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {(data?.tournaments ?? []).length === 0 && (
            <Card className="sm:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                Турниров пока нет.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
