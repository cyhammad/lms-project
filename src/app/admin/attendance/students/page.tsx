import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import StudentsAttendanceClient from './client';

export default async function StudentsAttendancePage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <StudentsAttendanceClient user={user} />;
}
