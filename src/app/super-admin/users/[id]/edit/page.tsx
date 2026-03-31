import { apiServer } from '@/lib/api-server';
import { User, School } from '@/types';
import EditUserClient from './client';
import { notFound } from 'next/navigation';

async function getData(id: string) {
  try {
    const [userData, schoolsData, studentsData] = await Promise.all([
      apiServer<{ user: User }>(`/users/${id}`),
      apiServer<{ schools: School[] }>('/schools?limit=100'),
      apiServer<{ users: User[] }>('/users?role=STUDENT&limit=1000'),
    ]);

    return {
      user: userData.user,
      schools: schoolsData.schools,
      students: studentsData.users,
    };
  } catch (error) {
    console.error('Failed to fetch user edit data:', error);
    return null;
  }
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);

  if (!data || !data.user) {
    notFound();
  }

  return (
    <EditUserClient 
      user={data.user} 
      schools={data.schools} 
      students={data.students} 
    />
  );
}
