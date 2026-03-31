import { apiServer } from '@/lib/api-server';
import { School } from '@/types';
import EditSchoolClient from './client';
import { notFound } from 'next/navigation';

async function getSchool(id: string) {
  try {
    const data = await apiServer<{ school: School }>(`/schools/${id}`);
    return data.school;
  } catch (error) {
    console.error('Failed to fetch school:', error);
    return null;
  }
}

export default async function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchool(id);

  if (!school) {
    notFound();
  }

  return <EditSchoolClient school={school} />;
}
