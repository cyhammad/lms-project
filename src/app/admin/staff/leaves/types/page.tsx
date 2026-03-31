import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import LeaveTypesClient from './client';

export default async function LeaveTypesPage() {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) redirect('/login');
  return <LeaveTypesClient />;
}
