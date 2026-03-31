import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import DemoteStudentsClient from './client';

export default async function DemoteStudentsPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <DemoteStudentsClient user={user} />;
}
