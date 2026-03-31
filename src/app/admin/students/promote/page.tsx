import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import PromoteStudentsClient from './client';

export default async function PromoteStudentsPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <PromoteStudentsClient user={user} />;
}
