
CREATE TYPE public.app_role AS ENUM ('player', 'organizer');
CREATE TYPE public.training_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.signup_status AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE public.registration_status AS ENUM ('open', 'closed', 'finished');
CREATE TYPE public.team_status AS ENUM ('pending', 'confirmed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read" ON public.user_roles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'city', '')
  )
  ON CONFLICT (id) DO NOTHING;

  _role := CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'organizer' THEN 'organizer'::public.app_role ELSE 'player'::public.app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 90,
  level public.training_level NOT NULL DEFAULT 'beginner',
  slots_total int NOT NULL DEFAULT 12,
  price text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT SELECT ON public.trainings TO anon;
GRANT ALL ON public.trainings TO service_role;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainings_public_read" ON public.trainings FOR SELECT USING (true);
CREATE POLICY "trainings_insert_organizer" ON public.trainings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "trainings_update_own" ON public.trainings FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "trainings_delete_own" ON public.trainings FOR DELETE TO authenticated
  USING (auth.uid() = organizer_id);

CREATE TABLE public.training_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.signup_status NOT NULL DEFAULT 'pending',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_signups TO authenticated;
GRANT SELECT ON public.training_signups TO anon;
GRANT ALL ON public.training_signups TO service_role;
ALTER TABLE public.training_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signups_public_read" ON public.training_signups FOR SELECT USING (true);
CREATE POLICY "signups_insert_own" ON public.training_signups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "signups_delete_own" ON public.training_signups FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND t.organizer_id = auth.uid()));
CREATE POLICY "signups_update_organizer" ON public.training_signups FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND t.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND t.organizer_id = auth.uid()));

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text NOT NULL,
  starts_at timestamptz NOT NULL,
  registration public.registration_status NOT NULL DEFAULT 'open',
  max_teams int,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT SELECT ON public.tournaments TO anon;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments_public_read" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_insert_organizer" ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "tournaments_update_own" ON public.tournaments FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "tournaments_delete_own" ON public.tournaments FOR DELETE TO authenticated
  USING (auth.uid() = organizer_id);

CREATE TABLE public.tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  captain_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status public.team_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_teams TO authenticated;
GRANT SELECT ON public.tournament_teams TO anon;
GRANT ALL ON public.tournament_teams TO service_role;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read" ON public.tournament_teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON public.tournament_teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "teams_update" ON public.tournament_teams FOR UPDATE TO authenticated
  USING (auth.uid() = captain_id OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid()))
  WITH CHECK (auth.uid() = captain_id OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid()));
CREATE POLICY "teams_delete" ON public.tournament_teams FOR DELETE TO authenticated
  USING (auth.uid() = captain_id OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid()));

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.tournament_teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT ON public.team_members TO anon;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_public_read" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "members_write" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tournament_teams tt JOIN public.tournaments t ON t.id = tt.tournament_id
    WHERE tt.id = team_id AND (tt.captain_id = auth.uid() OR t.organizer_id = auth.uid())
  ));
CREATE POLICY "members_delete" ON public.team_members FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tournament_teams tt JOIN public.tournaments t ON t.id = tt.tournament_id
    WHERE tt.id = team_id AND (tt.captain_id = auth.uid() OR t.organizer_id = auth.uid())
  ));

CREATE INDEX idx_trainings_starts_at ON public.trainings (starts_at);
CREATE INDEX idx_signups_training ON public.training_signups (training_id);
CREATE INDEX idx_teams_tournament ON public.tournament_teams (tournament_id);
CREATE INDEX idx_members_team ON public.team_members (team_id);
