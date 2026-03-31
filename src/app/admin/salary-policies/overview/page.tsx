import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SalaryPoliciesClient from './client';

export default async function SalaryPoliciesOverviewPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <SalaryPoliciesClient schoolId={user.schoolId} />;
}
