import { apiServer } from '@/lib/api-server';
import { Subject, Class } from '@/types';
import SubjectsClient from './client';

async function getSubjects() {
  try {
    const data = await apiServer<{ subjects: Subject[] }>('/subjects?limit=1000');
    return data.subjects;
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    return [];
  }
}

async function getClasses() {
  try {
    const data = await apiServer<{ classes: Class[] }>('/classes?limit=1000');
    return data.classes;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return [];
  }
}

export default async function SubjectsPage() {
  const [subjects, classes] = await Promise.all([
    getSubjects(),
    getClasses(),
  ]);

  return <SubjectsClient initialSubjects={subjects} classes={classes} />;
}
