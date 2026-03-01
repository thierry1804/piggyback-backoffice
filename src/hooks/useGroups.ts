import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { GroupWithMeta } from '@/types/group';

const PAGE_SIZE = 10;

export function useGroups(initialSearch = '') {
  const [groups, setGroups] = useState<GroupWithMeta[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('groups')
        .select('id, name, description, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data: groupsData, count, error: groupsErr } = await query;

      if (groupsErr) throw new Error(groupsErr.message);

      const list = (groupsData as GroupWithMeta[]) ?? [];
      const groupIds = list.map((g) => g.id);

      if (groupIds.length === 0) {
        setGroups([]);
        setTotalCount(count ?? 0);
        return;
      }

      const [ugRes, aboRes] = await Promise.all([
        supabase.from('user_groups').select('group_id').in('group_id', groupIds),
        supabase
          .from('abonnements')
          .select('group_id, plan_id')
          .in('group_id', groupIds)
          .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`),
      ]);

      const memberCountByGroup = new Map<string, number>();
      (ugRes.data ?? []).forEach((row: { group_id: string }) => {
        memberCountByGroup.set(
          row.group_id,
          (memberCountByGroup.get(row.group_id) ?? 0) + 1
        );
      });

      const planIds = [...new Set((aboRes.data ?? []).map((a: { plan_id: string }) => a.plan_id))];
      const activePlanByGroup = new Map<string, string>();
      (aboRes.data ?? []).forEach((a: { group_id: string; plan_id: string }) => {
        activePlanByGroup.set(a.group_id, a.plan_id);
      });

      let plansMap = new Map<string, string>();
      if (planIds.length > 0) {
        const { data: plansData } = await supabase
          .from('plans')
          .select('id, name')
          .in('id', planIds);
        (plansData ?? []).forEach((p: { id: string; name: string }) => {
          plansMap.set(p.id, p.name);
        });
      }

      const withMeta: GroupWithMeta[] = list.map((g) => ({
        ...g,
        memberCount: memberCountByGroup.get(g.id) ?? 0,
        activePlanName: (() => {
          const planId = activePlanByGroup.get(g.id);
          return planId ? plansMap.get(planId) ?? planId : null;
        })(),
      }));

      setGroups(withMeta);
      setTotalCount(count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, Math.ceil(totalCount / PAGE_SIZE) || 1)));
  }, [totalCount]);

  const createGroup = useCallback(
    async (payload: { name: string; description?: string | null }) => {
      const { data, error: err } = await supabase
        .from('groups')
        .insert({
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
        })
        .select('id')
        .single();
      if (err) throw new Error(err.message);
      await fetchGroups();
      return data?.id as string;
    },
    [fetchGroups]
  );

  return {
    groups,
    totalCount,
    totalPages,
    page,
    pageSize: PAGE_SIZE,
    goToPage,
    isLoading,
    error,
    refetch: fetchGroups,
    search,
    setSearch,
    createGroup,
  };
}
