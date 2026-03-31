import React from 'react';
import { apiServer } from '@/lib/api-server';
import type { User, Class, Section, Student } from '@/types';
import { FeeHistoryClientPage } from './components/FeeHistoryClientPage';

async function getData() {
  try {
    const [userData, classesRes, studentsRes, sectionsRes] = await Promise.all([
      apiServer<{ user: User }>('/auth/me'),
      apiServer<{ classes: Class[] }>('/classes'),
      apiServer<{ students: Student[] }>('/students?isActive=true&limit=1000'),
      apiServer<{ sections: Section[] }>('/sections?limit=1000'),
    ]);

    return {
      user: userData.user,
      classes: classesRes.classes,
      students: studentsRes.students,
      sections: sectionsRes.sections,
    };
  } catch (error) {
    console.error('Failed to fetch data for fee history page:', error);
    return {
      user: null,
      classes: [] as Class[],
      students: [] as Student[],
      sections: [] as Section[],
    };
  }
}

export default async function FeeHistoryPage() {
  const { user, classes, students, sections } = await getData();

  return (
    <FeeHistoryClientPage
      initialUser={user}
      initialClasses={classes}
      initialStudents={students}
      initialSections={sections}
    />
  );
}

