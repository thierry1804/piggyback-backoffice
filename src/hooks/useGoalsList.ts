import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface GoalOption {
  id: number;
  name: string;
}

export function useGoalsList() {
  const [goals, setGoals] = useState<GoalOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('goals')
      .select('id, name')
      .order('name')
      .then(({ data, error }) => {
        if (!cancelled && !error) setGoals((data as GoalOption[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  return { goals };
}
