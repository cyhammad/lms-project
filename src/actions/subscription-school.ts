'use server';

import { revalidatePath } from 'next/cache';
import { apiServer } from '@/lib/api-server';
import type { SubscriptionUpgradeRequestRow } from '@/types/subscription';

export async function requestSubscriptionTierUpgrade(subscriptionTierId: string): Promise<
  { success: true; request: SubscriptionUpgradeRequestRow } | { success: false; error: string }
> {
  try {
    const data = await apiServer<{ request: SubscriptionUpgradeRequestRow }>(
      '/subscription/me/subscription-upgrade-requests',
      {
        method: 'POST',
        body: JSON.stringify({ subscriptionTierId }),
      }
    );
    revalidatePath('/admin/subscription');
    return { success: true, request: data.request };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return { success: false, error: message };
  }
}
