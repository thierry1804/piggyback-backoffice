import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Group,
  Plan,
  Abonnement,
  Goal,
  MemberWithUser,
  GroupRole,
} from '@/types/group';

export function useGroupDetail(groupId: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!groupId) {
      setGroup(null);
      setAbonnement(null);
      setPlan(null);
      setMembers([]);
      setGoals([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: groupData, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupErr) throw new Error(groupErr.message);
      setGroup(groupData as Group);

      const { data: aboData, error: aboErr } = await supabase
        .from('abonnements')
        .select('*')
        .eq('group_id', groupId)
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();
      if (aboErr) throw new Error(aboErr.message);

      const abo = (aboData as Abonnement | null) ?? null;
      setAbonnement(abo);

      if (abo?.plan_id) {
        const { data: planData, error: planErr } = await supabase
          .from('plans')
          .select('*')
          .eq('id', abo.plan_id)
          .single();
        if (planErr) throw new Error(planErr.message);
        setPlan((planData as Plan) ?? null);
      } else {
        setPlan(null);
      }

      const { data: ugData, error: ugErr } = await supabase
        .from('user_groups')
        .select('user_id, group_id, role')
        .eq('group_id', groupId);
      if (ugErr) throw new Error(ugErr.message);

      const userGroups = (ugData ?? []) as { user_id: string; group_id: string; role: string }[];
      const userIds = [...new Set(userGroups.map((ug) => ug.user_id))];

      let usersMap = new Map<string, { id: string; name: string | null; email: string | null }>();
      if (userIds.length > 0) {
        const { data: usersData, error: usersErr } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);
        if (usersErr) throw new Error(usersErr.message);
        (usersData ?? []).forEach((u: { id: string; name: string | null; email: string | null }) => {
          usersMap.set(u.id, { id: u.id, name: u.name, email: u.email });
        });
      }

      const membersWithUser: MemberWithUser[] = userGroups.map((ug) => ({
        ...ug,
        user: usersMap.get(ug.user_id) ?? null,
      }));
      setMembers(membersWithUser);

      const { data: goalsData, error: goalsErr } = await supabase
        .from('goals')
        .select('id, name, description, targetAmount, currentAmount, group_id, closed_at, createdAt')
        .eq('group_id', groupId)
        .order('createdAt', { ascending: false });
      if (goalsErr) throw new Error(goalsErr.message);

      setGoals((goalsData as Goal[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setGroup(null);
      setAbonnement(null);
      setPlan(null);
      setMembers([]);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateMemberRole = useCallback(
    async (userId: string, role: GroupRole) => {
      if (!groupId) return;
      const { error: err } = await supabase
        .from('user_groups')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      if (err) throw new Error(err.message);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role } : m))
      );
    },
    [groupId]
  );

  const updateGroup = useCallback(
    async (payload: { name?: string; description?: string | null }) => {
      if (!groupId) return;
      const { error: err } = await supabase
        .from('groups')
        .update({
          ...(payload.name !== undefined && { name: payload.name.trim() }),
          ...(payload.description !== undefined && {
            description: payload.description?.trim() || null,
          }),
        })
        .eq('id', groupId);
      if (err) throw new Error(err.message);
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              ...(payload.name !== undefined && { name: payload.name.trim() }),
              ...(payload.description !== undefined && {
                description: payload.description?.trim() || null,
              }),
            }
          : null
      );
    },
    [groupId]
  );

  const deleteGroup = useCallback(async () => {
    if (!groupId) return;
    const { error: err } = await supabase.from('groups').delete().eq('id', groupId);
    if (err) throw new Error(err.message);
  }, [groupId]);

  const removeAbonnement = useCallback(
    async (abonnementId: string) => {
      const { error: err } = await supabase
        .from('abonnements')
        .delete()
        .eq('id', abonnementId);
      if (err) throw new Error(err.message);
      setAbonnement(null);
      setPlan(null);
    },
    []
  );

  const createAbonnement = useCallback(
    async (payload: {
      plan_id: string;
      started_at: string;
      ends_at?: string | null;
    }) => {
      if (!groupId) return;
      const { data, error: err } = await supabase
        .from('abonnements')
        .insert({
          group_id: groupId,
          plan_id: payload.plan_id,
          started_at: payload.started_at,
          ends_at: payload.ends_at || null,
        })
        .select('*')
        .single();
      if (err) throw new Error(err.message);
      const abo = data as Abonnement;
      setAbonnement(abo);
      if (abo.plan_id) {
        const { data: planData, error: planErr } = await supabase
          .from('plans')
          .select('*')
          .eq('id', abo.plan_id)
          .single();
        if (!planErr) setPlan((planData as Plan) ?? null);
      }
    },
    [groupId]
  );

  const deleteGoal = useCallback(async (goalId: number) => {
    const { error: err } = await supabase.from('goals').delete().eq('id', goalId);
    if (err) throw new Error(err.message);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  }, []);

  const updateAbonnement = useCallback(
    async (
      abonnementId: string,
      payload: {
        plan_id?: string;
        started_at?: string;
        ends_at?: string | null;
      }
    ) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (payload.plan_id !== undefined) updates.plan_id = payload.plan_id;
      if (payload.started_at !== undefined) updates.started_at = payload.started_at;
      if (payload.ends_at !== undefined) updates.ends_at = payload.ends_at ?? null;

      const { data, error: err } = await supabase
        .from('abonnements')
        .update(updates)
        .eq('id', abonnementId)
        .select('*')
        .single();
      if (err) throw new Error(err.message);
      const abo = data as Abonnement;
      setAbonnement(abo);
      if (abo.plan_id) {
        const { data: planData, error: planErr } = await supabase
          .from('plans')
          .select('*')
          .eq('id', abo.plan_id)
          .single();
        if (!planErr) setPlan((planData as Plan) ?? null);
      }
    },
    []
  );

  return {
    group,
    abonnement,
    plan,
    members,
    goals,
    isLoading,
    error,
    refetch: fetch,
    updateMemberRole,
    updateGroup,
    deleteGroup,
    removeAbonnement,
    createAbonnement,
    updateAbonnement,
    deleteGoal,
  };
}
