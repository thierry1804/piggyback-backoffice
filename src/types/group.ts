export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
}

export interface Plan {
  id: string;
  name: string;
  max_goals: number | null;
  is_one_shot: boolean | null;
  price_amount: number | null;
  price_currency: string | null;
}

export interface Abonnement {
  id: string;
  group_id: string;
  plan_id: string;
  started_at: string;
  ends_at: string | null;
  created_at: string | null;
}

export interface Goal {
  id: number;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  group_id: string | null;
  closed_at: string | null;
  createdAt: string;
}

export interface GroupWithMeta extends Group {
  memberCount: number;
  activePlanName: string | null;
}

export interface UserGroup {
  user_id: string;
  group_id: string;
  role: string;
}

export interface MemberWithUser extends UserGroup {
  user: { id: string; name: string | null; email: string | null } | null;
}

export const GROUP_ROLES = ['admin', 'contributor', 'observer'] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];
