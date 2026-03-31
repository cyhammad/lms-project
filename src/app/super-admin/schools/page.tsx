import { apiServer } from '@/lib/api-server';
import { School } from '@/types';
import SchoolsClient from './client';

type StatusFilter = 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED' | '';

async function getSchools(status?: StatusFilter) {
  try {
    const params = new URLSearchParams({ limit: '100' });
    if (status) params.set('status', status);
    const data = await apiServer<{ schools: School[] }>(`/schools?${params.toString()}`);
    return data.schools;
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    return [];
  }
}

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = status && ['ACTIVE', 'ON_HOLD', 'SUSPENDED'].includes(status) ? (status as 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED') : undefined;
  const schools = await getSchools(validStatus ?? '');

  return <SchoolsClient initialSchools={schools} initialStatusFilter={validStatus ?? ''} />;
}
