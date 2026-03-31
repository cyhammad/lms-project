import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import StaffDetailsClient from './client';
import type { Teacher, Timetable, TimetableEntry, SecurityDeductionRecord, Class, Section, Subject } from '@/types';

async function getData(staffId: string) {
  try {
    // Fetch basic data
    const [staffRes, classesRes, sectionsRes, subjectsRes] = await Promise.all([
      apiServer<{ staff: Teacher }>(`/staff/${staffId}`),
      apiServer<{ classes: Class[] }>('/classes'),
      apiServer<{ sections: Section[] }>('/sections'),
      apiServer<{ subjects: Subject[] }>('/subjects'),
    ]);

    // Check if staff exists
    if (!staffRes?.staff) {
      return null;
    }

    const staff = staffRes.staff;
    const classes = classesRes.classes || [];
    const sections = sectionsRes.sections || [];
    const subjects = subjectsRes.subjects || [];

    // Fetch timetables for all sections (since there's no /timetables endpoint)
    // We'll fetch timetables for each section and collect entries for this staff
    const timetablePromises = sections.map(async (section: Section) => {
      try {
        const timetableRes = await apiServer<{ timetable: Timetable }>(`/timetables/${section.id}`);
        return timetableRes.timetable || null;
      } catch {
        // Section might not have a timetable, which is fine
        return null;
      }
    });

    const rawTimetables = (await Promise.all(timetablePromises)).filter(
      (t): t is Timetable => t !== null
    );

    // Convert DayOfWeek from UPPERCASE (backend) to PascalCase (frontend)
    const convertDayOfWeek = (day: string): Timetable['entries'][0]['dayOfWeek'] => {
      return (day.charAt(0) + day.slice(1).toLowerCase()) as Timetable['entries'][0]['dayOfWeek'];
    };

    const timetables = rawTimetables.map(t => ({
      ...t,
      entries: t.entries.map(entry => ({
        ...entry,
        dayOfWeek: convertDayOfWeek(entry.dayOfWeek),
      })),
    }));

    // Fetch security deduction records (if endpoint exists, otherwise return empty array)
    let securityRecords: SecurityDeductionRecord[] = [];
    try {
      const securityRes = await apiServer<{ records: SecurityDeductionRecord[] }>('/security-deduction');
      securityRecords = (securityRes.records || []).filter(
        (r) => r.staffId === staffId
      );
    } catch (error) {
      // Security deduction endpoint might not exist yet
      console.warn('Security deduction endpoint not available:', error);
      securityRecords = [];
    }

    return {
      staff,
      timetables,
      securityRecords,
      classes,
      sections,
      subjects,
    };
  } catch (error) {
    console.error('Error fetching data for staff details:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StaffDetailsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id: staffId } = await params;

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const data = await getData(staffId);

  if (!data) {
    notFound();
  }

  const { staff, timetables, securityRecords, classes, sections, subjects } = data;

  // Process timetables to extract entries for this staff
  const timetableEntries: Array<{ entry: TimetableEntry; timetableId: string; sectionId: string }> = [];

  timetables.forEach(timetable => {
    timetable.entries.forEach(entry => {
      if (entry.teacherId === staff.id) {
        timetableEntries.push({
          entry,
          timetableId: timetable.id,
          sectionId: timetable.sectionId,
        });
      }
    });
  });

  return (
    <StaffDetailsClient
      staff={staff}
      timetableEntries={timetableEntries}
      securityRecords={securityRecords}
      classes={classes}
      sections={sections}
      subjects={subjects}
    />
  );
}
