// Authentication utilities

import type { User, Session } from '@/types';
import { authenticateUser } from './credentials';
import { getUserById, getUsers, addUser } from './user-storage';
import { getSchoolById, initializePredefinedSchool } from './storage';
import { initializeSchoolData } from './initialize-school-data';

const SESSION_STORAGE_KEY = 'edflo_session';

/**
 * Login user with email and password
 * Returns session if credentials are valid, null otherwise
 */
export function login(email: string, password: string): Session | null {
  const credentials = authenticateUser(email, password);
  
  if (!credentials) {
    return null;
  }

  // Check if user exists in storage, if not create one
  const existingUsers = getUsers();
  let user = existingUsers.find((u: User) => u.email === credentials.email);
  
  if (!user) {
    // Create user in storage
    user = addUser(credentials.userData);
  }

  // Initialize predefined school if user has schoolId and school doesn't exist
  if (user.schoolId) {
    initializePredefinedSchool(user.schoolId);
    
    // Initialize school data (sessions, classes, students, etc.) for school-1 on first login
    if (user.schoolId === 'school-1') {
      initializeSchoolData();
    }
  }

  // Get school if user has schoolId
  const school = user.schoolId ? (getSchoolById(user.schoolId) ?? undefined) : undefined;

  // Create session
  const session: Session = {
    user,
    school,
    accessToken: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    refreshToken: `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  // Save session to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Logout current user
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Get current session from storage
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      logout();
      return null;
    }
    
    // Convert date strings back to Date objects
    return {
      ...session,
      user: {
        ...session.user,
        createdAt: new Date(session.user.createdAt),
        updatedAt: new Date(session.user.updatedAt),
      },
      expiresAt: new Date(session.expiresAt),
      school: session.school ? {
        ...session.school,
        createdAt: new Date(session.school.createdAt),
        updatedAt: new Date(session.school.updatedAt),
      } : undefined,
    };
  } catch (error) {
    console.error('Error reading session from localStorage:', error);
    return null;
  }
}

/**
 * Check if user has required permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true;
  
  return user.permissions?.includes(permission as any) ?? false;
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, role: string | string[]): boolean {
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

/**
 * Get redirect route based on user role
 */
export function getRedirectRoute(role: string): string {
  const roleRoutes: Record<string, string> = {
    super_admin: '/super-admin',
    admin: '/admin', // You can add admin routes later
    manager: '/manager', // You can add manager routes later
    teacher: '/teacher', // You can add teacher routes later
    student: '/student', // You can add student routes later
    parent: '/parent', // You can add parent routes later
  };
  
  return roleRoutes[role] || '/login';
}
