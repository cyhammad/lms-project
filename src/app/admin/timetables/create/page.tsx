import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import CreateTimetableClient from './client';
import type { Timetable, Class, Section, Subject, Teacher } from '@/types';

async function getData() {
  try {
    const [classesRes, sectionsRes, subjectsRes, teachersRes, timetablesRes] = await Promise.all([
      apiServer<{ classes: Class[] }>('/classes'),
      apiServer<{ sections: Section[] }>('/sections'),
      apiServer<{ subjects: Subject[] }>('/subjects'),
      apiServer<{ staff: Teacher[] }>('/staff?type=Teacher'),
      apiServer<{ timetables: Timetable[] }>('/timetables'),
    ]);

    return {
      classes: classesRes.classes || [],
      sections: sectionsRes.sections || [],
      subjects: subjectsRes.subjects || [],
      teachers: teachersRes.staff || [],
      timetables: timetablesRes.timetables || [],
    };
  } catch (error) {
    console.error('Error fetching data for create timetable:', error);
    return { classes: [], sections: [], subjects: [], teachers: [], timetables: [] };
  }
}

export default async function CreateTimetablePage() {
  const user = await getCurrentUser();
  
  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const { classes, sections, subjects, teachers, timetables } = await getData();

  return (
    <CreateTimetableClient 
      initialClasses={classes}
      initialSections={sections}
      initialSubjects={subjects}
      initialTeachers={teachers}
      allTimetables={timetables}
    />
  );
}
