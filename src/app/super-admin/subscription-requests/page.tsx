import { apiServer } from '@/lib/api-server';
import type { SubscriptionUpgradeRequestRow } from '@/types/subscription';
import SubscriptionRequestsClient from './client';

export const dynamic = 'force-dynamic';

export default async function SubscriptionRequestsPage() {
  let requests: SubscriptionUpgradeRequestRow[] = [];
  try {
    const data = await apiServer<{ requests: SubscriptionUpgradeRequestRow[] }>(
      '/subscription/upgrade-requests?status=PENDING'
    );
    requests = data.requests ?? [];
  } catch (e) {
    console.error('Failed to load subscription upgrade requests:', e);
    requests = [];
  }

  return <SubscriptionRequestsClient initialRequests={requests} />;
}
