CREATE OR REPLACE FUNCTION public.can_organize(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('organizer','admin'))
$$;
REVOKE ALL ON FUNCTION public.can_organize(uuid) FROM PUBLIC, anon, authenticated;

CREATE POLICY user_roles_admin_insert ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_delete ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, DELETE ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS trainings_insert_organizer ON public.trainings;
CREATE POLICY trainings_insert_organizer ON public.trainings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id AND (has_role(auth.uid(),'organizer') OR has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS tournaments_insert_organizer ON public.tournaments;
CREATE POLICY tournaments_insert_organizer ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id AND (has_role(auth.uid(),'organizer') OR has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS matches_insert_organizer ON public.matches;
CREATE POLICY matches_insert_organizer ON public.matches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id AND (has_role(auth.uid(),'organizer') OR has_role(auth.uid(),'admin')));