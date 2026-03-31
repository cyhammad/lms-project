'use server';

import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import EditSchoolPolicyClient from './client';
import type { SchoolPolicy } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

type BackendSchoolPolicy = Omit<SchoolPolicy, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export default async function EditSchoolPolicyPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const { id: policyId } = await params;

  let policy: BackendSchoolPolicy | null = null;

  try {
    const data = await apiServer<{ policy: BackendSchoolPolicy }>(`/policies/school/${policyId}`);
    policy = data.policy ?? null;
  } catch (error) {
    console.error('Error loading school policy from API:', error);
  }

  return <EditSchoolPolicyClient policyId={policyId} policy={policy} />;
}
