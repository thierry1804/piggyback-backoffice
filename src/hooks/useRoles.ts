import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/types/user';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('roles')
      .select('id, label')
      .order('id');
    if (err) {
      setError(err.message);
      setRoles([]);
    } else {
      setRoles((data as Role[]) ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, isLoading, error, refetch: fetchRoles };
}
