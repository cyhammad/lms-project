'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';
import type { StudentFeePayment, StaffSalaryPayment } from '@/types';

type ApiResponse<T = unknown> =
  | { data: T; error?: never }
  | { data?: never; error: { message?: string } };

// ================= Fees Actions =================

export async function generateFees(data: {
  feeType: string;
  amount: number;
  month: number;
  year: number;
  dueDate: string;
  notes?: string;
  studentId?: string;
  sectionId?: string;
  classId?: string;
}) {
  const response = await apiServer<ApiResponse>('/fees/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.error) {
    return { success: false, error: response.error.message || 'Failed to generate fees' };
  }

  revalidatePath('/admin/finance/fees');
  return { success: true, data: response.data };
}

export async function updateFee(id: string, data: {
  status?: string;
  paidAmount?: number;
  paymentDate?: string;
  notes?: string;
  discountAmount?: number;
}) {
  const response = await apiServer<ApiResponse>(`/fees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (response.error) {
    return { success: false, error: response.error.message || 'Failed to update fee' };
  }

  revalidatePath('/admin/finance/fees');
  return { success: true, data: response.data };
}

// ================= Salaries Actions =================

export async function generateSalaries(data: {
  month: number;
  year: number;
  dueDate: string;
  staffId?: string;
}) {
  const response = await apiServer<ApiResponse>('/salaries/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.error) {
    return { success: false, error: response.error.message || 'Failed to generate salaries' };
  }

  revalidatePath('/admin/finance/salaries');
  return { success: true, data: response.data };
}

export async function updateSalary(id: string, data: {
  status?: string;
  paidAmount?: number;
  paymentDate?: string;
  deductions?: number;
  notes?: string;
}) {
  const response = await apiServer<ApiResponse>(`/salaries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (response.error) {
    return { success: false, error: response.error.message || 'Failed to update salary' };
  }

  revalidatePath('/admin/finance/salaries');
  return { success: true, data: response.data };
}
