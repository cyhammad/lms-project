import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import ExamDetailClient from './client';
import type { ExamDto } from '@/types';

async function getExam(id: string) {
  try {
    const res = await apiServer<{ exam: ExamDto }>(`/exams/${id}`);
    return res.exam ?? null;
  } catch {
    return null;
  }
}

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user || !user.schoolId) redirect('/login');
  const exam = await getExam(id);
  if (!exam) notFound();
  return <ExamDetailClient initialExam={exam} />;
}
