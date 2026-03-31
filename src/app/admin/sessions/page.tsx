import { apiServer } from '@/lib/api-server';
import { AcademicSession, Class, Section, Student } from '@/types';
import SessionsClient from './client';

async function getSessions() {
  try {
    const data = await apiServer<{ sessions: AcademicSession[] }>('/sessions?limit=100');
    return data.sessions;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
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

async function getSections() {
  try {
    const data = await apiServer<{ sections: Section[] }>('/sections?limit=1000');
    return data.sections;
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    return [];
  }
}

async function getStudents() {
  try {
    // Fetch active students to count
    const data = await apiServer<{ students: Student[] }>('/students?isActive=true&limit=1000');
    return data.students;
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return [];
  }
}

export default async function SessionsPage() {
  const [sessions, classes, sections, students] = await Promise.all([
    getSessions(),
    getClasses(),
    getSections(),
    getStudents(),
  ]);

  return (
    <SessionsClient 
      initialSessions={sessions} 
      classes={classes} 
      sections={sections} 
      students={students} 
    />
  );
}
