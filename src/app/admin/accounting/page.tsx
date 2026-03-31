import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import AccountingOverviewClient from './client';

export default async function AccountingOverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return <AccountingOverviewClient user={user} />;
}
