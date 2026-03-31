'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Attendance, AttendanceStatus } from '@/types';
import {
  getAttendances,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByDate,
  getAttendanceByStudent,
  getAttendanceByStaff,
  getTodayAttendance,
  getAttendanceByDateAndPerson,
} from '@/lib/attendance-storage';

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  presentPercentage: number;
}

export function useAttendance() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendances = () => {
      setLoading(true);
      const data = getAttendances();
      setAttendances(data);
      setLoading(false);
    };

    loadAttendances();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_attendances') {
        loadAttendances();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const markAttendanceRecord = (
    attendanceData: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newAttendance = markAttendance(attendanceData);
    setAttendances(prev => {
      // Remove existing attendance for same person and date if exists
      const filtered = prev.filter(a => {
        const sameDate = a.date.toDateString() === newAttendance.date.toDateString();
        if (attendanceData.studentId) {
          return !(sameDate && a.studentId === attendanceData.studentId);
        }
        if (attendanceData.staffId) {
          return !(sameDate && a.staffId === attendanceData.staffId);
        }
        return true;
      });
      return [...filtered, newAttendance];
    });
    return newAttendance;
  };

  const updateAttendanceById = (id: string, updates: Partial<Attendance>) => {
    const updated = updateAttendance(id, updates);
    if (updated) {
      setAttendances(prev => prev.map(a => a.id === id ? updated : a));
    }
    return updated;
  };

  const removeAttendance = (id: string) => {
    const success = deleteAttendance(id);
    if (success) {
      setAttendances(prev => prev.filter(a => a.id !== id));
    }
    return success;
  };

  const getTodayStats = (schoolId?: string, studentIds?: string[], staffIds?: string[]): AttendanceStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filtered = getAttendanceByDate(today);
    
    if (schoolId) {
      filtered = filtered.filter(a => a.schoolId === schoolId);
    }
    
    if (studentIds && studentIds.length > 0) {
      filtered = filtered.filter(a => a.studentId && studentIds.includes(a.studentId));
    }
    
    if (staffIds && staffIds.length > 0) {
      filtered = filtered.filter(a => a.staffId && staffIds.includes(a.staffId));
    }

    const present = filtered.filter(a => a.status === 'Present').length;
    const absent = filtered.filter(a => a.status === 'Absent').length;
    const late = filtered.filter(a => a.status === 'Late').length;
    const total = filtered.length;
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      presentPercentage,
    };
  };

  const getPersonAttendance = (personId: string, type: 'student' | 'staff'): Attendance[] => {
    if (type === 'student') {
      return getAttendanceByStudent(personId);
    }
    return getAttendanceByStaff(personId);
  };

  const getPersonAttendanceStats = (personId: string, type: 'student' | 'staff'): AttendanceStats => {
    const personAttendances = getPersonAttendance(personId, type);
    
    const present = personAttendances.filter(a => a.status === 'Present').length;
    const absent = personAttendances.filter(a => a.status === 'Absent').length;
    const late = personAttendances.filter(a => a.status === 'Late').length;
    const total = personAttendances.length;
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      presentPercentage,
    };
  };

  const getAttendanceForDate = (date: Date, schoolId?: string): Attendance[] => {
    let filtered = getAttendanceByDate(date);
    
    if (schoolId) {
      filtered = filtered.filter(a => a.schoolId === schoolId);
    }
    
    return filtered;
  };

  const getPersonAttendanceForDate = (
    date: Date,
    studentId?: string,
    staffId?: string
  ): Attendance | null => {
    return getAttendanceByDateAndPerson(date, studentId, staffId);
  };

  return {
    attendances,
    loading,
    markAttendance: markAttendanceRecord,
    updateAttendance: updateAttendanceById,
    deleteAttendance: removeAttendance,
    getTodayStats,
    getPersonAttendance,
    getPersonAttendanceStats,
    getAttendanceForDate,
    getPersonAttendanceForDate,
    refresh: () => {
      setAttendances(getAttendances());
    },
  };
}
