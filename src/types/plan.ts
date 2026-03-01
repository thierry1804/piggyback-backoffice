export interface Plan {
  id: string;
  name: string;
  max_goals: number | null;
  is_one_shot: boolean | null;
  price_amount: number | null;
  price_currency: string | null;
  price_amount_after_early: number | null;
  early_bird_cap: number | null;
}

export interface Abonnement {
  id: string;
  group_id: string;
  plan_id: string;
  started_at: string;
  ends_at: string | null;
  payment_ref: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AbonnementWithMeta extends Abonnement {
  groupName: string | null;
  planName: string | null;
}

export type SubscriptionStatusFilter = 'all' | 'active' | 'expired';
