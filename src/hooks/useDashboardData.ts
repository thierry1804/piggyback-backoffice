import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  DashboardKpis,
  GoalsByMonthItem,
  TransactionsByMonthItem,
} from '@/types/dashboard';

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

function getMonthKey(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTHS_FR[month - 1]} ${year}`;
}

function aggregateGoalsByMonth(
  items: { createdAt: string }[]
): GoalsByMonthItem[] {
  const byMonth = new Map<string, number>();
  for (const item of items) {
    const key = getMonthKey(item.createdAt);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, count]) => ({
      month: getMonthLabel(monthKey),
      monthKey,
      count,
    }));
}

function aggregateTransactionsByMonth(
  items: { amount: number; createdAt: string }[]
): TransactionsByMonthItem[] {
  const byMonth = new Map<string, number>();
  for (const item of items) {
    const key = getMonthKey(item.createdAt);
    byMonth.set(key, (byMonth.get(key) ?? 0) + (item.amount ?? 0));
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, volume]) => ({
      month: getMonthLabel(monthKey),
      monthKey,
      volume,
    }));
}

export function useDashboardData() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    totalUsers: 0,
    totalGroups: 0,
    activeGoals: 0,
    totalTransactionsAmount: 0,
    activeSubscriptions: 0,
  });
  const [goalsByMonth, setGoalsByMonth] = useState<GoalsByMonthItem[]>([]);
  const [transactionsByMonth, setTransactionsByMonth] = useState<
    TransactionsByMonthItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        usersRes,
        groupsRes,
        goalsCountRes,
        goalsAllRes,
        transactionsRes,
        abonnementsRes,
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('groups').select('id', { count: 'exact', head: true }),
        supabase
          .from('goals')
          .select('id', { count: 'exact', head: true })
          .is('closed_at', null),
        supabase.from('goals').select('createdAt'),
        supabase.from('transactions').select('amount, createdAt'),
        supabase
          .from('abonnements')
          .select('id', { count: 'exact', head: true })
          .or(
            `ends_at.is.null,ends_at.gt.${new Date().toISOString()}`
          ),
      ]);

      const usersError = usersRes.error;
      const groupsError = groupsRes.error;
      const goalsCountError = goalsCountRes.error;
      const goalsAllError = goalsAllRes.error;
      const transactionsError = transactionsRes.error;
      const abonnementsError = abonnementsRes.error;

      if (usersError) throw new Error(usersError.message);
      if (groupsError) throw new Error(groupsError.message);
      if (goalsCountError) throw new Error(goalsCountError.message);
      if (goalsAllError) throw new Error(goalsAllError.message);
      if (transactionsError) throw new Error(transactionsError.message);
      if (abonnementsError) throw new Error(abonnementsError.message);

      const totalTransactionsAmount = (transactionsRes.data ?? []).reduce(
        (sum, row) => sum + (Number((row as { amount?: number }).amount) || 0),
        0
      );

      setKpis({
        totalUsers: usersRes.count ?? 0,
        totalGroups: groupsRes.count ?? 0,
        activeGoals: goalsCountRes.count ?? 0,
        totalTransactionsAmount,
        activeSubscriptions: abonnementsRes.count ?? 0,
      });

      const goalsWithDate = (goalsAllRes.data ?? []).filter(
        (g): g is { createdAt: string } => !!(g as { createdAt?: string }).createdAt
      );
      setGoalsByMonth(aggregateGoalsByMonth(goalsWithDate));

      const transactionsWithDate = (transactionsRes.data ?? [])
        .filter((t) => (t as { createdAt?: string }).createdAt != null)
        .map((t) => ({
          createdAt: (t as { createdAt: string }).createdAt,
          amount: Number((t as { amount?: unknown }).amount) || 0,
        }));
      setTransactionsByMonth(aggregateTransactionsByMonth(transactionsWithDate));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    kpis,
    goalsByMonth,
    transactionsByMonth,
    isLoading,
    error,
    refetch: fetch,
  };
}
