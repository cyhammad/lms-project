import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import IDCardsClient from './client';

export default async function IDCardsPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <IDCardsClient user={user} />;
}
