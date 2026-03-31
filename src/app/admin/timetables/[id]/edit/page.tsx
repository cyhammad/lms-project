import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import EditTimetableClient from './client';
import type { Timetable, Class, Section, Subject, Teacher } from '@/types';

interface TimetableDetailsResponse {
  timetable: Timetable;
  classes: Class[];
  sections: Section[];
  subjects: Subject[];
  staff: Teacher[];
  allTimetables: Timetable[];
}

async function getData(timetableId: string) {
  try {
    const data = await apiServer<TimetableDetailsResponse>(`/timetables/details/${timetableId}`);

    if (!data?.timetable) return null;

    // Convert DayOfWeek from UPPERCASE (backend) to PascalCase (frontend)
    const convertDayOfWeek = (day: string): Timetable['entries'][0]['dayOfWeek'] =>
      (day.charAt(0) + day.slice(1).toLowerCase()) as Timetable['entries'][0]['dayOfWeek'];

    const timetable = {
      ...data.timetable,
      entries: data.timetable.entries.map(entry => ({
        ...entry,
        dayOfWeek: convertDayOfWeek(entry.dayOfWeek),
      })),
    };

    const allTimetables = (data.allTimetables || []).map(t => ({
      ...t,
      entries: t.entries.map(entry => ({
        ...entry,
        dayOfWeek: convertDayOfWeek(entry.dayOfWeek),
      })),
    }));

    return {
      timetable,
      classes: data.classes || [],
      sections: data.sections || [],
      subjects: data.subjects || [],
      teachers: data.staff || [],
      allTimetables,
    };
  } catch (error) {
    console.error('Error fetching timetable details for edit:', error);
    return null;
  }
}

export default async function EditTimetablePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id: timetableId } = await params;

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const data = await getData(timetableId);

  if (!data) {
    redirect('/admin/timetables');
  }

  return (
    <EditTimetableClient
      timetable={data.timetable}
      initialClasses={data.classes}
      initialSections={data.sections}
      initialSubjects={data.subjects}
      initialTeachers={data.teachers}
      allTimetables={data.allTimetables}
    />
  );
}
