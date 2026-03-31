import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import AttendanceClient from './client';
import type { Class, Section, Student, Attendance } from '@/types';

async function getData(schoolId: string, sectionId?: string, date?: string) {
  try {
    const [classes, sections] = await Promise.all([
      apiServer<Class[]>('/classes'),
      apiServer<Section[]>('/sections'),
    ]);

    let students: Student[] = [];
    let attendance: Attendance[] = [];

    if (sectionId && date) {
      const [studentsData, attendanceData] = await Promise.all([
        apiServer<Student[]>(`/students?sectionId=${sectionId}&activeOnly=true`),
        apiServer<{ attendance: Attendance[] }>(`/attendance?sectionId=${sectionId}&date=${date}`),
      ]);
      students = studentsData || [];
      attendance = attendanceData?.attendance || [];
    }

    return {
      classes: classes || [],
      sections: sections || [],
      students,
      attendance,
    };
  } catch (error) {
    console.error('Error fetching data for attendance:', error);
    return { classes: [], sections: [], students: [], attendance: [] };
  }
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const { sectionId, date } = await searchParams;

  const today = new Date().toISOString().split('T')[0];
  const selectedDate = date || today;
  const selectedSectionId = sectionId || '';

  const { classes, sections, students, attendance } = await getData(
    user.schoolId,
    selectedSectionId,
    selectedDate
  );

  return (
    <AttendanceClient
      initialClasses={classes}
      initialSections={sections}
      students={students}
      initialAttendance={attendance}
      selectedDate={selectedDate}
      selectedSectionId={selectedSectionId}
    />
  );
}
