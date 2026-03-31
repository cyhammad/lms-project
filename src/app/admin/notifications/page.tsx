import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import NotificationsClient from './client';

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <NotificationsClient user={user} />;
}
