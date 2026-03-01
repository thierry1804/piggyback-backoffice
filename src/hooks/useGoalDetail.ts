import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Goal, Transaction, GoalEvent } from '@/types/goal';
import type { Group } from '@/types/group';

export function useGoalDetail(goalId: string | undefined) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<GoalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const id = goalId ? Number(goalId) : NaN;
    if (!goalId || Number.isNaN(id)) {
      setGoal(null);
      setGroup(null);
      setTransactions([]);
      setEvents([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: goalData, error: goalErr } = await supabase
        .from('goals')
        .select(
          'id, name, description, targetAmount, currentAmount, icon, color, currencyCode, currencySymbol, createdAt, deadline, group_id, closed_at, closed_by'
        )
        .eq('id', id)
        .single();

      if (goalErr) throw new Error(goalErr.message);
      setGoal(goalData as Goal);

      if ((goalData as Goal)?.group_id) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('id, name, description, created_at')
          .eq('id', (goalData as Goal).group_id)
          .single();
        setGroup((groupData as Group) ?? null);
      } else {
        setGroup(null);
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select('id, goalId, amount, note, createdAt, created_by, source')
        .eq('goalId', id)
        .order('createdAt', { ascending: false });

      setTransactions((txData as Transaction[]) ?? []);

      const { data: eventsData } = await supabase
        .from('goal_events')
        .select('id, goal_id, group_id, event_type, payload, user_id, created_at')
        .eq('goal_id', id)
        .order('created_at', { ascending: false });

      setEvents((eventsData as GoalEvent[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setGoal(null);
      setGroup(null);
      setTransactions([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { goal, group, transactions, events, isLoading, error, refetch: fetch };
}
