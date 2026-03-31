// Local storage utilities for students data

import type { Student } from '@/types';

const STORAGE_KEY = 'edflo_students';

export const getStudents = (): Student[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const students = JSON.parse(stored);
    return students.map((student: any) => ({
      ...student,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
      admissionDate: student.admissionDate ? new Date(student.admissionDate) : new Date(student.enrollmentDate || Date.now()),
      enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate) : (student.admissionDate ? new Date(student.admissionDate) : new Date()),
      createdAt: new Date(student.createdAt),
      updatedAt: new Date(student.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading students from localStorage:', error);
    return [];
  }
};

export const saveStudents = (students: Student[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    console.error('Error saving students to localStorage:', error);
  }
};

export const addStudent = (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student => {
  const students = getStudents();
  const newStudent: Student = {
    ...studentData,
    id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
};

export const updateStudent = (id: string, updates: Partial<Student>): Student | null => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  students[index] = {
    ...students[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveStudents(students);
  return students[index];
};

export const deleteStudent = (id: string): boolean => {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  if (filtered.length === students.length) return false;
  
  saveStudents(filtered);
  return true;
};

export const getStudentById = (id: string): Student | null => {
  const students = getStudents();
  return students.find(s => s.id === id) || null;
};

export const getStudentsBySchool = (schoolId: string): Student[] => {
  const students = getStudents();
  return students.filter(s => s.schoolId === schoolId);
};

export const getStudentsByClass = (classId: string): Student[] => {
  const students = getStudents();
  return students.filter(s => 
    s.classId === classId || 
    s.classApplyingFor === classId
  );
};

export const promoteStudents = (
  studentIds: string[],
  targetClassId: string,
  newAcademicSession?: string
): { promoted: number; failed: number } => {
  const students = getStudents();
  let promoted = 0;
  let failed = 0;

  studentIds.forEach(studentId => {
    const index = students.findIndex(s => s.id === studentId);
    if (index === -1) {
      failed++;
      return;
    }

    const updates: Partial<Student> = {
      classId: targetClassId,
      classApplyingFor: targetClassId,
      updatedAt: new Date(),
    };

    if (newAcademicSession) {
      updates.academicSession = newAcademicSession;
    }

    students[index] = {
      ...students[index],
      ...updates,
    };
    promoted++;
  });

  if (promoted > 0) {
    saveStudents(students);
  }

  return { promoted, failed };
};

export const demoteStudents = (
  studentIds: string[],
  targetClassId: string,
  newAcademicSession?: string
): { demoted: number; failed: number } => {
  const students = getStudents();
  let demoted = 0;
  let failed = 0;

  studentIds.forEach(studentId => {
    const index = students.findIndex(s => s.id === studentId);
    if (index === -1) {
      failed++;
      return;
    }

    const updates: Partial<Student> = {
      classId: targetClassId,
      classApplyingFor: targetClassId,
      updatedAt: new Date(),
    };

    if (newAcademicSession) {
      updates.academicSession = newAcademicSession;
    }

    students[index] = {
      ...students[index],
      ...updates,
    };
    demoted++;
  });

  if (demoted > 0) {
    saveStudents(students);
  }

  return { demoted, failed };
};
