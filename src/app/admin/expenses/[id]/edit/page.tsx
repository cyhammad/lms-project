import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { apiServer } from '@/lib/api-server';
import ExpenseFormClient from '../../_components/expense-form-client';
import type { Expense } from '@/types';

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) redirect(ROUTES.LOGIN);

  const { id } = await params;
  let expense: Expense | null = null;
  try {
    const data = await apiServer<{ expense: Expense }>(`/expenses/${id}`);
    expense = data.expense;
  } catch {
    redirect(ROUTES.ADMIN.EXPENSES);
  }

  if (!expense) redirect(ROUTES.ADMIN.EXPENSES);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Expense</h1>
        <p className="text-slate-800 mt-1">Update expense details</p>
      </div>
      <ExpenseFormClient mode="edit" expense={expense} />
    </div>
  );
}
