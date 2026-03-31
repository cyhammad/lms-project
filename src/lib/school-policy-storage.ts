// Local storage utilities for school policy data

import type { SchoolPolicy } from '@/types';

const STORAGE_KEY = 'edflo_school_policies';

export const getSchoolPolicies = (schoolId?: string): SchoolPolicy[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const policies = JSON.parse(stored);
    const parsed = policies.map((policy: any) => ({
      ...policy,
      createdAt: new Date(policy.createdAt),
      updatedAt: new Date(policy.updatedAt),
    }));
    return schoolId ? parsed.filter((p: SchoolPolicy) => p.schoolId === schoolId) : parsed;
  } catch (error) {
    console.error('Error reading school policies from localStorage:', error);
    return [];
  }
};

export const saveSchoolPolicies = (policies: SchoolPolicy[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  } catch (error) {
    console.error('Error saving school policies to localStorage:', error);
  }
};

export const addSchoolPolicy = (policyData: Omit<SchoolPolicy, 'id' | 'createdAt' | 'updatedAt'>): SchoolPolicy | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const policies = getSchoolPolicies();
    const newPolicy: SchoolPolicy = {
      ...policyData,
      id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    policies.push(newPolicy);
    saveSchoolPolicies(policies);
    return newPolicy;
  } catch (error) {
    console.error('Error adding school policy:', error);
    return null;
  }
};

export const updateSchoolPolicy = (id: string, updates: Partial<Omit<SchoolPolicy, 'id' | 'createdAt' | 'schoolId'>>): SchoolPolicy | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const policies = getSchoolPolicies();
    const index = policies.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    const updatedPolicy: SchoolPolicy = {
      ...policies[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    policies[index] = updatedPolicy;
    saveSchoolPolicies(policies);
    return updatedPolicy;
  } catch (error) {
    console.error('Error updating school policy:', error);
    return null;
  }
};

export const deleteSchoolPolicy = (id: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const policies = getSchoolPolicies();
    const filtered = policies.filter(p => p.id !== id);
    
    if (filtered.length === policies.length) return false;
    
    saveSchoolPolicies(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting school policy:', error);
    return false;
  }
};

export const getSchoolPolicyById = (id: string): SchoolPolicy | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const policies = getSchoolPolicies();
    return policies.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error getting school policy by id:', error);
    return null;
  }
};
