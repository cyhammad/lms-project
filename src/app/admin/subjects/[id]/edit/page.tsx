import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import EditSubjectClient from './client';
import type { Subject, Class } from '@/types';

async function getData(subjectId: string) {
  try {
    const [subjectRes, classesRes] = await Promise.all([
      apiServer<{ subject: Subject }>(`/subjects/${subjectId}`),
      apiServer<{ classes: Class[] }>('/classes?limit=1000'),
    ]);

    if (!subjectRes || !subjectRes.subject) {
      return null;
    }

    return {
      subject: subjectRes.subject,
      classes: classesRes.classes || [],
    };
  } catch (error) {
    console.error('Error fetching data for edit subject:', error);
    return null;
  }
}

export default async function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id: subjectId } = await params;

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const data = await getData(subjectId);

  if (!data) {
    redirect('/admin/subjects');
  }

  return (
    <EditSubjectClient
      subject={data.subject}
      classes={data.classes}
    />
  );
}
