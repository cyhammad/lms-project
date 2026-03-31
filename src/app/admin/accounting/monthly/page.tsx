import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import MonthlyReportClient from './client';

export default async function MonthlyReportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return <MonthlyReportClient user={user} />;
}
