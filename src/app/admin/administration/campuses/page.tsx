import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import CampusesClient from './client';

export default async function CampusesPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <CampusesClient user={user} />;
}
