import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import PoliciesOverviewClient from './client';

export default async function PoliciesOverviewPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <PoliciesOverviewClient user={user} />;
}
