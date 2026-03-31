import { apiServer } from '@/lib/api-server';
import { User, School } from '@/types';
import CreateUserClient from './client';

async function getSchools() {
  try {
    const data = await apiServer<{ schools: School[] }>('/schools?limit=100');
    return data.schools;
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    return [];
  }
}

async function getStudents() {
  try {
    const data = await apiServer<{ users: User[] }>('/users?role=STUDENT&limit=1000');
    return data.users;
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return [];
  }
}

export default async function CreateUserPage() {
  const [schools, students] = await Promise.all([
    getSchools(),
    getStudents(),
  ]);

  return <CreateUserClient schools={schools} students={students} />;
}
