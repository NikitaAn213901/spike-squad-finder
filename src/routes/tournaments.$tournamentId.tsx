import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Check, MapPin, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { REGISTRATION_STATUS, formatDateTime } from "@/lib/volley";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/tournaments/$tournamentId")({
  head: () => ({
    meta: [
      { title: "Турнир по волейболу — ВолейСити" },
      {
        name: "description",
        content: "Информация о турнире, зарегистрированные команды и составы участников.",
      },
      { property: "og:title", content: "Турнир по волейболу — ВолейСити" },
      {
        property: "og:description",
        content: "Заявите команду и добавьте игроков в состав.",
      },
    ],
  }),
  component: TournamentDetail,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center" role="alert">
      <h1 className="text-2xl font-bold">Не удалось загрузить турнир</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Турнир не найден</h1>
    </div>
  ),
});

type RegStatus = keyof typeof REGISTRATION_STATUS;
type Member = { id: string; full_name: string; team_id: string };
type Team = {
  id: string;
  tournament_id: string;
  captain_id: string;
  name: string;
  status: "pending" | "confirmed";
  team_members: Member[];
};
type Tournament = {
  id: string;
  organizer_id: string;
  title: string;
  location: string;
  starts_at: string;
  registration: RegStatus;
  max_teams: number | null;
  description: string | null;
};

function TournamentDetail() {
  const { tournamentId } = Route.useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: async () => {
      const [{ data: tournament, error }, { data: teams, error: tErr }] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", tournamentId).maybeSingle(),
        supabase
          .from("tournament_teams")
          .select("*, team_members(id, full_name, team_id)")
          .eq("tournament_id", tournamentId)
          .order("created_at", { ascending: true }),
      ]);
      if (error) throw error;
      if (tErr) throw tErr;
      return {
        tournament: tournament as Tournament | null,
        teams: (teams ?? []) as unknown as Team[],
      };
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    void queryClient.invalidateQueries({ queryKey: ["tournaments"] });
  };

  const setTeamStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "confirmed" | "pending" }) => {
      const { error } = await supabase.from("tournament_teams").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Статус команды обновлён");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournament_teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Команда удалена");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMember = useMutation({
    mutationFn: async ({ teamId, fullName }: { teamId: string; fullName: string }) => {
      const { error } = await supabase
        .from("team_members")
        .insert({ team_id: teamId, full_name: fullName });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Игрок добавлен в состав");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const setRegistration = useMutation({
    mutationFn: async (registration: RegStatus) => {
      const { error } = await supabase
        .from("tournaments")
        .update({ registration })
        .eq("id", tournamentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Статус регистрации обновлён");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <p className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Загрузка…</p>;
  }
  if (!data?.tournament) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Турнир не найден</h1>
        <Button asChild className="mt-4">
          <Link to="/tournaments">К списку турниров</Link>
        </Button>
      </div>
    );
  }

  const t = data.tournament;
  const teams = data.teams;
  const isOwner = user?.id === t.organizer_id;
  const myTeam = teams.find((x) => x.captain_id === user?.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Все турниры
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
        <Badge className="border-0 bg-accent text-accent-foreground">
          {REGISTRATION_STATUS[t.registration]}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <CalendarDays className="size-4 text-accent" /> Когда
          </div>
          <div className="mt-1 text-sm font-medium">{formatDateTime(t.starts_at)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <MapPin className="size-4 text-accent" /> Где
          </div>
          <div className="mt-1 text-sm font-medium">{t.location}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Shield className="size-4 text-accent" /> Команды
          </div>
          <div className="mt-1 text-sm font-medium">
            {teams.filter((x) => x.status === "confirmed").length}
            {t.max_teams ? ` / ${t.max_teams}` : ""} подтверждено
          </div>
        </div>
      </div>

      {t.description && (
        <Card className="mt-6">
          <CardContent className="py-6 text-sm whitespace-pre-line text-muted-foreground">
            {t.description}
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Управление турниром</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Label className="text-sm">Регистрация:</Label>
            <Select
              value={t.registration}
              onValueChange={(v) => setRegistration.mutate(v as RegStatus)}
            >
              <SelectTrigger className="w-56">
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
            <AddTeamDialog
              tournamentId={tournamentId}
              onDone={invalidate}
              label="Добавить команду"
            />
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Команды</h2>
        {!isOwner && user && !myTeam && t.registration === "open" && (
          <AddTeamDialog tournamentId={tournamentId} onDone={invalidate} label="Заявить команду" />
        )}
        {!user && (
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Войти, чтобы заявить команду</Link>
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-4">
        {teams.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Пока нет заявленных команд.
            </CardContent>
          </Card>
        )}
        {teams.map((team) => {
          const canManage = isOwner || team.captain_id === user?.id;
          return (
            <Card key={team.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        team.status === "confirmed"
                          ? "border-0 bg-emerald-100 text-emerald-800"
                          : "border-0 bg-amber-100 text-amber-900"
                      }
                    >
                      {team.status === "confirmed" ? "Подтверждена" : "На рассмотрении"}
                    </Badge>
                    {isOwner && team.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => setTeamStatus.mutate({ id: team.id, status: "confirmed" })}
                      >
                        <Check className="size-4" /> Подтвердить
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTeam.mutate(team.id)}
                        aria-label="Удалить команду"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {team.team_members.length === 0 && (
                    <li className="py-2 text-sm text-muted-foreground">Состав пока не заполнен</li>
                  )}
                  {team.team_members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{m.full_name}</span>
                      {canManage && (
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeMember.mutate(m.id)}
                          aria-label="Удалить игрока"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {canManage && (
                  <AddMemberForm
                    defaultName={team.captain_id === user?.id ? (profile?.full_name ?? "") : ""}
                    onAdd={(fullName) => addMember.mutate({ teamId: team.id, fullName })}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AddMemberForm({
  onAdd,
  defaultName,
}: {
  onAdd: (fullName: string) => void;
  defaultName?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const name = (value || defaultName || "").trim();
        if (name.length < 2) {
          toast.error("Укажите имя игрока");
          return;
        }
        onAdd(name);
        setValue("");
      }}
    >
      <Input
        placeholder="Имя игрока"
        maxLength={100}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" variant="outline">
        <Plus className="size-4" /> Добавить
      </Button>
    </form>
  );
}

function AddTeamDialog({
  tournamentId,
  onDone,
  label,
}: {
  tournamentId: string;
  onDone: () => void;
  label: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Нужен вход");
      const { error } = await supabase.from("tournament_teams").insert({
        tournament_id: tournamentId,
        captain_id: user.id,
        name: name.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Команда заявлена");
      setName("");
      setOpen(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заявка команды</DialogTitle>
          <DialogDescription>
            После создания добавьте игроков в состав. Организатор подтвердит участие.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length < 2) {
              toast.error("Укажите название команды");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="team-name">Название команды</Label>
            <Input
              id="team-name"
              maxLength={80}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              Заявить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
