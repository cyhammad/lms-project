import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import GenerateFeeClient from './client';

export default async function GenerateFeePage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <GenerateFeeClient user={user} />;
}
