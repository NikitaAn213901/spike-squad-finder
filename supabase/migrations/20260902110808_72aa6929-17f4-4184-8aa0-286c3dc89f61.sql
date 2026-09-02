
-- ENUMS
CREATE TYPE public.player_position AS ENUM ('setter','outside','opposite','middle','libero');
CREATE TYPE public.skill_level AS ENUM ('novice','amateur','intermediate','advanced','strong');
CREATE TYPE public.attendance_status AS ENUM ('pending','attended','no_show','cancelled','late');
CREATE TYPE public.team_member_role AS ENUM ('captain','player');
CREATE TYPE public.invite_status AS ENUM ('pending','accepted','declined');
CREATE TYPE public.match_status AS ENUM ('scheduled','confirmed');

-- PROFILES EXTENSION
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS birth_year integer,
  ADD COLUMN IF NOT EXISTS position public.player_position,
  ADD COLUMN IF NOT EXISTS skill public.skill_level NOT NULL DEFAULT 'amateur',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS competitive_rating integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS mvp_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- TRAININGS EXTENSION
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'Костанай',
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT '6x6',
  ADD COLUMN IF NOT EXISTS price_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_cancelled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS positions_needed jsonb NOT NULL DEFAULT '{}'::jsonb;

-- SIGNUPS EXTENSION
ALTER TABLE public.training_signups
  ADD COLUMN IF NOT EXISTS waitlisted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attendance public.attendance_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS organizer_score integer;

-- TEAMS
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  city text NOT NULL DEFAULT 'Костанай',
  level public.skill_level NOT NULL DEFAULT 'amateur',
  description text,
  rating integer NOT NULL DEFAULT 1000,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_public_read ON public.teams FOR SELECT USING (true);
CREATE POLICY teams_insert_own ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = captain_id);
CREATE POLICY teams_update_captain ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = captain_id) WITH CHECK (auth.uid() = captain_id);
CREATE POLICY teams_delete_captain ON public.teams FOR DELETE TO authenticated USING (auth.uid() = captain_id);

CREATE TABLE public.team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_member_role NOT NULL DEFAULT 'player',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT ON public.team_players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_players TO authenticated;
GRANT ALL ON public.team_players TO service_role;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_players_public_read ON public.team_players FOR SELECT USING (true);
CREATE POLICY team_players_captain_write ON public.team_players FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));
CREATE POLICY team_players_delete ON public.team_players FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));

CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.invite_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_read ON public.team_invites FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));
CREATE POLICY invites_insert_captain ON public.team_invites FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));
CREATE POLICY invites_update ON public.team_invites FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.captain_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));
CREATE POLICY invites_delete_captain ON public.team_invites FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));

-- MATCHES
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  home_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  home_score integer NOT NULL DEFAULT 0,
  away_score integer NOT NULL DEFAULT 0,
  played_at timestamptz NOT NULL DEFAULT now(),
  status public.match_status NOT NULL DEFAULT 'scheduled',
  mvp_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY matches_public_read ON public.matches FOR SELECT USING (true);
CREATE POLICY matches_insert_organizer ON public.matches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY matches_update_organizer ON public.matches FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY matches_delete_organizer ON public.matches FOR DELETE TO authenticated
  USING (auth.uid() = organizer_id);

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  code text PRIMARY KEY,
  title text NOT NULL,
  icon text NOT NULL,
  description text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO anon;
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY achievements_public_read ON public.achievements FOR SELECT USING (true);

INSERT INTO public.achievements (code, title, icon, description, sort_order) VALUES
  ('first_game','Первая игра','🏐','Сыграна первая игра',1),
  ('games_10','10 игр','🔥','Сыграно 10 игр',2),
  ('games_50','50 игр','💪','Сыграно 50 игр',3),
  ('first_tournament','Первый турнир','🏆','Участие в первом турнире',4),
  ('tournament_win','Первая победа в турнире','🥇','Победа в матче турнира',5),
  ('first_mvp','Первый MVP','⭐','Получен первый MVP',6),
  ('mvp_10','10 MVP','👑','Получено 10 MVP',7),
  ('attendance_90','90% посещаемости','🎯','Посещаемость 90% и выше (мин. 10 игр)',8);

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT ON public.user_achievements TO anon;
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_achievements_public_read ON public.user_achievements FOR SELECT USING (true);

-- PLAYER STATS VIEW
CREATE VIEW public.player_stats
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  COUNT(*) FILTER (WHERE s.attendance IN ('attended','late')) AS games_played,
  COUNT(*) FILTER (WHERE s.status = 'confirmed') AS games_booked,
  COUNT(*) FILTER (WHERE s.attendance = 'no_show') AS no_shows,
  CASE WHEN COUNT(*) FILTER (WHERE s.attendance IN ('attended','late','no_show')) = 0 THEN NULL
       ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE s.attendance IN ('attended','late'))
            / COUNT(*) FILTER (WHERE s.attendance IN ('attended','late','no_show')))
  END AS attendance_pct,
  ROUND(AVG(s.organizer_score)::numeric, 2) AS reputation
FROM public.profiles p
LEFT JOIN public.training_signups s ON s.user_id = p.id
GROUP BY p.id;
GRANT SELECT ON public.player_stats TO anon, authenticated, service_role;

-- ACHIEVEMENT RECALC
CREATE OR REPLACE FUNCTION public.recalc_achievements(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _played int; _att numeric; _mvp int; _tourn int; _wins int;
BEGIN
  SELECT COUNT(*) FILTER (WHERE attendance IN ('attended','late')) INTO _played
  FROM public.training_signups WHERE user_id = _user_id;

  SELECT CASE WHEN COUNT(*) FILTER (WHERE attendance IN ('attended','late','no_show')) = 0 THEN NULL
    ELSE 100.0 * COUNT(*) FILTER (WHERE attendance IN ('attended','late'))
         / COUNT(*) FILTER (WHERE attendance IN ('attended','late','no_show')) END
  INTO _att FROM public.training_signups WHERE user_id = _user_id;

  SELECT mvp_count INTO _mvp FROM public.profiles WHERE id = _user_id;

  SELECT COUNT(*) INTO _tourn FROM public.team_members tm WHERE tm.user_id = _user_id;

  SELECT COUNT(*) INTO _wins
  FROM public.matches m
  JOIN public.team_players tp ON tp.user_id = _user_id
  WHERE m.status = 'confirmed'
    AND ((m.home_team_id = tp.team_id AND m.home_score > m.away_score)
      OR (m.away_team_id = tp.team_id AND m.away_score > m.home_score));

  IF _played >= 1 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'first_game') ON CONFLICT DO NOTHING; END IF;
  IF _played >= 10 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'games_10') ON CONFLICT DO NOTHING; END IF;
  IF _played >= 50 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'games_50') ON CONFLICT DO NOTHING; END IF;
  IF _tourn >= 1 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'first_tournament') ON CONFLICT DO NOTHING; END IF;
  IF _wins >= 1 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'tournament_win') ON CONFLICT DO NOTHING; END IF;
  IF COALESCE(_mvp,0) >= 1 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'first_mvp') ON CONFLICT DO NOTHING; END IF;
  IF COALESCE(_mvp,0) >= 10 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'mvp_10') ON CONFLICT DO NOTHING; END IF;
  IF _played >= 10 AND COALESCE(_att,0) >= 90 THEN INSERT INTO public.user_achievements(user_id, code) VALUES (_user_id,'attendance_90') ON CONFLICT DO NOTHING; END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.recalc_achievements(uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_signup_achievements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalc_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_signup_achievements
AFTER INSERT OR UPDATE OF attendance ON public.training_signups
FOR EACH ROW EXECUTE FUNCTION public.tg_signup_achievements();

-- SIMPLIFIED ELO ON MATCH CONFIRMATION
CREATE OR REPLACE FUNCTION public.tg_match_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ra int; _rb int; _ea numeric; _delta int; _k int := 32; _sa numeric; _u record;
BEGIN
  IF NEW.status <> 'confirmed' OR (TG_OP = 'UPDATE' AND OLD.status = 'confirmed') THEN
    RETURN NEW;
  END IF;

  SELECT rating INTO _ra FROM public.teams WHERE id = NEW.home_team_id;
  SELECT rating INTO _rb FROM public.teams WHERE id = NEW.away_team_id;
  IF _ra IS NULL OR _rb IS NULL THEN RETURN NEW; END IF;

  _ea := 1.0 / (1.0 + power(10.0, (_rb - _ra)::numeric / 400.0));
  _sa := CASE WHEN NEW.home_score > NEW.away_score THEN 1
              WHEN NEW.home_score < NEW.away_score THEN 0 ELSE 0.5 END;
  _delta := ROUND(_k * (_sa - _ea));

  UPDATE public.teams SET rating = rating + _delta,
    matches_played = matches_played + 1,
    wins = wins + CASE WHEN _sa = 1 THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN _sa = 0 THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = NEW.home_team_id;

  UPDATE public.teams SET rating = rating - _delta,
    matches_played = matches_played + 1,
    wins = wins + CASE WHEN _sa = 0 THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN _sa = 1 THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = NEW.away_team_id;

  UPDATE public.profiles SET competitive_rating = competitive_rating + _delta
  WHERE id IN (SELECT user_id FROM public.team_players WHERE team_id = NEW.home_team_id);
  UPDATE public.profiles SET competitive_rating = competitive_rating - _delta
  WHERE id IN (SELECT user_id FROM public.team_players WHERE team_id = NEW.away_team_id);

  IF NEW.mvp_user_id IS NOT NULL THEN
    UPDATE public.profiles SET mvp_count = mvp_count + 1 WHERE id = NEW.mvp_user_id;
  END IF;

  FOR _u IN
    SELECT user_id FROM public.team_players WHERE team_id IN (NEW.home_team_id, NEW.away_team_id)
  LOOP
    PERFORM public.recalc_achievements(_u.user_id);
  END LOOP;

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_match_confirmed
AFTER INSERT OR UPDATE OF status ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.tg_match_confirmed();

-- captain auto-added as team player
CREATE OR REPLACE FUNCTION public.tg_team_captain()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_players(team_id, user_id, role)
  VALUES (NEW.id, NEW.captain_id, 'captain') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_team_captain AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.tg_team_captain();

-- protect stat columns from self-editing
CREATE OR REPLACE FUNCTION public.tg_profiles_protect()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.competitive_rating := OLD.competitive_rating;
  NEW.mvp_count := OLD.mvp_count;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_profiles_protect BEFORE UPDATE ON public.profiles
FOR EACH ROW WHEN (current_setting('role', true) <> 'service_role')
EXECUTE FUNCTION public.tg_profiles_protect();
