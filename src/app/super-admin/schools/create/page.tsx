import { apiServer } from '@/lib/api-server';
import type { SubscriptionTierSummary } from '@/types/subscription';
import CreateSchoolForm from './create-school-form';

export const dynamic = 'force-dynamic';

async function loadTiers(): Promise<SubscriptionTierSummary[]> {
  try {
    const data = await apiServer<{ tiers: SubscriptionTierSummary[] }>('/subscription/tiers');
    return data.tiers.filter((t) => t.isActive);
  } catch (e) {
    console.error('Failed to load subscription tiers for create school:', e);
    return [];
  }
}

export default async function CreateSchoolPage() {
  const tiers = await loadTiers();
  return <CreateSchoolForm initialTiers={tiers} />;
}
