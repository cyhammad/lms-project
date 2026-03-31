import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import CreateCampusClient from './client';

export default async function CreateCampusPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <CreateCampusClient user={user} />;
}
