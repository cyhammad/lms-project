import React from 'react';
import type { FC } from 'react';
import { StudentFeesClientPage } from './components/StudentFeesClientPage';
import { getCurrentUser } from '@/lib/session';

interface PageProps {
  params: Promise<{ id: string }>;
}

const StudentFeesPage: FC<PageProps> = async ({ params }) => {
  const { id: studentId } = await params;
  const user = await getCurrentUser();

  return <StudentFeesClientPage studentId={studentId} user={user} />;
};

export default StudentFeesPage;
