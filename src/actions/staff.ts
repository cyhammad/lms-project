'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function createStaff(data: any) {
  try {
    const payload = {
      ...data,
      experience: data.experience ? Number(data.experience) : undefined,
      monthlySalary: data.monthlySalary ? Number(data.monthlySalary) : undefined,
    };

    const result = await apiServer<{ staff: { id: string } }>('/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/staff');
    return { success: true, staffId: result.staff.id };
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return { error: error.message || 'Failed to create staff member' };
  }
}

export async function updateStaff(id: string, data: any) {
  try {
    const payload = {
      ...data,
      experience: data.experience ? Number(data.experience) : undefined,
      monthlySalary: data.monthlySalary ? Number(data.monthlySalary) : undefined,
    };

    await apiServer(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/staff');
    revalidatePath(`/admin/staff/${id}`);
    revalidatePath(`/admin/staff/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return { error: error.message || 'Failed to update staff member' };
  }
}

export async function deleteStaff(id: string) {
  try {
    await apiServer(`/staff/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/staff');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    return { error: error.message || 'Failed to delete staff member' };
  }
}
