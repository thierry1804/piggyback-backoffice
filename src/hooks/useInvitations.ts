import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { GroupInvitationWithMeta } from '@/types/invitation';
import type { InvitationStatusFilter } from '@/types/invitation';

const INV_SELECT =
  'id, group_id, email, token, role, expires_at, created_at, created_by';

async function enrichInvitations(
  rows: GroupInvitationWithMeta[]
): Promise<GroupInvitationWithMeta[]> {
  if (rows.length === 0) return [];
  const groupIds = [...new Set(rows.map((r) => r.group_id))];
  const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];

  const [groupsRes, usersRes] = await Promise.all([
    supabase.from('groups').select('id, name').in('id', groupIds),
    userIds.length > 0
      ? supabase.from('users').select('id, name').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null }[], error: null }),
  ]);

  if (groupsRes.error) throw new Error(groupsRes.error.message);
  if (usersRes.error) throw new Error(usersRes.error.message);

  const groupsMap = new Map<string, string>();
  (groupsRes.data ?? []).forEach((g: { id: string; name: string }) => groupsMap.set(g.id, g.name));
  const usersMap = new Map<string, string>();
  (usersRes.data ?? []).forEach((u: { id: string; name: string | null }) =>
    usersMap.set(u.id, u.name ?? u.id)
  );

  return rows.map((r) => ({
    ...r,
    groupName: groupsMap.get(r.group_id) ?? null,
    createdByName: r.created_by ? usersMap.get(r.created_by) ?? null : null,
  }));
}

export function useInvitations(statusFilter: InvitationStatusFilter = 'all') {
  const [invitations, setInvitations] = useState<GroupInvitationWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setError(null);
    let query = supabase
      .from('group_invitations')
      .select(INV_SELECT)
      .order('created_at', { ascending: false });

    const now = new Date().toISOString();
    if (statusFilter === 'valid') {
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
    } else if (statusFilter === 'expired') {
      query = query.lt('expires_at', now);
    }

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
      setInvitations([]);
    } else {
      try {
        const enriched = await enrichInvitations((data ?? []) as GroupInvitationWithMeta[]);
        setInvitations(enriched);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
        setInvitations([]);
      }
    }
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchInvitations();
  }, [fetchInvitations]);

  const deleteInvitation = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('group_invitations').delete().eq('id', id);
    if (err) throw new Error(err.message);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const createInvitation = useCallback(
    async (payload: {
      group_id: string;
      email: string;
      role: string;
      expires_at: string | null;
      created_by: string | null;
    }) => {
      const { error: err } = await supabase.from('group_invitations').insert({
        group_id: payload.group_id,
        email: payload.email.trim() || null,
        role: payload.role,
        expires_at: payload.expires_at || null,
        created_by: payload.created_by,
      });
      if (err) throw new Error(err.message);
      await fetchInvitations();
    },
    [fetchInvitations]
  );

  return {
    invitations,
    isLoading,
    error,
    refetch: fetchInvitations,
    deleteInvitation,
    createInvitation,
  };
}
