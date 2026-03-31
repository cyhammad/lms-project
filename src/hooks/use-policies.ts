'use client';

import { useState, useEffect } from 'react';
import type { SecurityDeductionPolicy, LeaveDeductionPolicy } from '@/types';
import {
  getSecurityDeductionPolicies,
  addSecurityDeductionPolicy,
  updateSecurityDeductionPolicy,
  deleteSecurityDeductionPolicy,
  getActiveSecurityDeductionPolicy,
  getLeaveDeductionPolicies,
  addLeaveDeductionPolicy,
  updateLeaveDeductionPolicy,
  deleteLeaveDeductionPolicy,
  getActiveLeaveDeductionPolicy,
} from '@/lib/policy-storage';

export function usePolicies(schoolId?: string) {
  const [securityPolicies, setSecurityPolicies] = useState<SecurityDeductionPolicy[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<LeaveDeductionPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPolicies = () => {
      setLoading(true);
      const security = getSecurityDeductionPolicies(schoolId);
      const leave = getLeaveDeductionPolicies(schoolId);
      setSecurityPolicies(security);
      setLeavePolicies(leave);
      setLoading(false);
    };

    loadPolicies();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_security_deduction_policies' || e.key === 'edflo_leave_deduction_policies') {
        loadPolicies();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [schoolId]);

  // Security Deduction Policy methods
  const createSecurityPolicy = (policyData: Omit<SecurityDeductionPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPolicy = addSecurityDeductionPolicy(policyData);
    setSecurityPolicies(prev => [...prev, newPolicy]);
    return newPolicy;
  };

  const updateSecurityPolicy = (id: string, updates: Partial<SecurityDeductionPolicy>) => {
    const updated = updateSecurityDeductionPolicy(id, updates);
    if (updated) {
      setSecurityPolicies(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  const removeSecurityPolicy = (id: string) => {
    const success = deleteSecurityDeductionPolicy(id);
    if (success) {
      setSecurityPolicies(prev => prev.filter(p => p.id !== id));
    }
    return success;
  };

  const getActiveSecurityPolicy = () => {
    return schoolId ? getActiveSecurityDeductionPolicy(schoolId) : null;
  };

  // Leave Deduction Policy methods
  const createLeavePolicy = (policyData: Omit<LeaveDeductionPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPolicy = addLeaveDeductionPolicy(policyData);
    setLeavePolicies(prev => [...prev, newPolicy]);
    return newPolicy;
  };

  const updateLeavePolicy = (id: string, updates: Partial<LeaveDeductionPolicy>) => {
    const updated = updateLeaveDeductionPolicy(id, updates);
    if (updated) {
      setLeavePolicies(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  const removeLeavePolicy = (id: string) => {
    const success = deleteLeaveDeductionPolicy(id);
    if (success) {
      setLeavePolicies(prev => prev.filter(p => p.id !== id));
    }
    return success;
  };

  const getActiveLeavePolicy = () => {
    return schoolId ? getActiveLeaveDeductionPolicy(schoolId) : null;
  };

  return {
    securityPolicies,
    leavePolicies,
    loading,
    createSecurityPolicy,
    updateSecurityPolicy,
    removeSecurityPolicy,
    getActiveSecurityPolicy,
    createLeavePolicy,
    updateLeavePolicy,
    removeLeavePolicy,
    getActiveLeavePolicy,
    refresh: () => {
      setSecurityPolicies(getSecurityDeductionPolicies(schoolId));
      setLeavePolicies(getLeaveDeductionPolicies(schoolId));
    },
  };
}
