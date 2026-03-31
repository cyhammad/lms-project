'use server';

import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import CreateSchoolPolicyClient from './client';

export default async function CreateSchoolPolicyPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <CreateSchoolPolicyClient user={user} />;
}

