export interface DashboardKpis {
  totalUsers: number;
  totalGroups: number;
  activeGoals: number;
  totalTransactionsAmount: number;
  activeSubscriptions: number;
}

export interface GoalsByMonthItem {
  month: string;
  monthKey: string;
  count: number;
}

export interface TransactionsByMonthItem {
  month: string;
  monthKey: string;
  volume: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  goalsByMonth: GoalsByMonthItem[];
  transactionsByMonth: TransactionsByMonthItem[];
}
