import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import TeachersAttendanceClient from './client';

export default async function TeachersAttendancePage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <TeachersAttendanceClient />;
}
