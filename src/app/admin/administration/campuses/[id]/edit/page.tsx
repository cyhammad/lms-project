import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import EditCampusClient from './client';

export default async function EditCampusPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <EditCampusClient user={user} />;
}
