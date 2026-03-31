'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { Expense, ExpenseCategory } from '@/types';

const initialForm = {
  title: '',
  amount: '',
  description: '',
  categoryId: '',
};

interface ExpenseFormClientProps {
  mode: 'create';
  expense?: null;
}

interface ExpenseFormClientEditProps {
  mode: 'edit';
  expense: Expense;
}

export default function ExpenseFormClient(
  props: ExpenseFormClientProps | ExpenseFormClientEditProps
) {
  const router = useRouter();
  const isEdit = props.mode === 'edit';
  const existing = isEdit ? props.expense : null;

  const [formData, setFormData] = useState({
    title: existing?.title ?? initialForm.title,
    amount: existing != null ? String(existing.amount) : initialForm.amount,
    description: existing?.description ?? initialForm.description,
    categoryId: existing?.categoryId ?? existing?.category?.id ?? initialForm.categoryId,
  });
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient<{ categories: ExpenseCategory[] }>('/expense-categories');
        if (!cancelled) setCategories(res.categories || []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (existing) {
      setFormData({
        title: existing.title,
        amount: String(existing.amount),
        description: existing.description ?? '',
        categoryId: existing.categoryId ?? existing.category?.id ?? '',
      });
    }
  }, [existing]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    const num = parseFloat(formData.amount);
    if (formData.amount === '' || isNaN(num) || num < 0) e.amount = 'Enter a valid amount (≥ 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || undefined,
      };
      if (isEdit && existing) {
        payload.categoryId = formData.categoryId ? formData.categoryId : null;
        await apiClient(`/expenses/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        router.push(ROUTES.ADMIN.EXPENSES);
      } else {
        if (formData.categoryId) payload.categoryId = formData.categoryId;
        await apiClient('/expenses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        router.push(ROUTES.ADMIN.EXPENSES);
      }
      router.refresh();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Expense' : 'Expense Details'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update the expense details below.' : 'Fill in the details for the new expense.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 bg-white"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-700 mt-1">
              Optional.{' '}
              <Link href={ROUTES.ADMIN.EXPENSES_CATEGORIES} className="text-slate-800 hover:underline">
                Manage categories
              </Link>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 ${errors.title ? 'border-red-500' : 'border-slate-300'}`}
                placeholder="e.g. Electricity bill - January"
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Amount (PKR) *</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 ${errors.amount ? 'border-red-500' : 'border-slate-300'}`}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              placeholder="Optional notes"
            />
          </div>
          {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Create Expense'}
            </Button>
            <Link href={ROUTES.ADMIN.EXPENSES}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
