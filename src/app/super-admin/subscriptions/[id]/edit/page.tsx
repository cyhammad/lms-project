import { notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import type { SubscriptionModule, SubscriptionTierDetail } from '@/types/subscription';
import EditTierClient from './edit-tier-client';

export const dynamic = 'force-dynamic';

export default async function EditSubscriptionTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const [tierRes, modulesRes] = await Promise.all([
      apiServer<{ tier: SubscriptionTierDetail }>(`/subscription/tiers/${id}`),
      apiServer<{ modules: SubscriptionModule[] }>('/subscription/modules'),
    ]);
    return <EditTierClient initialTier={tierRes.tier} modules={modulesRes.modules} />;
  } catch {
    notFound();
  }
}
