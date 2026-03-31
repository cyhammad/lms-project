import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import LeaveHistoryClient from './client';

export default async function LeaveHistoryPage() {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) redirect('/login');
  return <LeaveHistoryClient />;
}
