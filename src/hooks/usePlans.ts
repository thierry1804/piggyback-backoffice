import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Plan } from '@/types/plan';

const PLANS_SELECT =
  'id, name, max_goals, is_one_shot, price_amount, price_currency, price_amount_after_early, early_bird_cap';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('plans')
      .select(PLANS_SELECT)
      .order('id');
    if (err) {
      setError(err.message);
      setPlans([]);
    } else {
      setPlans((data as Plan[]) ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const updatePlan = useCallback(
    async (
      id: string,
      payload: Partial<Pick<Plan, 'name' | 'max_goals' | 'is_one_shot' | 'price_amount' | 'price_currency' | 'price_amount_after_early' | 'early_bird_cap'>>
    ) => {
      const { error: err } = await supabase.from('plans').update(payload).eq('id', id);
      if (err) throw new Error(err.message);
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...payload } : p))
      );
    },
    []
  );

  return { plans, isLoading, error, refetch: fetchPlans, updatePlan };
}
