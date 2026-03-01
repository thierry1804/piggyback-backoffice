import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SUPERADMIN_ROLE_ID } from '@/lib/constants';
import type { User } from '@/types/user';

const PAGE_SIZE = 10;

export function useUsers(initialSearch = '', initialRoleId: string | null = null) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [roleId, setRoleId] = useState<string | null>(initialRoleId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('users')
        .select('id, name, username, email, phone, created_at, role_id', {
          count: 'exact',
        })
        .neq('role_id', SUPERADMIN_ROLE_ID)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},email.ilike.${term}`);
      }
      if (roleId) {
        query = query.eq('role_id', roleId);
      }

      const { data, count, error: err } = await query;

      if (err) throw new Error(err.message);
      setUsers((data as User[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, Math.ceil(totalCount / PAGE_SIZE) || 1)));
  }, [totalCount]);

  return {
    users,
    totalCount,
    totalPages,
    page,
    pageSize: PAGE_SIZE,
    goToPage,
    isLoading,
    error,
    refetch: fetchUsers,
    search,
    setSearch,
    roleId,
    setRoleId,
  };
}
