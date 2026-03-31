import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import PoliciesClient from './client';

export default async function PoliciesPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <PoliciesClient user={user} />;
}
