import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import TimetablesClient from './client';
import type { Timetable, Class, Section } from '@/types';

async function getData() {
  try {
    const [timetablesRes, classesRes, sectionsRes] = await Promise.all([
      apiServer<{ timetables: Timetable[] }>('/timetables'),
      apiServer<{ classes: Class[] }>('/classes'),
      apiServer<{ sections: Section[] }>('/sections'),
    ]);

    // Convert DayOfWeek from UPPERCASE (backend) to PascalCase (frontend)
    const convertDayOfWeek = (day: string): Timetable['entries'][0]['dayOfWeek'] => {
      return (day.charAt(0) + day.slice(1).toLowerCase()) as Timetable['entries'][0]['dayOfWeek'];
    };

    const timetables = (timetablesRes.timetables || []).map(t => ({
      ...t,
      entries: t.entries.map(entry => ({
        ...entry,
        dayOfWeek: convertDayOfWeek(entry.dayOfWeek),
      })),
    }));

    return {
      timetables,
      classes: classesRes.classes || [],
      sections: sectionsRes.sections || [],
    };
  } catch (error) {
    console.error('Error fetching timetables data:', error);
    return { timetables: [], classes: [], sections: [] };
  }
}

export default async function TimetablesPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const { timetables, classes, sections } = await getData();

  return (
    <TimetablesClient 
      initialTimetables={timetables}
      classes={classes}
      sections={sections}
    />
  );
}
