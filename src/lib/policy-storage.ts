// Local storage utilities for policy data

import type { SecurityDeductionPolicy, LeaveDeductionPolicy } from '@/types';

// Security Deduction Policy Storage
const SECURITY_POLICY_STORAGE_KEY = 'edflo_security_deduction_policies';
const LEAVE_POLICY_STORAGE_KEY = 'edflo_leave_deduction_policies';

// Security Deduction Policies
export const getSecurityDeductionPolicies = (schoolId?: string): SecurityDeductionPolicy[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SECURITY_POLICY_STORAGE_KEY);
    if (!stored) return [];
    const policies = JSON.parse(stored);
    const parsed = policies.map((policy: any) => ({
      ...policy,
      createdAt: new Date(policy.createdAt),
      updatedAt: new Date(policy.updatedAt),
    }));
    return schoolId ? parsed.filter((p: SecurityDeductionPolicy) => p.schoolId === schoolId) : parsed;
  } catch (error) {
    console.error('Error reading security deduction policies from localStorage:', error);
    return [];
  }
};

export const saveSecurityDeductionPolicies = (policies: SecurityDeductionPolicy[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SECURITY_POLICY_STORAGE_KEY, JSON.stringify(policies));
  } catch (error) {
    console.error('Error saving security deduction policies to localStorage:', error);
  }
};

export const addSecurityDeductionPolicy = (policyData: Omit<SecurityDeductionPolicy, 'id' | 'createdAt' | 'updatedAt'>): SecurityDeductionPolicy => {
  const policies = getSecurityDeductionPolicies();
  
  // If this policy is being set as active, deactivate all other policies for the same school
  if (policyData.isActive) {
    policies.forEach(p => {
      if (p.schoolId === policyData.schoolId && p.isActive) {
        p.isActive = false;
        p.updatedAt = new Date();
      }
    });
  }
  
  const newPolicy: SecurityDeductionPolicy = {
    ...policyData,
    id: `security-policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  policies.push(newPolicy);
  saveSecurityDeductionPolicies(policies);
  return newPolicy;
};

export const updateSecurityDeductionPolicy = (id: string, updates: Partial<SecurityDeductionPolicy>): SecurityDeductionPolicy | null => {
  const policies = getSecurityDeductionPolicies();
  const index = policies.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  // If this policy is being set as active, deactivate all other policies for the same school
  if (updates.isActive === true) {
    const policy = policies[index];
    policies.forEach(p => {
      if (p.id !== id && p.schoolId === policy.schoolId && p.isActive) {
        p.isActive = false;
        p.updatedAt = new Date();
      }
    });
  }
  
  policies[index] = {
    ...policies[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveSecurityDeductionPolicies(policies);
  return policies[index];
};

export const deleteSecurityDeductionPolicy = (id: string): boolean => {
  const policies = getSecurityDeductionPolicies();
  const filtered = policies.filter(p => p.id !== id);
  if (filtered.length === policies.length) return false;
  
  saveSecurityDeductionPolicies(filtered);
  return true;
};

export const getSecurityDeductionPolicyById = (id: string): SecurityDeductionPolicy | null => {
  const policies = getSecurityDeductionPolicies();
  return policies.find(p => p.id === id) || null;
};

export const getActiveSecurityDeductionPolicy = (schoolId: string): SecurityDeductionPolicy | null => {
  const policies = getSecurityDeductionPolicies(schoolId);
  return policies.find(p => p.isActive) || null;
};

// Leave Deduction Policies
export const getLeaveDeductionPolicies = (schoolId?: string): LeaveDeductionPolicy[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(LEAVE_POLICY_STORAGE_KEY);
    if (!stored) return [];
    const policies = JSON.parse(stored);
    const parsed = policies.map((policy: any) => ({
      ...policy,
      createdAt: new Date(policy.createdAt),
      updatedAt: new Date(policy.updatedAt),
    }));
    return schoolId ? parsed.filter((p: LeaveDeductionPolicy) => p.schoolId === schoolId) : parsed;
  } catch (error) {
    console.error('Error reading leave deduction policies from localStorage:', error);
    return [];
  }
};

export const saveLeaveDeductionPolicies = (policies: LeaveDeductionPolicy[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LEAVE_POLICY_STORAGE_KEY, JSON.stringify(policies));
  } catch (error) {
    console.error('Error saving leave deduction policies to localStorage:', error);
  }
};

export const addLeaveDeductionPolicy = (policyData: Omit<LeaveDeductionPolicy, 'id' | 'createdAt' | 'updatedAt'>): LeaveDeductionPolicy => {
  const policies = getLeaveDeductionPolicies();
  
  // If this policy is being set as active, deactivate all other policies for the same school
  if (policyData.isActive) {
    policies.forEach(p => {
      if (p.schoolId === policyData.schoolId && p.isActive) {
        p.isActive = false;
        p.updatedAt = new Date();
      }
    });
  }
  
  const newPolicy: LeaveDeductionPolicy = {
    ...policyData,
    id: `leave-policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  policies.push(newPolicy);
  saveLeaveDeductionPolicies(policies);
  return newPolicy;
};

export const updateLeaveDeductionPolicy = (id: string, updates: Partial<LeaveDeductionPolicy>): LeaveDeductionPolicy | null => {
  const policies = getLeaveDeductionPolicies();
  const index = policies.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  // If this policy is being set as active, deactivate all other policies for the same school
  if (updates.isActive === true) {
    const policy = policies[index];
    policies.forEach(p => {
      if (p.id !== id && p.schoolId === policy.schoolId && p.isActive) {
        p.isActive = false;
        p.updatedAt = new Date();
      }
    });
  }
  
  policies[index] = {
    ...policies[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveLeaveDeductionPolicies(policies);
  return policies[index];
};

export const deleteLeaveDeductionPolicy = (id: string): boolean => {
  const policies = getLeaveDeductionPolicies();
  const filtered = policies.filter(p => p.id !== id);
  if (filtered.length === policies.length) return false;
  
  saveLeaveDeductionPolicies(filtered);
  return true;
};

export const getLeaveDeductionPolicyById = (id: string): LeaveDeductionPolicy | null => {
  const policies = getLeaveDeductionPolicies();
  return policies.find(p => p.id === id) || null;
};

export const getActiveLeaveDeductionPolicy = (schoolId: string): LeaveDeductionPolicy | null => {
  const policies = getLeaveDeductionPolicies(schoolId);
  return policies.find(p => p.isActive) || null;
};
