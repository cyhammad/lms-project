import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import { AcademicSession } from '@/types';
import EventCalendarClient from './client';

async function getSessions(): Promise<AcademicSession[]> {
  try {
    const data = await apiServer<{ sessions: AcademicSession[] }>('/sessions?limit=100');
    return data.sessions ?? [];
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
}

export default async function EventCalendarPage() {
  const user = await getCurrentUser();
  if (!user?.schoolId) redirect('/login');

  const sessions = await getSessions();

  return (
    <div className="p-6">
      <EventCalendarClient sessions={sessions} />
    </div>
  );
}
