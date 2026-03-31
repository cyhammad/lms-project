import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import LeaveRequestsClient from './client';

export default async function LeaveRequestsPage() {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) redirect('/login');
  return <LeaveRequestsClient />;
}
