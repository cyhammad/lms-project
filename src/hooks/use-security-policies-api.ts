'use client';

import { useEffect, useState } from 'react';
import type { SecurityDeductionPolicy, SecurityDeductionType } from '@/types';
import { apiClient } from '@/lib/api-client';

type BackendSecurityDeductionType = 'HALF' | 'QUARTER' | 'PERCENTAGE';

interface BackendSecurityPolicy {
  id: string;
  schoolId: string;
  deductionType: BackendSecurityDeductionType;
  deductionValue: number;
  durationMonths: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const toFrontendSecurityType = (
  type: BackendSecurityDeductionType
): SecurityDeductionType => type.toLowerCase() as SecurityDeductionType;

const toBackendSecurityType = (
  type: SecurityDeductionType
): BackendSecurityDeductionType =>
  type.toUpperCase() as BackendSecurityDeductionType;

const mapBackendSecurityPolicy = (
  policy: BackendSecurityPolicy
): SecurityDeductionPolicy => ({
  id: policy.id,
  schoolId: policy.schoolId,
  deductionType: toFrontendSecurityType(policy.deductionType),
  deductionValue: policy.deductionValue,
  durationMonths: policy.durationMonths,
  isActive: policy.isActive,
  createdAt: new Date(policy.createdAt),
  updatedAt: new Date(policy.updatedAt),
});

export function useSecurityPolicies(schoolId?: string) {
  const [securityPolicies, setSecurityPolicies] = useState<SecurityDeductionPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPolicies = async () => {
    if (!schoolId) {
      setSecurityPolicies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { policies } = await apiClient<{ policies: BackendSecurityPolicy[] }>(
        '/policies/security'
      );
      setSecurityPolicies(policies.map(mapBackendSecurityPolicy));
    } catch (error) {
      console.error('Failed to load security policies from backend:', error);
      setSecurityPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const createSecurityPolicy = async (
    policyData: Omit<SecurityDeductionPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const payload = {
        deductionType: toBackendSecurityType(policyData.deductionType),
        deductionValue: policyData.deductionValue,
        durationMonths: policyData.durationMonths,
        isActive: policyData.isActive,
      };

      const { policy } = await apiClient<{ policy: BackendSecurityPolicy }>(
        '/policies/security',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      const mapped = mapBackendSecurityPolicy(policy);
      setSecurityPolicies((prev) => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      console.error('Failed to create security policy:', error);
      return null;
    }
  };

  const updateSecurityPolicy = async (
    id: string,
    updates: Partial<SecurityDeductionPolicy>
  ): Promise<SecurityDeductionPolicy | null> => {
    const existing = securityPolicies.find((p) => p.id === id);
    if (!existing) return null;

    const merged: SecurityDeductionPolicy = {
      ...existing,
      ...updates,
    };

    try {
      // Backend does not yet expose an update endpoint.
      // Emulate update as: create a new policy with updated values, then delete the old one.
      const createPayload = {
        deductionType: toBackendSecurityType(merged.deductionType),
        deductionValue:
          merged.deductionType === 'percentage' ? merged.deductionValue : 0,
        durationMonths: merged.durationMonths,
        isActive: merged.isActive,
      };

      const { policy: created } = await apiClient<{ policy: BackendSecurityPolicy }>(
        '/policies/security',
        {
          method: 'POST',
          body: JSON.stringify(createPayload),
        }
      );

      await apiClient(`/policies/security/${id}`, {
        method: 'DELETE',
      });

      const mapped = mapBackendSecurityPolicy(created);
      setSecurityPolicies((prev) =>
        prev.map((p) => (p.id === id ? mapped : p))
      );

      return mapped;
    } catch (error) {
      console.error('Failed to update security policy:', error);
      return null;
    }
  };

  const removeSecurityPolicy = async (id: string): Promise<boolean> => {
    try {
      await apiClient(`/policies/security/${id}`, {
        method: 'DELETE',
      });
      setSecurityPolicies((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete security policy:', error);
      return false;
    }
  };

  const getActiveSecurityPolicy = () => {
    return securityPolicies.find((p) => p.isActive) || null;
  };

  return {
    securityPolicies,
    loading,
    createSecurityPolicy,
    updateSecurityPolicy,
    removeSecurityPolicy,
    getActiveSecurityPolicy,
    refresh: () => loadPolicies(),
  };
}

