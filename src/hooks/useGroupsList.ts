import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface GroupOption {
  id: string;
  name: string;
}

export function useGroupsList() {
  const [groups, setGroups] = useState<GroupOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('groups')
      .select('id, name')
      .order('name')
      .then(({ data, error }) => {
        if (!cancelled && !error) setGroups((data as GroupOption[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  return { groups };
}
