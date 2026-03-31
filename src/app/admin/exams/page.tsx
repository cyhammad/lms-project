import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import ExamsClient from './client';
import type { ExamDto } from '@/types';

async function getInitialData() {
  try {
    const res = await apiServer<{ exams: ExamDto[]; pagination: { total: number } }>('/exams?limit=100');
    return { exams: res.exams ?? [], pagination: res.pagination ?? { total: 0 } };
  } catch {
    return { exams: [], pagination: { total: 0 } };
  }
}

export default async function ExamsPage() {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) redirect('/login');
  const { exams, pagination } = await getInitialData();
  return <ExamsClient initialExams={exams} />;
}
