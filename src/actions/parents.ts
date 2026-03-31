'use server';

import { revalidatePath } from 'next/cache';
import { apiServer } from '@/lib/api-server';
import type { Parent } from '@/types';

interface CreateParentData {
  email?: string;
  username?: string;
  password?: string;
  name: string;
  phone?: string;
  cnic?: string;
  parentType?: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  occupation?: string;
  monthlyIncome?: number;
  guardianRelation?: string;
  studentIds?: string[];
}

interface UpdateParentData {
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  phone?: string;
  cnic?: string;
  parentType?: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  isActive?: boolean;
  studentIds?: string[];
}

export async function createParent(data: CreateParentData): Promise<{ success: boolean; parent?: Parent; error?: string }> {
  try {
    const result = await apiServer<{ parent: Parent }>('/parents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    revalidatePath('/admin/students');
    revalidatePath('/admin/parents');
    
    return { success: true, parent: result.parent };
  } catch (error) {
    console.error('Error creating parent:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create parent' };
  }
}

export async function updateParent(id: string, data: UpdateParentData): Promise<{ success: boolean; parent?: Parent; error?: string }> {
  try {
    const result = await apiServer<{ parent: Parent }>(`/parents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    revalidatePath('/admin/students');
    revalidatePath('/admin/parents');
    
    return { success: true, parent: result.parent };
  } catch (error) {
    console.error('Error updating parent:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update parent' };
  }
}

export async function deleteParent(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiServer(`/parents/${id}`, {
      method: 'DELETE',
    });
    
    revalidatePath('/admin/students');
    revalidatePath('/admin/parents');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting parent:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete parent' };
  }
}

export async function searchParents(query: string): Promise<{ success: boolean; parents?: Parent[]; error?: string }> {
  try {
    const result = await apiServer<{ parents: Parent[] }>(`/parents/search?q=${encodeURIComponent(query)}`);
    return { success: true, parents: result.parents };
  } catch (error) {
    console.error('Error searching parents:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to search parents' };
  }
}

export async function connectParentToStudent(parentId: string, studentId: string): Promise<{ success: boolean; parent?: Parent; error?: string }> {
  try {
    const result = await apiServer<{ parent: Parent }>('/parents/connect', {
      method: 'POST',
      body: JSON.stringify({ parentId, studentId }),
    });
    
    revalidatePath('/admin/students');
    revalidatePath('/admin/parents');
    
    return { success: true, parent: result.parent };
  } catch (error) {
    console.error('Error connecting parent to student:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to connect parent to student' };
  }
}
