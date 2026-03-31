import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import ExpensesClient from './client';

export default async function ExpensesPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect(ROUTES.LOGIN);
  }

  return <ExpensesClient />;
}
