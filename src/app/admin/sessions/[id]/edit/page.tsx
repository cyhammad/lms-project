import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import EditSessionClient from './client';
import { AcademicSession } from '@/types';

async function getSession(id: string) {
  try {
    const res = await apiServer<{ session: AcademicSession }>(`/sessions/${id}`);
    return res.session;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSessionPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const session = await getSession(id);

  if (!session) {
    redirect('/admin/sessions');
  }

  return <EditSessionClient session={session} />;
}
