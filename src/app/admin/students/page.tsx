  import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import StudentsClient from './client';

async function getData() {
  const [classesRes, sectionsRes, sessionsRes] = await Promise.all([
    apiServer<{ classes: any[] }>('/classes'),
    apiServer<{ sections: any[] }>('/sections'),
    apiServer<{ sessions: any[] }>('/sessions'),
  ]);

  return {
    classes: classesRes.classes || [],
    sections: sectionsRes.sections || [],
    sessions: sessionsRes.sessions || [],
  };
}

export default async function StudentsPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const { classes, sections, sessions } = await getData();

  return (
    <StudentsClient
      classes={classes}
      sections={sections}
      sessions={sessions}
      schoolId={user.schoolId}
    />
  );
}
