import { apiServer } from '@/lib/api-server';
import { Class, AcademicSession, Student } from '@/types';
import ClassesClient from './client';

async function getClasses() {
  try {
    const data = await apiServer<{ classes: Class[] }>('/classes?limit=1000');
    return data.classes;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return [];
  }
}

async function getSessions() {
  try {
    const data = await apiServer<{ sessions: AcademicSession[] }>('/sessions?limit=1000');
    return data.sessions;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
}

async function getStudents() {
  try {
    const data = await apiServer<{ students: Student[] }>('/students?isActive=true&limit=1000');
    return data.students;
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return [];
  }
}

export default async function ClassesPage() {
  const [classes, sessions, students] = await Promise.all([
    getClasses(),
    getSessions(),
    getStudents(),
  ]);

  return <ClassesClient initialClasses={classes} sessions={sessions} students={students} />;
}
