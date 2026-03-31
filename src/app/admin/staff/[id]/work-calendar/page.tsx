import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import StaffWorkCalendarByIdClient from './client';
import type { Teacher } from '@/types';

async function getStaff(id: string) {
  try {
    const res = await apiServer<{ staff: Teacher }>(`/staff/${id}`);
    return res.staff ?? null;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffWorkCalendarPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id: staffId } = await params;
  if (!user || !user.schoolId) redirect('/login');
  const staff = await getStaff(staffId);
  if (!staff) notFound();
  return (
    <StaffWorkCalendarByIdClient
      staffId={staff.id}
      staffName={staff.name}
    />
  );
}
