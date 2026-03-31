import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import EditStaffClient from './client';
import type { Teacher } from '@/types';

async function getStaffMember(id: string) {
  try {
    const res = await apiServer<{ staff: Teacher }>(`/staff/${id}`);
    return res.staff;
  } catch (error) {
    console.error('Error fetching staff member:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditStaffPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id: staffId } = await params;

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const staff = await getStaffMember(staffId);

  if (!staff) {
    notFound();
  }

  // Ensure school check
  if (staff.schoolId !== user.schoolId) {
    redirect('/admin/staff');
  }

  return (
    <EditStaffClient
      staff={staff}
    />
  );
}
