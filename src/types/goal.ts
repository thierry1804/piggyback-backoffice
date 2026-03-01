export interface Goal {
  id: number;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  currencyCode: string;
  currencySymbol: string;
  createdAt: string;
  deadline: string | null;
  group_id: string | null;
  closed_at: string | null;
  closed_by: string | null;
}

export interface GoalWithGroup extends Goal {
  groupName: string | null;
}

export interface Transaction {
  id: number;
  goalId: number;
  amount: number;
  note: string | null;
  createdAt: string;
  created_by: string | null;
  source: string | null;
}

export interface TransactionWithMeta extends Transaction {
  goalName: string | null;
  createdByName: string | null;
}

export interface GoalEvent {
  id: string;
  goal_id: number | null;
  group_id: string;
  event_type: string;
  payload: unknown;
  user_id: string | null;
  created_at: string;
}

export type GoalStatusFilter = 'all' | 'active' | 'closed';
