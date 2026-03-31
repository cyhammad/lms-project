import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import StaffAttendanceClient from './client';

export default async function StaffAttendancePage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <StaffAttendanceClient user={user} />;
}
