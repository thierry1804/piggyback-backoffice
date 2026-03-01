import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { GoalWithGroup } from '@/types/goal';
import type { GoalStatusFilter } from '@/types/goal';

const PAGE_SIZE = 10;

const GOALS_SELECT =
  'id, name, description, targetAmount, currentAmount, icon, color, currencyCode, currencySymbol, createdAt, deadline, group_id, closed_at';

export interface UseGoalsParams {
  statusFilter: GoalStatusFilter;
  groupIdFilter: string | null;
  searchQuery: string;
}

export function useGoals({
  statusFilter = 'all',
  groupIdFilter = null,
  searchQuery = '',
}: Partial<UseGoalsParams> = {}) {
  const [goals, setGoals] = useState<GoalWithGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('goals')
        .select(GOALS_SELECT, { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(from, to);

      if (statusFilter === 'active') {
        query = query.is('closed_at', null);
      } else if (statusFilter === 'closed') {
        query = query.not('closed_at', 'is', null);
      }

      if (groupIdFilter) {
        query = query.eq('group_id', groupIdFilter);
      }

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      const { data: goalsData, count, error: goalsErr } = await query;

      if (goalsErr) throw new Error(goalsErr.message);

      const list = (goalsData as GoalWithGroup[]) ?? [];
      const groupIds = [...new Set(list.map((g) => g.group_id).filter(Boolean))] as string[];

      let groupsMap = new Map<string, string>();
      if (groupIds.length > 0) {
        const { data: groupsData } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds);
        (groupsData ?? []).forEach((g: { id: string; name: string }) => {
          groupsMap.set(g.id, g.name);
        });
      }

      const withGroup: GoalWithGroup[] = list.map((g) => ({
        ...g,
        groupName: g.group_id ? groupsMap.get(g.group_id) ?? null : null,
      }));

      setGoals(withGroup);
      setTotalCount(count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, groupIdFilter, searchQuery]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, Math.ceil(totalCount / PAGE_SIZE) || 1)));
  }, [totalCount]);

  return {
    goals,
    totalCount,
    totalPages,
    page,
    pageSize: PAGE_SIZE,
    goToPage,
    isLoading,
    error,
    refetch: fetchGoals,
  };
}
