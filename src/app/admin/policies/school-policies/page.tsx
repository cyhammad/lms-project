'use server';

import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SchoolPoliciesClient from './client';

export default async function SchoolPoliciesPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return <SchoolPoliciesClient user={user} />;
}
