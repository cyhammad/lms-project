import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import ExamResultsClient from './client';
import type { ExamDto, ResultCardDto } from '@/types';

async function getData(examId: string) {
  try {
    const [examRes, resultsRes] = await Promise.all([
      apiServer<{ exam: ExamDto }>(`/exams/${examId}`),
      apiServer<{ resultCards: ResultCardDto[] }>(`/exams/${examId}/results`),
    ]);
    return { exam: examRes.exam, resultCards: resultsRes.resultCards ?? [] };
  } catch {
    return null;
  }
}

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user || !user.schoolId) redirect('/login');
  const data = await getData(id);
  if (!data) notFound();
  return <ExamResultsClient examId={id} initialExam={data.exam} initialResultCards={data.resultCards} />;
}
