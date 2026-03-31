'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';
import type { TeacherAttendanceRecord, TeacherAttendanceSettings } from '@/types';

export async function bulkMarkStudentAttendance(data: {
  date: string; // ISO date string
  sectionId: string;
  activeOnly?: boolean;
  defaultStatus?: string;
  students: {
    studentId: string;
    status: string; // 'Present' | 'Absent' | 'Late' | 'Leave'
    remarks?: string;
  }[];
}) {
  try {
    const dataResponse = await apiServer<{ attendance: unknown[] }>('/attendance/bulk-student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/attendance');
    return { success: true, data: dataResponse };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to mark attendance' };
  }
}

export async function markAttendance(data: {
  date: string;
  status: string;
  remarks?: string;
  studentId?: string;
  staffId?: string;
}) {
  try {
    const dataResponse = await apiServer<{ attendance: unknown }>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/attendance');
    return { success: true, data: dataResponse };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to mark attendance' };
  }
}

// --- Teacher attendance (mobile check-in system) ---

export async function getTeacherAttendance(params: {
  date?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const q = new URLSearchParams();
    if (params.date) q.set('date', params.date);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    const data = await apiServer<{ attendance: TeacherAttendanceRecord[] }>(
      `/attendance/teachers?${q.toString()}`
    );
    return { success: true, data: data?.attendance ?? [] };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch teacher attendance', data: [] };
  }
}

export async function getTeacherAttendanceSettings() {
  try {
    const data = await apiServer<{ settings: TeacherAttendanceSettings }>(
      '/attendance/teachers/settings'
    );
    return { success: true, data: data?.settings ?? null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch settings', data: null };
  }
}

export async function updateTeacherAttendanceSettings(settings: Partial<{
  attendanceStartTime: string;
  graceMinutes: number;
  absentCutoffTime: string;
  allowManualOverride: boolean;
  geoFencingEnabled: boolean;
  schoolLatitude: number | null;
  schoolLongitude: number | null;
  allowedRadiusMeters: number | null;
}>) {
  try {
    const data = await apiServer<{ settings: TeacherAttendanceSettings }>(
      '/attendance/teachers/settings',
      { method: 'PUT', body: JSON.stringify(settings) }
    );
    revalidatePath('/admin/attendance/teachers');
    return { success: true, data: data?.settings ?? null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update settings', data: null };
  }
}

export async function overrideTeacherAttendance(attendanceId: string, payload: {
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
  remarks?: string;
}) {
  try {
    const data = await apiServer<{ attendance: TeacherAttendanceRecord }>(
      `/attendance/teachers/${attendanceId}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
    revalidatePath('/admin/attendance/teachers');
    return { success: true, data: data?.attendance ?? null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to override attendance', data: null };
  }
}
