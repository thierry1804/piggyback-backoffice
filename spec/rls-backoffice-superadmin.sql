-- RLS : seul l'utilisateur avec role_id = 'superadmin' dans public.users peut tout lire.
-- À exécuter dans le SQL Editor Supabase (Dashboard → SQL Editor).
-- Adapter le rôle si vous utilisez un autre identifiant (ex. 'admin').

-- Fonction helper : vrai si l'utilisateur connecté est superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role_id = 'superadmin'
  );
$$;

-- Activer RLS sur les tables concernées (si pas déjà fait)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques backoffice si vous les aviez créées
DROP POLICY IF EXISTS "backoffice_superadmin_select_users" ON public.users;
DROP POLICY IF EXISTS "backoffice_superadmin_select_roles" ON public.roles;
DROP POLICY IF EXISTS "backoffice_superadmin_select_groups" ON public.groups;
DROP POLICY IF EXISTS "backoffice_superadmin_select_user_groups" ON public.user_groups;
DROP POLICY IF EXISTS "backoffice_superadmin_select_goals" ON public.goals;
DROP POLICY IF EXISTS "backoffice_superadmin_select_transactions" ON public.transactions;
DROP POLICY IF EXISTS "backoffice_superadmin_select_abonnements" ON public.abonnements;
DROP POLICY IF EXISTS "backoffice_superadmin_select_plans" ON public.plans;
DROP POLICY IF EXISTS "backoffice_superadmin_select_goal_events" ON public.goal_events;
DROP POLICY IF EXISTS "backoffice_superadmin_select_group_invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "backoffice_superadmin_insert_group_invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "backoffice_superadmin_delete_group_invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "backoffice_superadmin_update_plans" ON public.plans;
DROP POLICY IF EXISTS "backoffice_superadmin_update_abonnements" ON public.abonnements;

-- public.users : le superadmin peut tout lire
CREATE POLICY "backoffice_superadmin_select_users"
ON public.users FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- public.roles : le superadmin peut tout lire
CREATE POLICY "backoffice_superadmin_select_roles"
ON public.roles FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- public.groups
CREATE POLICY "backoffice_superadmin_select_groups"
ON public.groups FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- public.user_groups
DROP POLICY IF EXISTS "backoffice_superadmin_update_user_groups" ON public.user_groups;
CREATE POLICY "backoffice_superadmin_select_user_groups"
ON public.user_groups FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "backoffice_superadmin_update_user_groups"
ON public.user_groups FOR UPDATE
TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- public.goals
CREATE POLICY "backoffice_superadmin_select_goals"
ON public.goals FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- public.transactions
CREATE POLICY "backoffice_superadmin_select_transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- public.plans (lecture + mise à jour)
CREATE POLICY "backoffice_superadmin_select_plans"
ON public.plans FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "backoffice_superadmin_update_plans"
ON public.plans FOR UPDATE
TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- public.abonnements (lecture + mise à jour)
CREATE POLICY "backoffice_superadmin_select_abonnements"
ON public.abonnements FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "backoffice_superadmin_update_abonnements"
ON public.abonnements FOR UPDATE
TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- public.goal_events
CREATE POLICY "backoffice_superadmin_select_goal_events"
ON public.goal_events FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- public.group_invitations (lecture, création, suppression)
CREATE POLICY "backoffice_superadmin_select_group_invitations"
ON public.group_invitations FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "backoffice_superadmin_insert_group_invitations"
ON public.group_invitations FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin());

CREATE POLICY "backoffice_superadmin_delete_group_invitations"
ON public.group_invitations FOR DELETE
TO authenticated
USING (public.is_superadmin());
