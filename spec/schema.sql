-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.abonnements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL UNIQUE,
  plan_id text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  payment_ref text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT abonnements_pkey PRIMARY KEY (id),
  CONSTRAINT abonnements_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT abonnements_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.goal_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  goal_id bigint,
  group_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT goal_events_pkey PRIMARY KEY (id),
  CONSTRAINT goal_events_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id),
  CONSTRAINT goal_events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT goal_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.goal_share_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  goal_id bigint NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'::text) UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_by uuid,
  CONSTRAINT goal_share_links_pkey PRIMARY KEY (id),
  CONSTRAINT goal_share_links_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id),
  CONSTRAINT goal_share_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.goals (
  id integer NOT NULL DEFAULT nextval('goals_id_seq'::regclass),
  name text NOT NULL,
  description text,
  targetAmount integer NOT NULL CHECK ("targetAmount" > 0),
  currentAmount integer NOT NULL DEFAULT 0 CHECK ("currentAmount" >= 0),
  icon text NOT NULL DEFAULT '🐷'::text,
  color text NOT NULL DEFAULT 'blue'::text,
  currencyCode text NOT NULL DEFAULT 'MGA'::text,
  currencySymbol text NOT NULL DEFAULT 'Ar'::text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  deadline timestamp with time zone,
  group_id uuid,
  closed_at timestamp with time zone,
  closed_by uuid,
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT goals_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.group_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  email text,
  token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'::text) UNIQUE,
  role text NOT NULL DEFAULT 'contributor'::text CHECK (role = ANY (ARRAY['admin'::text, 'contributor'::text, 'observer'::text])),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT group_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT group_invitations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_invitations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.plans (
  id text NOT NULL,
  name text NOT NULL,
  max_goals integer,
  is_one_shot boolean DEFAULT false,
  price_amount integer,
  price_currency text DEFAULT 'MGA'::text,
  created_at timestamp with time zone DEFAULT now(),
  price_amount_after_early integer,
  early_bird_cap integer,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.roles (
  id text NOT NULL,
  label text NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.settings (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  currencyCode text NOT NULL DEFAULT 'MGA'::text,
  currencySymbol text NOT NULL DEFAULT 'Ar'::text,
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id integer NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
  goalId integer NOT NULL,
  amount integer NOT NULL,
  note text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  source text DEFAULT 'manual'::text CHECK (source = ANY (ARRAY['manual'::text, 'correction'::text])),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_goalId_fkey FOREIGN KEY (goalId) REFERENCES public.goals(id),
  CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_groups (
  user_id uuid NOT NULL,
  group_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text CHECK (role = ANY (ARRAY['admin'::text, 'contributor'::text, 'observer'::text])),
  CONSTRAINT user_groups_pkey PRIMARY KEY (user_id, group_id),
  CONSTRAINT user_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text,
  username text,
  email text,
  phone text,
  website text,
  address jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  role_id text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);