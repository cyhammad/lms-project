import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import ExpenseFormClient from '../_components/expense-form-client';

export default async function CreateExpensePage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Expense</h1>
        <p className="text-slate-800 mt-1">Record a new school expense</p>
      </div>
      <ExpenseFormClient mode="create" />
    </div>
  );
}
