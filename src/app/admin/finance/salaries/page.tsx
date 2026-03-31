import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import SalariesClient from './client';
import type { StaffSalaryPayment } from '@/types';

interface SalaryWithStaff extends StaffSalaryPayment {
  staff: {
    id: string;
    name: string;
    staffType: string;
  };
}

interface SalariesResponse {
  salaries: SalaryWithStaff[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getData(
  schoolId: string,
  searchParams: {
    staffId?: string;
    month?: string;
    year?: string;
    status?: string;
    page?: string;
  }
) {
  try {
    const params = new URLSearchParams();
    if (searchParams.staffId) params.set('staffId', searchParams.staffId);
    if (searchParams.month) params.set('month', searchParams.month);
    if (searchParams.year) params.set('year', searchParams.year);
    if (searchParams.status) params.set('status', searchParams.status);
    if (searchParams.page) params.set('page', searchParams.page);

    const salariesData = await apiServer<SalariesResponse>(`/salaries?${params.toString()}`);

    return {
      salaries: salariesData?.salaries || [],
      pagination: salariesData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  } catch (error) {
    console.error('Error fetching data for salaries:', error);
    return {
      salaries: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
}

export default async function SalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;
  const { salaries, pagination } = await getData(
    user.schoolId,
    resolvedSearchParams as {
      staffId?: string;
      month?: string;
      year?: string;
      status?: string;
      page?: string;
    }
  );

  return (
    <SalariesClient
      salaries={salaries}
      pagination={pagination}
    />
  );
}
