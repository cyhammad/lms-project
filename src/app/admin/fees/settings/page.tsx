import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import FeeSettingsClient from './client';

export default async function FeeSettingsPage() {
  const user = await getCurrentUser();

  if (!user?.schoolId) {
    redirect('/login');
  }

  return <FeeSettingsClient user={{ schoolId: user.schoolId }} />;
}
