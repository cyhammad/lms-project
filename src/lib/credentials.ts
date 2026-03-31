// Predefined user credentials for authentication
// In production, this would be stored securely on the backend

import type { User, UserRole } from '@/types';

export interface UserCredentials {
  email: string;
  password: string;
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
}

// Predefined users with their credentials
export const PREDEFINED_USERS: UserCredentials[] = [
  {
    email: 'superadmin@lms.com',
    password: 'superadmin123',
    userData: {
      userId: 'user-superadmin',
      email: 'superadmin@lms.com',
      name: 'Super Admin',
      role: 'super_admin' as UserRole,
      // super_admin doesn't need schoolId
    },
  },
  {
    email: 'admin@school1.com',
    password: 'admin123',
    userData: {
      userId: 'user-admin-school1',
      email: 'admin@school1.com',
      name: 'Umer Iqbal',
      role: 'admin' as UserRole,
      schoolId: 'school-1',
    },
  },
  {
    email: 'manager@school1.com',
    password: 'manager123',
    userData: {
      userId: 'user-manager-school1',
      email: 'manager@school1.com',
      name: 'School Manager',
      role: 'manager' as UserRole,
      schoolId: 'school-1',
    },
  },
  {
    email: 'teacher@school1.com',
    password: 'teacher123',
    userData: {
      userId: 'user-teacher-school1',
      email: 'teacher@school1.com',
      name: 'John Teacher',
      role: 'teacher' as UserRole,
      schoolId: 'school-1',
    },
  },
  {
    email: 'student@school1.com',
    password: 'student123',
    userData: {
      userId: 'user-student-school1',
      email: 'student@school1.com',
      name: 'Jane Student',
      role: 'student' as UserRole,
      schoolId: 'school-1',
    },
  },
  {
    email: 'parent@school1.com',
    password: 'parent123',
    userData: {
      userId: 'user-parent-school1',
      email: 'parent@school1.com',
      name: 'Parent User',
      role: 'parent' as UserRole,
      schoolId: 'school-1',
      parentType: 'mother',
      studentId: 'student-1',
    },
  },
];

/**
 * Authenticate user by email and password
 * Returns user data if credentials match, null otherwise
 */
export function authenticateUser(email: string, password: string): UserCredentials | null {
  const user = PREDEFINED_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  return user || null;
}

/**
 * Get user credentials by email
 */
export function getUserByEmail(email: string): UserCredentials | null {
  const user = PREDEFINED_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  return user || null;
}
