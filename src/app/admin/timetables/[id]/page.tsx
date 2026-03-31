import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import TimetableViewClient from './client';
import type { Timetable, Class, Section, Subject, Teacher, School } from '@/types';

interface TimetableDetailsResponse {
  timetable: Timetable;
  classes: Class[];
  sections: Section[];
  subjects: Subject[];
  staff: Teacher[];
  allTimetables: Timetable[];
  school: School | null;
}

async function getData(timetableId: string) {
  try {
    const data = await apiServer<TimetableDetailsResponse>(`/timetables/details/${timetableId}`);

    if (!data?.timetable) return null;

    // Convert DayOfWeek from UPPERCASE (backend) to PascalCase (frontend)
    const timetable = {
      ...data.timetable,
      entries: data.timetable.entries.map(entry => ({
        ...entry,
        dayOfWeek: (entry.dayOfWeek.charAt(0) + entry.dayOfWeek.slice(1).toLowerCase()) as Timetable['entries'][0]['dayOfWeek'],
      })),
    };

    return {
      timetable,
      classes: data.classes || [],
      sections: data.sections || [],
      subjects: data.subjects || [],
      teachers: data.staff || [],
      school: data.school || null,
    };
  } catch (error) {
    console.error('Error fetching timetable details:', error);
    return null;
  }
}

export default async function TimetableViewPage({ params }: { params: Promise<{ id: string }> }) {
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
    <TimetableViewClient
      timetable={data.timetable}
      initialClasses={data.classes}
      initialSections={data.sections}
      initialSubjects={data.subjects}
      initialTeachers={data.teachers}
      school={data.school}
    />
  );
}
