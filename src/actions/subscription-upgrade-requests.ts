'use server';

import { revalidatePath } from 'next/cache';
import { apiServer } from '@/lib/api-server';
import type { SubscriptionUpgradeRequestRow } from '@/types/subscription';

export async function approveSubscriptionUpgradeRequestAction(requestId: string): Promise<
  { success: true; request: SubscriptionUpgradeRequestRow } | { success: false; error: string }
> {
  try {
    const data = await apiServer<{ request: SubscriptionUpgradeRequestRow }>(
      `/subscription/upgrade-requests/${requestId}/approve`,
      { method: 'PATCH', body: JSON.stringify({}) }
    );
    revalidatePath('/super-admin/subscription-requests');
    return { success: true, request: data.request };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return { success: false, error: message };
  }
}

export async function rejectSubscriptionUpgradeRequestAction(
  requestId: string,
  rejectionReason?: string | null
): Promise<{ success: true; request: SubscriptionUpgradeRequestRow } | { success: false; error: string }> {
  try {
    const data = await apiServer<{ request: SubscriptionUpgradeRequestRow }>(
      `/subscription/upgrade-requests/${requestId}/reject`,
      {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason: rejectionReason?.trim() || null }),
      }
    );
    revalidatePath('/super-admin/subscription-requests');
    return { success: true, request: data.request };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return { success: false, error: message };
  }
}
