import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Volleyball } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход и регистрация — ВолейСити" },
      {
        name: "description",
        content:
          "Войдите или зарегистрируйтесь как игрок или организатор, чтобы записываться на тренировки и создавать турниры.",
      },
      { property: "og:title", content: "Вход и регистрация — ВолейСити" },
      {
        property: "og:description",
        content: "Аккаунт игрока или организатора городского волейбольного сообщества.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"player" | "organizer">("player");

  if (!loading && user) {
    void navigate({ to: "/trainings", replace: true });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Неверная почта или пароль"
          : "Не удалось войти: " + error.message,
      );
      return;
    }
    toast.success("С возвращением!");
    router.invalidate();
    void navigate({ to: "/trainings" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Укажите имя");
      return;
    }
    if (password.length < 6) {
      toast.error("Пароль должен быть не короче 6 символов");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim(), city: city.trim(), role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Не удалось зарегистрироваться: " + error.message);
      return;
    }
    if (!data.session) {
      toast.success("Проверьте почту — мы отправили ссылку для подтверждения аккаунта");
      return;
    }
    toast.success("Аккаунт создан!");
    void navigate({ to: "/trainings" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Volleyball className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">Добро пожаловать в ВолейСити</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Играйте, организуйте и находите команду в своём городе
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Аккаунт</CardTitle>
          <CardDescription>Вход по почте и паролю</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="mb-4 w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                setBusy(false);
                toast.error("Не удалось войти через Google");
                return;
              }
              if (result.redirected) return;
              void navigate({ to: "/trainings" });
            }}
          >
            Продолжить с Google
          </Button>
          <Tabs defaultValue="login">

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="mt-4 flex flex-col gap-4" onSubmit={handleLogin}>
                <div className="grid gap-2">
                  <Label htmlFor="login-email">Электронная почта</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    maxLength={255}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  Войти
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="mt-4 flex flex-col gap-4" onSubmit={handleSignup}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Имя и фамилия</Label>
                  <Input
                    id="name"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    maxLength={80}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Электронная почта</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Роль</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(v) => setRole(v as "player" | "organizer")}
                    className="grid gap-2"
                  >
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm hover:bg-secondary/60">
                      <RadioGroupItem value="player" className="mt-0.5" />
                      <span>
                        <span className="font-semibold">Игрок</span>
                        <span className="block text-muted-foreground">
                          Записывается на тренировки и играет в командах
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm hover:bg-secondary/60">
                      <RadioGroupItem value="organizer" className="mt-0.5" />
                      <span>
                        <span className="font-semibold">Организатор</span>
                        <span className="block text-muted-foreground">
                          Создаёт тренировки и турниры, подтверждает заявки
                        </span>
                      </span>
                    </label>
                  </RadioGroup>
                </div>
                <Button type="submit" disabled={busy}>
                  Создать аккаунт
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
