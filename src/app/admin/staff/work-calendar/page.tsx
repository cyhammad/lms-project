import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import WorkCalendarClient from './client';
import type { Teacher } from '@/types';

async function getStaff() {
  try {
    const res = await apiServer<{ staff: Teacher[] }>('/staff?limit=1000');
    return res.staff || [];
  } catch {
    return [];
  }
}

export default async function WorkCalendarPage() {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) redirect('/login');
  const staff = await getStaff();
  return <WorkCalendarClient initialStaff={staff} />;
}
