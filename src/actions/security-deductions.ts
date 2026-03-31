'use server';

import { revalidatePath } from 'next/cache';
import { apiServer } from '@/lib/api-server';

type ApiResponse =
  | { data?: unknown; error?: never }
  | { data?: never; error: { message?: string } };

export async function returnSecurityDeductions(staffId: string) {
  try {
    const response = await apiServer<ApiResponse>(`/staff/${staffId}/return-security`, {
      method: 'POST',
    });

    if (response && response.error) {
       return { error: response.error };
    }

    revalidatePath(`/admin/staff/${staffId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error returning security deductions:', error);
    return { error: error.message || 'Failed to return security deductions' };
  }
}
