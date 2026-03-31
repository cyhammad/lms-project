import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import QuarterlyReportClient from './client';

export default async function QuarterlyReportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return <QuarterlyReportClient user={user} />;
}
