'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, Check, Clock, Loader2, Sparkles } from 'lucide-react';
import { requestSubscriptionTierUpgrade } from '@/actions/subscription-school';
import type { SchoolPendingSubscriptionUpgrade, SubscriptionTierCatalogEntry } from '@/types/subscription';
import { getTierPerksForDisplay } from '@/lib/subscription-tier-perks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  tiers: SubscriptionTierCatalogEntry[];
  currentTierId: string | null;
  currentSortOrder: number | null;
  canSelfServeUpgrade: boolean;
  pendingRequest: SchoolPendingSubscriptionUpgrade | null;
};

export function SubscriptionPlansClient({
  tiers,
  currentTierId,
  currentSortOrder,
  canSelfServeUpgrade,
  pendingRequest,
}: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentOrder = currentSortOrder ?? -1;

  async function handleRequestUpgrade(tierId: string) {
    setError(null);
    setPendingId(tierId);
    const result = await requestSubscriptionTierUpgrade(tierId);
    setPendingId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (tiers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-700">
          <Sparkles className="h-6 w-6" aria-hidden />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-800">No plans to show yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-700">
          Published subscription tiers will appear here. Contact support if you need a different plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pendingRequest && canSelfServeUpgrade && (
        <div className="flex gap-3.5 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-amber-50/40 px-4 py-3.5 text-sm shadow-sm shadow-amber-500/5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Clock className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="font-semibold text-amber-950">Upgrade request pending approval</p>
            <p className="mt-1.5 leading-relaxed text-amber-950/85">
              Your school has requested <span className="font-semibold text-amber-950">{pendingRequest.requestedTier.name}</span>. A
              platform administrator must approve it before your plan changes. You can change the requested plan by
              submitting another request for a different tier.
            </p>
          </div>
        </div>
      )}
      {error && (
        <div
          className="flex gap-3 rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}
      <ul className="grid gap-5 sm:grid-cols-2">
        {tiers.map((tier) => {
          const isCurrent = tier.id === currentTierId;
          const isUpgrade = tier.sortOrder > currentOrder;
          const isLower = tier.sortOrder < currentOrder;
          const isPendingTarget = pendingRequest?.requestedTierId === tier.id;
          const showRequestCta = canSelfServeUpgrade && isUpgrade;
          const perks = getTierPerksForDisplay(tier.slug, tier.description);

          return (
            <li key={tier.id}>
              <Card
                className={cn(
                  'h-full overflow-hidden border-slate-200/80 shadow-[0_8px_28px_-10px_rgb(15_23_42/0.12)] transition-shadow duration-200 hover:shadow-[0_12px_36px_-12px_rgb(15_23_42/0.14)]',
                  isCurrent && 'ring-2 ring-slate-700/35',
                  isPendingTarget && 'ring-2 ring-amber-400/45'
                )}
              >
                <div
                  className={cn(
                    'h-1 w-full',
                    isCurrent && 'bg-gradient-to-r from-slate-800 to-slate-800',
                    isPendingTarget && !isCurrent && 'bg-gradient-to-r from-amber-400 to-amber-500',
                    !isCurrent && !isPendingTarget && 'bg-gradient-to-r from-slate-200 to-slate-300'
                  )}
                  aria-hidden
                />
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg text-slate-900">{tier.name}</CardTitle>
                    {isCurrent && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        Current
                      </span>
                    )}
                    {isPendingTarget && !isCurrent && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        Awaiting approval
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-800">
                    {tier.slug}
                  </CardDescription>
                  {perks.length > 0 ? (
                    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-800">
                      {perks.map((perk, i) => (
                        <li key={`${tier.id}-perk-${i}`} className="flex gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-800">
                            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                          </span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardHeader>
                <CardContent className="pb-4">
                  {isLower && !isCurrent && (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-800">
                      Lower tier than your school&apos;s current plan. To switch down, contact support.
                    </p>
                  )}
                  {isCurrent && (
                    <p className="text-xs font-medium text-slate-800/90">This is your school&apos;s active plan.</p>
                  )}
                </CardContent>
                <CardFooter className="border-t border-slate-100/90 bg-slate-50/40 pt-4">
                  {showRequestCta && !isPendingTarget ? (
                    <Button
                      type="button"
                      className="w-full gap-2 shadow-md shadow-slate-700/15"
                      disabled={pendingId !== null}
                      onClick={() => handleRequestUpgrade(tier.id)}
                    >
                      {pendingId === tier.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Sending request…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" aria-hidden />
                          {pendingRequest ? 'Request this plan instead' : 'Request upgrade'}
                        </>
                      )}
                    </Button>
                  ) : isPendingTarget && canSelfServeUpgrade ? (
                    <p className="w-full text-center text-xs text-slate-800">
                      Waiting for super admin approval. Your modules stay on the current plan until then.
                    </p>
                  ) : isCurrent && canSelfServeUpgrade ? (
                    <p className="w-full text-center text-xs text-slate-700">You&apos;re already on this plan.</p>
                  ) : !canSelfServeUpgrade && (isUpgrade || isCurrent) ? (
                    <p className="w-full text-center text-xs text-slate-700">
                      Tier changes for your role are managed in the platform admin console.
                    </p>
                  ) : null}
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
