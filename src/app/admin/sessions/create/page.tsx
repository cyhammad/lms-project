import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import CreateSessionClient from './client';

export default async function CreateSessionPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <CreateSessionClient />;
}
