import { getCurrentUser } from '@/lib/session';
import CreateAnnouncementClient from './client';
import { redirect } from 'next/navigation';

export default async function CreateAnnouncementPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <CreateAnnouncementClient user={user} />;
}

