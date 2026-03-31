import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import StaffIDCardsClient from './client';

export default async function StaffIDCardsPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <StaffIDCardsClient user={user} />;
}
