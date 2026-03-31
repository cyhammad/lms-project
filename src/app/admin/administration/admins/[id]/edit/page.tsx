import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import type { User } from '@/types';
import EditAdminClient from './client';

async function getAdmin(id: string) {
  try {
    const response = await apiServer<{ user: User }>(`/users/${id}`);
    return response.user;
  } catch (error) {
    console.error('[DEBUG] getAdmin Error:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAdminPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id: adminId } = await params;

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const admin = await getAdmin(adminId);

  if (!admin || admin.schoolId !== user.schoolId || admin.role !== 'admin') {
    notFound();
  }

  return (
    <EditAdminClient admin={admin} />
  );
}
