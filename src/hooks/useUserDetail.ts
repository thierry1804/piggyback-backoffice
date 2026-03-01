import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Group, UserGroup, UserGroupWithGroup } from '@/types/user';

export function useUserDetail(userId: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [groupsWithRole, setGroupsWithRole] = useState<UserGroupWithGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      setUser(null);
      setGroupsWithRole([]);
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

      if (userGroups.length === 0) {
        setGroupsWithRole([]);
        return;
      }

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setUser(null);
      setGroupsWithRole([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { user, groupsWithRole, isLoading, error, refetch: fetch };
}
