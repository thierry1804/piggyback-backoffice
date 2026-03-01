import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AbonnementWithMeta } from '@/types/plan';
import type { SubscriptionStatusFilter } from '@/types/plan';

const ABO_SELECT =
  'id, group_id, plan_id, started_at, ends_at, payment_ref, created_at, updated_at';

async function enrichAbonnements(
  rows: AbonnementWithMeta[]
): Promise<AbonnementWithMeta[]> {
  if (rows.length === 0) return [];
  const groupIds = [...new Set(rows.map((r) => r.group_id))];
  const planIds = [...new Set(rows.map((r) => r.plan_id))];

  const [groupsRes, plansRes] = await Promise.all([
    supabase.from('groups').select('id, name').in('id', groupIds),
    supabase.from('plans').select('id, name').in('id', planIds),
  ]);

  const groupsMap = new Map<string, string>();
  (groupsRes.data ?? []).forEach((g: { id: string; name: string }) => groupsMap.set(g.id, g.name));
  const plansMap = new Map<string, string>();
  (plansRes.data ?? []).forEach((p: { id: string; name: string }) => plansMap.set(p.id, p.name));

  return rows.map((r) => ({
    ...r,
    groupName: groupsMap.get(r.group_id) ?? null,
    planName: plansMap.get(r.plan_id) ?? null,
  }));
}

export function useSubscriptions(statusFilter: SubscriptionStatusFilter = 'all') {
  const [subscriptions, setSubscriptions] = useState<AbonnementWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setError(null);
    let query = supabase.from('abonnements').select(ABO_SELECT).order('started_at', { ascending: false });

    const now = new Date().toISOString();
    if (statusFilter === 'active') {
      query = query.or(`ends_at.is.null,ends_at.gt.${now}`);
    } else if (statusFilter === 'expired') {
      query = query.lt('ends_at', now);
    }

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
      setSubscriptions([]);
    } else {
      const enriched = await enrichAbonnements((data ?? []) as AbonnementWithMeta[]);
      setSubscriptions(enriched);
    }
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const updateAbonnement = useCallback(
    async (
      id: string,
      payload: { plan_id?: string; started_at?: string; ends_at?: string | null }
    ) => {
      const { error: err } = await supabase
        .from('abonnements')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (err) throw new Error(err.message);
      await fetchSubscriptions();
    },
    [fetchSubscriptions]
  );

  return {
    subscriptions,
    isLoading,
    error,
    refetch: fetchSubscriptions,
    updateAbonnement,
  };
}
