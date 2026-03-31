import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import CreateExamClient from './client';

export default async function CreateExamPage() {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) redirect('/login');
  return <CreateExamClient />;
}
