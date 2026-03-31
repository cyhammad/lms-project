import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import GenerateSalaryClient from './client';

export default async function GenerateSalaryPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <GenerateSalaryClient user={user} />;
}
