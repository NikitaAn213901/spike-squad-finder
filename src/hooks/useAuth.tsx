import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "player" | "organizer";

export type Profile = {
  id: string;
  full_name: string;
  city: string;
  phone: string | null;
  avatar_url: string | null;
  birth_year: number | null;
  position: string | null;
  skill: string;
  bio: string | null;
  competitive_rating: number;
  mvp_count: number;
};


type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  isOrganizer: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  profile: null,
  role: null,
  isOrganizer: false,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      return;
    }
    const [{ data: profileData }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, city, phone").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileData as Profile) ?? null);
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);
    setRole(roles.includes("organizer") ? "organizer" : (roles[0] ?? "player"));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setTimeout(() => {
        void loadUserData(nextSession?.user?.id);
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadUserData(data.session?.user?.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role,
      isOrganizer: role === "organizer",
      loading,
      refreshProfile: () => loadUserData(session?.user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRole(null);
      },
    }),
    [session, profile, role, loading, loadUserData],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
