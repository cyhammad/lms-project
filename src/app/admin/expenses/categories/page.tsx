import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import ExpenseCategoriesClient from './categories-client';

export default async function ExpenseCategoriesPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect(ROUTES.LOGIN);
  }

  return <ExpenseCategoriesClient />;
}
