'use server';

import { apiServer } from '@/lib/api-server';
import { UserPermission } from '@/types';

export async function getDefaultPermissions() {
  try {
    const data = await apiServer<UserPermission[]>('/permissions/defaults');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching default permissions:', error);
    return { error: error.message || 'Failed to fetch default permissions' };
  }
}
