import { apiServer } from '@/lib/api-server';
import { AcademicSession } from '@/types';
import CreateClassClient from './client';

async function getSessions() {
  try {
    const data = await apiServer<{ sessions: AcademicSession[] }>('/sessions?limit=1000');
    return data.sessions;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
}

export default async function CreateClassPage() {
  const sessions = await getSessions();
  return <CreateClassClient sessions={sessions} />;
}
