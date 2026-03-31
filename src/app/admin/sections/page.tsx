import { apiServer } from '@/lib/api-server';
import { Section, Class, Student } from '@/types';
import SectionsClient from './client';

async function getSections() {
  try {
    const data = await apiServer<{ sections: Section[] }>('/sections?limit=1000');
    return data.sections;
  } catch (error) {
    console.error('Failed to fetch sections:', error);
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

async function getStudents() {
  try {
    const data = await apiServer<{ students: Student[] }>('/students?isActive=true&limit=1000');
    return data.students;
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return [];
  }
}

export default async function SectionsPage() {
  const [sections, classes, students] = await Promise.all([
    getSections(),
    getClasses(),
    getStudents(),
  ]);

  return <SectionsClient initialSections={sections} classes={classes} students={students} />;
}
