// Local storage utilities for attendance data

import type { Attendance } from '@/types';

const STORAGE_KEY = 'edflo_attendances';

export const getAttendances = (): Attendance[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const attendances = JSON.parse(stored);
    return attendances.map((attendance: any) => ({
      ...attendance,
      date: new Date(attendance.date),
      createdAt: new Date(attendance.createdAt),
      updatedAt: new Date(attendance.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading attendances from localStorage:', error);
    return [];
  }
};

export const saveAttendances = (attendances: Attendance[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendances));
  } catch (error) {
    console.error('Error saving attendances to localStorage:', error);
  }
};

export const markAttendance = (attendanceData: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Attendance => {
  const attendances = getAttendances();
  
  // Check if attendance already exists for this person on this date
  const existingIndex = attendances.findIndex(a => {
    const sameDate = a.date.toDateString() === new Date(attendanceData.date).toDateString();
    if (attendanceData.studentId) {
      return sameDate && a.studentId === attendanceData.studentId;
    }
    if (attendanceData.staffId) {
      return sameDate && a.staffId === attendanceData.staffId;
    }
    return false;
  });

  if (existingIndex !== -1) {
    // Update existing attendance
    const updated: Attendance = {
      ...attendances[existingIndex],
      ...attendanceData,
      updatedAt: new Date(),
    };
    attendances[existingIndex] = updated;
    saveAttendances(attendances);
    return updated;
  }

  // Create new attendance
  const newAttendance: Attendance = {
    ...attendanceData,
    id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  attendances.push(newAttendance);
  saveAttendances(attendances);
  return newAttendance;
};

export const updateAttendance = (id: string, updates: Partial<Attendance>): Attendance | null => {
  const attendances = getAttendances();
  const index = attendances.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  attendances[index] = {
    ...attendances[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveAttendances(attendances);
  return attendances[index];
};

export const deleteAttendance = (id: string): boolean => {
  const attendances = getAttendances();
  const filtered = attendances.filter(a => a.id !== id);
  if (filtered.length === attendances.length) return false;
  
  saveAttendances(filtered);
  return true;
};

export const getAttendanceById = (id: string): Attendance | null => {
  const attendances = getAttendances();
  return attendances.find(a => a.id === id) || null;
};

export const getAttendanceByDate = (date: Date): Attendance[] => {
  const attendances = getAttendances();
  const dateString = date.toDateString();
  return attendances.filter(a => a.date.toDateString() === dateString);
};

export const getAttendanceByStudent = (studentId: string): Attendance[] => {
  const attendances = getAttendances();
  return attendances.filter(a => a.studentId === studentId);
};

export const getAttendanceByStaff = (staffId: string): Attendance[] => {
  const attendances = getAttendances();
  return attendances.filter(a => a.staffId === staffId);
};

export const getTodayAttendance = (): Attendance[] => {
  return getAttendanceByDate(new Date());
};

export const getAttendanceByDateAndPerson = (
  date: Date,
  studentId?: string,
  staffId?: string
): Attendance | null => {
  const attendances = getAttendances();
  const dateString = date.toDateString();
  
  return attendances.find(a => {
    const sameDate = a.date.toDateString() === dateString;
    if (studentId) {
      return sameDate && a.studentId === studentId;
    }
    if (staffId) {
      return sameDate && a.staffId === staffId;
    }
    return false;
  }) || null;
};
