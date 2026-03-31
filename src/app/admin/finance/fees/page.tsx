import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import FeesClient from './client';
import type { Class, Section, StudentFeePayment } from '@/types';

// Extended type matching what we did in client
interface FeeWithStudent extends StudentFeePayment {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    bFormCrc: string;
    section: {
      name: string;
      class: {
        name: string;
      };
    };
  };
}

interface FeesResponse {
  fees: FeeWithStudent[];
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
    classId?: string;
    sectionId?: string;
    studentId?: string;
    month?: string;
    year?: string;
    status?: string;
    page?: string;
  }
) {
  try {
    const params = new URLSearchParams();
    if (searchParams.classId) params.set('classId', searchParams.classId);
    if (searchParams.sectionId) params.set('sectionId', searchParams.sectionId);
    if (searchParams.studentId) params.set('studentId', searchParams.studentId);
    if (searchParams.month) params.set('month', searchParams.month);
    if (searchParams.year) params.set('year', searchParams.year);
    if (searchParams.status) params.set('status', searchParams.status);
    if (searchParams.page) params.set('page', searchParams.page);

    const [classes, sections, feesData] = await Promise.all([
      apiServer<Class[]>('/classes'),
      apiServer<Section[]>('/sections'),
      apiServer<FeesResponse>(`/fees?${params.toString()}`),
    ]);

    return {
      classes: classes || [],
      sections: sections || [],
      fees: feesData?.fees || [],
      pagination: feesData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  } catch (error) {
    console.error('Error fetching data for fees:', error);
    return {
      classes: [],
      sections: [],
      fees: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
}

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;

  const { classes, sections, fees, pagination } = await getData(
    user.schoolId,
    resolvedSearchParams as {
      classId?: string;
      sectionId?: string;
      studentId?: string;
      month?: string;
      year?: string;
      status?: string;
      page?: string;
    }
  );

  return (
    <FeesClient
      initialClasses={classes}
      initialSections={sections}
      fees={fees}
      pagination={pagination}
    />
  );
}
