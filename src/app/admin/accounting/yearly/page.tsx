import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import YearlyReportClient from './client';

export default async function YearlyReportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return <YearlyReportClient user={user} />;
}
