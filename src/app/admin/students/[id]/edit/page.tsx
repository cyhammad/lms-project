import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import EditStudentClient from './client';

async function getData(studentId: string) {
  try {
    const [studentRes, classesRes, sectionsRes, sessionsRes] = await Promise.all([
      apiServer<{ student: any }>(`/students/${studentId}`),
      apiServer<{ classes: any[] }>('/classes'),
      apiServer<{ sections: any[] }>('/sections'),
      apiServer<{ sessions: any[] }>('/sessions'),
    ]);

    if (!studentRes || !studentRes.student) {
      return null;
    }

    return {
      student: studentRes.student,
      classes: classesRes.classes || [],
      sections: sectionsRes.sections || [],
      sessions: sessionsRes.sessions || [],
    };
  } catch (error) {
    console.error('Error fetching data for edit student:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditStudentPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id: studentId } = await params;

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const data = await getData(studentId);

  if (!data) {
    notFound();
  }

  const { student, classes, sections, sessions } = data;

  // Ensure user owns this student (API should handle this, but extra check is fine)
  if (student.schoolId !== user.schoolId) {
    redirect('/admin/students');
  }

  return (
    <EditStudentClient
      student={student}
      initialClasses={classes}
      initialSections={sections}
      initialSessions={sessions}
      schoolId={user.schoolId}
    />
  );
}
