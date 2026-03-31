'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';
import type { Student } from '@/types';

export async function createStudent(data: any): Promise<{ success: boolean; student?: Student; error?: string }> {
  try {
    // Ensure numeric values are numbers
    const payload = {
      ...data,
      fatherMonthlyIncome: data.fatherMonthlyIncome ? Number(data.fatherMonthlyIncome) : undefined,
      admissionFee: data.admissionFee ? Number(data.admissionFee) : undefined,
      discountedFee: data.discountedFee ? Number(data.discountedFee) : undefined,
    };

    const response = await apiServer<{ student: Student }>('/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/students');
    return { success: true, student: response.student };
  } catch (error: any) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message || 'Failed to create student' };
  }
}

export interface BulkStudentRow {
  firstName: string;
  lastName: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  academicSession: string;
  classApplyingFor: string;
  sectionId?: string;
  bFormCrc?: string;
  nationality?: string;
  religion?: string;
  placeOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export interface BulkCreateResult {
  total: number;
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function bulkCreateStudents(
  students: BulkStudentRow[]
): Promise<{ success: boolean; data?: BulkCreateResult; error?: string }> {
  try {
    const response = await apiServer<BulkCreateResult>('/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students }),
    });
    revalidatePath('/admin/students');
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Error bulk creating students:', error);
    return { success: false, error: error.message || 'Failed to bulk create students' };
  }
}

export async function deleteStudent(id: string) {
  try {
    await apiServer(`/students/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/students');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return { error: error.message || 'Failed to delete student' };
  }

}

export async function updateStudent(id: string, data: any) {
  try {
    // Ensure numeric values are numbers
    const payload = {
      ...data,
      fatherMonthlyIncome: data.fatherMonthlyIncome ? Number(data.fatherMonthlyIncome) : undefined,
      admissionFee: data.admissionFee ? Number(data.admissionFee) : undefined,
      discountedFee: data.discountedFee ? Number(data.discountedFee) : undefined,
    };

    await apiServer(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/students');
    revalidatePath(`/admin/students/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating student:', error);
    return { error: error.message || 'Failed to update student' };
  }
}
