import { apiClient } from '@/lib/api-client';
import type { SubscriptionModule, SubscriptionTierDetail, SubscriptionTierSummary } from '@/types/subscription';

export async function fetchSubscriptionModules(): Promise<SubscriptionModule[]> {
  const data = await apiClient<{ modules: SubscriptionModule[] }>('/subscription/modules');
  return data.modules;
}

export async function fetchSubscriptionTiers(includeInactive = false): Promise<SubscriptionTierSummary[]> {
  const q = includeInactive ? '?includeInactive=true' : '';
  const data = await apiClient<{ tiers: SubscriptionTierSummary[] }>(`/subscription/tiers${q}`);
  return data.tiers;
}

export async function fetchSubscriptionTier(id: string): Promise<SubscriptionTierDetail> {
  const data = await apiClient<{ tier: SubscriptionTierDetail }>(`/subscription/tiers/${id}`);
  return data.tier;
}

export async function createSubscriptionTier(body: {
  slug: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<SubscriptionTierDetail> {
  const data = await apiClient<{ tier: SubscriptionTierDetail }>('/subscription/tiers', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.tier;
}

export async function updateSubscriptionTier(
  id: string,
  body: {
    name?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
): Promise<SubscriptionTierDetail> {
  const data = await apiClient<{ tier: SubscriptionTierDetail }>(`/subscription/tiers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return data.tier;
}

export async function deleteSubscriptionTier(id: string): Promise<void> {
  await apiClient(`/subscription/tiers/${id}`, { method: 'DELETE' });
}

export async function replaceTierPermissions(
  tierId: string,
  permissions: Array<{
    moduleKey: string;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>,
): Promise<SubscriptionTierDetail> {
  const data = await apiClient<{ tier: SubscriptionTierDetail }>(`/subscription/tiers/${tierId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
  return data.tier;
}
