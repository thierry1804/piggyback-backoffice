import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { TransactionWithMeta } from '@/types/goal';

const PAGE_SIZE = 15;

const TX_SELECT = 'id, goalId, amount, note, createdAt, created_by, source';

export interface UseTransactionsParams {
  sourceFilter: string | null;
  goalIdFilter: string | null;
  noteSearch: string;
}

async function enrichTransactions(
  rows: { id: number; goalId: number; amount: number; note: string | null; createdAt: string; created_by: string | null; source: string | null }[]
): Promise<TransactionWithMeta[]> {
  if (rows.length === 0) return [];
  const goalIds = [...new Set(rows.map((r) => r.goalId))];
  const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];

  const [goalsRes, usersRes] = await Promise.all([
    goalIds.length > 0
      ? supabase.from('goals').select('id, name').in('id', goalIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from('users').select('id, name').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const goalsMap = new Map<number, string>();
  (goalsRes.data ?? []).forEach((g: { id: number; name: string }) => goalsMap.set(g.id, g.name));
  const usersMap = new Map<string, string>();
  (usersRes.data ?? []).forEach((u: { id: string; name: string | null }) =>
    usersMap.set(u.id, u.name ?? u.id)
  );

  return rows.map((r) => ({
    ...r,
    goalName: goalsMap.get(r.goalId) ?? null,
    createdByName: r.created_by ? usersMap.get(r.created_by) ?? null : null,
  }));
}

export function useTransactions({
  sourceFilter = null,
  goalIdFilter = null,
  noteSearch = '',
}: Partial<UseTransactionsParams> = {}) {
  const [transactions, setTransactions] = useState<TransactionWithMeta[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (from: number, to: number) => {
      let query = supabase
        .from('transactions')
        .select(TX_SELECT, { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(from, to);

      if (sourceFilter) query = query.eq('source', sourceFilter);
      if (goalIdFilter) query = query.eq('goalId', Number(goalIdFilter));
      if (noteSearch.trim()) query = query.ilike('note', `%${noteSearch.trim()}%`);

      const { data, count, error: err } = await query;
      if (err) throw new Error(err.message);
      return { data: (data ?? []) as TransactionWithMeta[], count: count ?? 0 };
    },
    [sourceFilter, goalIdFilter, noteSearch]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count } = await fetchPage(from, to);
      const enriched = await enrichTransactions(data);
      setTransactions(enriched);
      setTotalCount(count);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, fetchPage]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, Math.ceil(totalCount / PAGE_SIZE) || 1)));
  }, [totalCount]);

  /** Récupère toutes les transactions correspondant aux filtres actuels (pour export CSV). */
  const fetchAllFiltered = useCallback(async (): Promise<TransactionWithMeta[]> => {
    let query = supabase
      .from('transactions')
      .select(TX_SELECT)
      .order('createdAt', { ascending: false });

    if (sourceFilter) query = query.eq('source', sourceFilter);
    if (goalIdFilter) query = query.eq('goalId', Number(goalIdFilter));
    if (noteSearch.trim()) query = query.ilike('note', `%${noteSearch.trim()}%`);

    const { data, error: err } = await query;
    if (err) throw new Error(err.message);
    const rows = (data ?? []) as Parameters<typeof enrichTransactions>[0];
    return enrichTransactions(rows);
  }, [sourceFilter, goalIdFilter, noteSearch]);

  return {
    transactions,
    totalCount,
    totalPages,
    page,
    pageSize: PAGE_SIZE,
    goToPage,
    isLoading,
    error,
    refetch: load,
    fetchAllFiltered,
  };
}
