// Role-based access control constants

import type { UserRole, Permission } from '@/types';

export const ROLES: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'schools.create',
    'schools.read',
    'schools.update',
    'schools.delete',
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'settings.update',
  ],
  admin: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'students.create',
    'students.read',
    'students.update',
    'students.delete',
    'classes.create',
    'classes.read',
    'classes.update',
    'classes.delete',
    'reports.read',
    'settings.update',
  ],
  manager: [
    'students.read',
    'students.update',
    'classes.read',
    'classes.update',
    'reports.read',
  ],
  teacher: [
    'students.read',
    'classes.read',
    'classes.update',
  ],
  student: [
    'students.read',
  ],
  parent: [
    'students.read',
  ],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};
