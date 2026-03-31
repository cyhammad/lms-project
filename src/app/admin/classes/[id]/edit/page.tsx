import { apiServer } from '@/lib/api-server';
import type { AcademicSession, Class } from '@/types';
import EditClassClient from './client';
import { notFound } from 'next/navigation';

async function getData(classId: string) {
  try {
    const [classData, sessionsData] = await Promise.all([
      apiServer<{ class: Class }>(`/classes/${classId}`),
      apiServer<{ sessions: AcademicSession[] }>('/sessions?limit=1000'),
    ]);

    if (!classData || !classData.class) {
      return null;
    }

    return {
      classToEdit: classData.class,
      sessions: sessionsData.sessions || [],
    };
  } catch (error) {
    console.error('Error loading class data for edit page:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditClassPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getData(id);

  if (!data) {
    notFound();
  }

  const { classToEdit, sessions } = data;

  return <EditClassClient classToEdit={classToEdit} sessions={sessions} />;
}

