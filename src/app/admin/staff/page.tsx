import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import StaffClient from './client';

async function getStaff() {
  try {
    const res = await apiServer<{ staff: any[] }>('/staff?limit=1000');
    return res.staff || [];
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
}

export default async function StaffPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const staff = await getStaff();

  return (
    <StaffClient
      initialStaff={staff}
      schoolId={user.schoolId}
    />
  );
}
