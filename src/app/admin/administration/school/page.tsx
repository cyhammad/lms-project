import { apiServer } from '@/lib/api-server';
import { User, School } from '@/types';
import SchoolClient from './client';

async function getData() {
  try {
    const user = await apiServer<{ user: User }>('/auth/me');
    
    if (!user.user.schoolId) {
      return { school: null };
    }

    const school = await apiServer<{ school: School }>(`/schools/${user.user.schoolId}`);
    return { school: school.school };
  } catch (error) {
    console.error('Failed to fetch school data:', error);
    return { school: null };
  }
}

export default async function SchoolAdministrationPage() {
  const { school } = await getData();

  return <SchoolClient initialSchool={school} />;
}
