import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Group, UserGroup, UserGroupWithGroup } from '@/types/user';
import type { AbonnementWithMeta } from '@/types/plan';

export interface UserDetailSubscription extends AbonnementWithMeta {
  groupName: string | null;
}

export function useUserDetail(userId: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [groupsWithRole, setGroupsWithRole] = useState<UserGroupWithGroup[]>([]);
  const [subscriptionsForUser, setSubscriptionsForUser] = useState<UserDetailSubscription[]>([]);
  const [goalsCount, setGoalsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      setUser(null);
      setGroupsWithRole([]);
      setSubscriptionsForUser([]);
      setGoalsCount(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userErr) throw new Error(userErr.message);
      setUser(userData as User);

      const { data: ugData, error: ugErr } = await supabase
        .from('user_groups')
        .select('user_id, group_id, role')
        .eq('user_id', userId);

      if (ugErr) throw new Error(ugErr.message);
      const userGroups = (ugData as UserGroup[]) ?? [];
      const groupIds = [...new Set(userGroups.map((ug) => ug.group_id))];

      const { data: groupsData, error: groupsErr } = await supabase
        .from('groups')
        .select('id, name, description, created_at')
        .in('id', groupIds);

      if (groupsErr) throw new Error(groupsErr.message);
      const groupsMap = new Map<string, Group>(
        ((groupsData as Group[]) ?? []).map((g) => [g.id, g])
      );

      const withGroup: UserGroupWithGroup[] = userGroups.map((ug) => ({
        ...ug,
        group: groupsMap.get(ug.group_id) ?? null,
      }));
      setGroupsWithRole(withGroup);

      if (groupIds.length === 0) {
        setSubscriptionsForUser([]);
        setGoalsCount(0);
      } else {
        const now = new Date().toISOString();
        const { data: aboData, error: aboErr } = await supabase
          .from('abonnements')
          .select('id, group_id, plan_id, started_at, ends_at, payment_ref, created_at, updated_at')
          .in('group_id', groupIds)
          .or(`ends_at.is.null,ends_at.gt.${now}`);

        if (aboErr) throw new Error(aboErr.message);
        const abonnements = (aboData ?? []) as UserDetailSubscription[];
        const planIds = [...new Set(abonnements.map((a) => a.plan_id))];
        const plansRes = await supabase.from('plans').select('id, name').in('id', planIds);
        const plansMap = new Map<string, string>();
        (plansRes.data ?? []).forEach((p: { id: string; name: string }) => plansMap.set(p.id, p.name));
        const subsWithMeta: UserDetailSubscription[] = abonnements.map((a) => ({
          ...a,
          groupName: groupsMap.get(a.group_id)?.name ?? null,
          planName: plansMap.get(a.plan_id) ?? null,
        }));
        setSubscriptionsForUser(subsWithMeta);

        const { count, error: goalsErr } = await supabase
          .from('goals')
          .select('id', { count: 'exact', head: true })
          .in('group_id', groupIds);

        if (goalsErr) throw new Error(goalsErr.message);
        setGoalsCount(count ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setUser(null);
      setGroupsWithRole([]);
      setSubscriptionsForUser([]);
      setGoalsCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateUser = useCallback(
    async (payload: Partial<Pick<User, 'name' | 'username' | 'email' | 'phone' | 'website' | 'role_id'>>) => {
      if (!userId) return;
      const { error: err } = await supabase.from('users').update(payload).eq('id', userId);
      if (err) throw new Error(err.message);
      setUser((prev) => (prev ? { ...prev, ...payload } : null));
    },
    [userId]
  );

  const addUserToGroup = useCallback(
    async (groupId: string, role: string) => {
      if (!userId) return;
      const { error: err } = await supabase.from('user_groups').insert({ user_id: userId, group_id: groupId, role });
      if (err) throw new Error(err.message);
      await fetch();
    },
    [userId, fetch]
  );

  const removeUserFromGroup = useCallback(
    async (groupId: string) => {
      if (!userId) return;
      const { error: err } = await supabase
        .from('user_groups')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId);
      if (err) throw new Error(err.message);
      await fetch();
    },
    [userId, fetch]
  );

  const updateUserGroupRole = useCallback(
    async (groupId: string, role: string) => {
      if (!userId) return;
      const { error: err } = await supabase
        .from('user_groups')
        .update({ role })
        .eq('user_id', userId)
        .eq('group_id', groupId);
      if (err) throw new Error(err.message);
      setGroupsWithRole((prev) =>
        prev.map((ug) => (ug.group_id === groupId ? { ...ug, role } : ug))
      );
    },
    [userId]
  );

  const deleteUser = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });
    if (error) throw new Error(error.message || 'Erreur lors de l\'appel à la fonction.');
    const err = data?.error as string | undefined;
    if (err) throw new Error(err);
  }, [userId]);

  return {
    user,
    groupsWithRole,
    subscriptionsForUser,
    goalsCount,
    isLoading,
    error,
    refetch: fetch,
    updateUser,
    addUserToGroup,
    removeUserFromGroup,
    updateUserGroupRole,
    deleteUser,
  };
}
