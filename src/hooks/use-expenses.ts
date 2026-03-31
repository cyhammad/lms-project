'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Expense } from '@/types';
import { apiClient } from '@/lib/api-client';

const DEFAULT_LIMIT = 2000;

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ expenses: Expense[]; pagination: { total: number } }>(
        `/expenses?page=1&limit=${DEFAULT_LIMIT}`
      );
      setExpenses(res.expenses ?? []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    refresh: fetchExpenses,
  };
}
