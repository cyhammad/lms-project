import { apiServer } from '@/lib/api-server';
import type { SubscriptionModule, SubscriptionTierSummary } from '@/types/subscription';
import SubscriptionsClient from './client';

export const dynamic = 'force-dynamic';

async function loadData(): Promise<{
  tiers: SubscriptionTierSummary[];
  moduleCount: number;
}> {
  try {
    const [tiersRes, modulesRes] = await Promise.all([
      apiServer<{ tiers: SubscriptionTierSummary[] }>('/subscription/tiers?includeInactive=true'),
      apiServer<{ modules: SubscriptionModule[] }>('/subscription/modules'),
    ]);
    return {
      tiers: tiersRes.tiers,
      moduleCount: modulesRes.modules.length,
    };
  } catch (e) {
    console.error('Subscriptions page load failed:', e);
    return { tiers: [], moduleCount: 0 };
  }
}

export default async function SubscriptionsPage() {
  const { tiers, moduleCount } = await loadData();

  return <SubscriptionsClient initialTiers={tiers} moduleCount={moduleCount} />;
}
