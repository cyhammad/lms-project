'use client';

import { useEffect, useState } from 'react';
import type { LeaveDeductionPolicy, LeaveDeductionType } from '@/types';
import { apiClient } from '@/lib/api-client';

type BackendLeaveDeductionType = 'FIXED' | 'PERCENTAGE';

interface BackendLeavePolicy {
  id: string;
  schoolId: string;
  deductionType: BackendLeaveDeductionType;
  deductionValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const toFrontendLeaveType = (type: BackendLeaveDeductionType): LeaveDeductionType =>
  type.toLowerCase() as LeaveDeductionType;

const toBackendLeaveType = (type: LeaveDeductionType): BackendLeaveDeductionType =>
  type.toUpperCase() as BackendLeaveDeductionType;

const mapBackendLeavePolicy = (policy: BackendLeavePolicy): LeaveDeductionPolicy => ({
  id: policy.id,
  schoolId: policy.schoolId,
  deductionType: toFrontendLeaveType(policy.deductionType),
  deductionValue: policy.deductionValue,
  isActive: policy.isActive,
  createdAt: new Date(policy.createdAt),
  updatedAt: new Date(policy.updatedAt),
});

export function useLeavePolicies(schoolId?: string) {
  const [leavePolicies, setLeavePolicies] = useState<LeaveDeductionPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPolicies = async () => {
    // Only load when we have a schoolId; backend uses the authenticated user's school
    if (!schoolId) {
      setLeavePolicies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { policies } = await apiClient<{ policies: BackendLeavePolicy[] }>('/policies/leave');
      setLeavePolicies(policies.map(mapBackendLeavePolicy));
    } catch (error) {
      console.error('Failed to load leave policies from backend:', error);
      setLeavePolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const createLeavePolicy = async (
    policyData: Omit<LeaveDeductionPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const payload = {
        deductionType: toBackendLeaveType(policyData.deductionType),
        deductionValue: policyData.deductionValue,
        isActive: policyData.isActive,
      };

      const { policy } = await apiClient<{ policy: BackendLeavePolicy }>('/policies/leave', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const mapped = mapBackendLeavePolicy(policy);
      setLeavePolicies((prev) => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      console.error('Failed to create leave policy:', error);
      return null;
    }
  };

  const updateLeavePolicy = async (
    id: string,
    updates: Partial<LeaveDeductionPolicy>
  ): Promise<LeaveDeductionPolicy | null> => {
    const existing = leavePolicies.find((p) => p.id === id);
    if (!existing) return null;

    const merged: LeaveDeductionPolicy = {
      ...existing,
      ...updates,
    };

    try {
      // Backend does not yet expose an update endpoint.
      // Emulate update as: create a new policy with updated values, then delete the old one.
      const createPayload = {
        deductionType: toBackendLeaveType(merged.deductionType),
        deductionValue: merged.deductionValue,
        isActive: merged.isActive,
      };

      const { policy: created } = await apiClient<{ policy: BackendLeavePolicy }>('/policies/leave', {
        method: 'POST',
        body: JSON.stringify(createPayload),
      });

      // Delete the old policy
      await apiClient(`/policies/leave/${id}`, {
        method: 'DELETE',
      });

      const mapped = mapBackendLeavePolicy(created);
      setLeavePolicies((prev) =>
        prev.map((p) => (p.id === id ? mapped : p))
      );

      return mapped;
    } catch (error) {
      console.error('Failed to update leave policy:', error);
      return null;
    }
  };

  const removeLeavePolicy = async (id: string): Promise<boolean> => {
    try {
      await apiClient(`/policies/leave/${id}`, {
        method: 'DELETE',
      });
      setLeavePolicies((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete leave policy:', error);
      return false;
    }
  };

  const getActiveLeavePolicy = () => {
    return leavePolicies.find((p) => p.isActive) || null;
  };

  return {
    leavePolicies,
    loading,
    createLeavePolicy,
    updateLeavePolicy,
    removeLeavePolicy,
    getActiveLeavePolicy,
    refresh: () => loadPolicies(),
  };
}

