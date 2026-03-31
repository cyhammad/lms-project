import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Check, Crown, Layers, LayoutGrid } from 'lucide-react';
import { getCurrentUser } from '@/lib/session';
import { apiServer } from '@/lib/api-server';
import { ROUTES } from '@/constants/routes';
import type {
  SchoolPendingSubscriptionUpgrade,
  SubscriptionEffectiveForSchool,
  SubscriptionTierCatalogEntry,
} from '@/types/subscription';
import { cn } from '@/lib/utils';
import { getTierPerksForDisplay } from '@/lib/subscription-tier-perks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionPlansClient } from './subscription-plans-client';

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  let effective: SubscriptionEffectiveForSchool | null = null;
  let catalogTiers: SubscriptionTierCatalogEntry[] = [];
  try {
    effective = await apiServer<SubscriptionEffectiveForSchool>(
      '/subscription/me/effective?surface=SCHOOL_ADMIN'
    );
  } catch {
    effective = null;
  }
  try {
    const box = await apiServer<{ tiers: SubscriptionTierCatalogEntry[] }>('/subscription/tiers/catalog');
    catalogTiers = box.tiers ?? [];
  } catch {
    catalogTiers = [];
  }

  const roleUpper = String(user.role ?? '').toUpperCase();
  const canSelfServeUpgrade = roleUpper === 'ADMIN' || roleUpper === 'MANAGER';

  let pendingRequest: SchoolPendingSubscriptionUpgrade | null = null;
  if (canSelfServeUpgrade) {
    try {
      const pr = await apiServer<{ pending: SchoolPendingSubscriptionUpgrade | null }>(
        '/subscription/me/subscription-upgrade-requests'
      );
      pendingRequest = pr.pending ?? null;
    } catch {
      pendingRequest = null;
    }
  }

  const tier = effective?.tier;
  const heroPerks = getTierPerksForDisplay(tier?.slug, tier?.description ?? null);
  const modules = effective?.modules ?? [];
  const enabledModules = modules.filter((m) => m.canView);

  return (
    <div className="relative mx-auto max-w-4xl space-y-8 pb-4">
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-80 w-80 rounded-full bg-slate-800/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-48 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" aria-hidden />

      <div>
        <Link
          href={ROUTES.ADMIN.DASHBOARD}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-800 transition-colors',
            'hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2',
            '-ml-2'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_12px_40px_-12px_rgb(15_23_42/0.1)] ring-1 ring-slate-700/[0.05] sm:p-9">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-slate-100/60 blur-2xl" aria-hidden />
        <div className="absolute bottom-0 left-0 h-32 w-64 rounded-full bg-slate-100/80 blur-2xl" aria-hidden />
        <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
          <div className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800 text-white shadow-lg shadow-slate-700/25">
            <Crown className="h-9 w-9" aria-hidden />
          </div>
          <div className="mt-5 min-w-0 flex-1 sm:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              Your subscription
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {tier?.name ?? 'Plan not assigned'}
            </h1>
            {tier?.slug && (
              <p className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800">
                {tier.slug}
              </p>
            )}
            {heroPerks.length > 0 ? (
              <ul className="mt-4 space-y-2.5 text-left text-sm leading-relaxed text-slate-800 sm:text-[15px]">
                {heroPerks.map((perk, i) => (
                  <li key={`hero-perk-${i}`} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800">
                      <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                    </span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-800">
              Feature access for <span className="font-semibold text-slate-800">{effective?.schoolName ?? 'your school'}</span>{' '}
              in the admin panel follows the plan below.{' '}
              {canSelfServeUpgrade
                ? 'To move up, submit a request for a higher plan; a platform administrator must approve it before your modules update.'
                : 'To change tiers, use the platform admin tools or contact support.'}
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_8px_30px_-8px_rgb(15_23_42/0.08)]">
        <CardHeader className="border-b border-slate-100/90 bg-slate-50/50">
          <CardTitle className="flex items-center gap-2.5 text-lg text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 text-white shadow-md shadow-slate-700/20">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </span>
            Available plans
          </CardTitle>
          <CardDescription>
            All published tiers. Your current plan is highlighted. Higher tiers show a request button; approval is required before your school moves up
            {canSelfServeUpgrade ? '' : ' (only admins and managers can submit requests)'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <SubscriptionPlansClient
            tiers={catalogTiers}
            currentTierId={tier?.id ?? null}
            currentSortOrder={tier?.sortOrder ?? null}
            canSelfServeUpgrade={canSelfServeUpgrade}
            pendingRequest={pendingRequest}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 shadow-[0_8px_30px_-8px_rgb(15_23_42/0.08)]">
        <CardHeader className="border-b border-slate-100/90 bg-slate-50/50">
          <CardTitle className="flex items-center gap-2.5 text-lg text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 text-white shadow-md shadow-slate-700/15">
              <Layers className="h-5 w-5" aria-hidden />
            </span>
            Included modules
          </CardTitle>
          <CardDescription>
            {enabledModules.length} of {modules.length} school admin modules are enabled for your current plan
            (view access).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {modules.length === 0 ? (
            <p className="text-sm text-slate-700">No module data could be loaded.</p>
          ) : (
            <ul className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto pr-1 text-sm">
              {modules.map((m) => (
                <li
                  key={m.moduleKey}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${m.canView
                    ? 'border-slate-200/70 bg-slate-50/40 text-slate-800'
                    : 'border-slate-100 bg-slate-50/60 text-slate-800'
                    }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {m.canView ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-slate-700">
                        <span className="text-[10px] font-bold">—</span>
                      </span>
                    )}
                    <span className="truncate font-medium">{m.label}</span>
                  </span>
                  <span
                    className={`shrink-0 text-xs font-semibold tabular-nums ${m.canView ? 'text-slate-700' : 'text-slate-800'
                      }`}
                  >
                    {m.canView ? 'Included' : 'Not included'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-700">
        Account settings are still available from your profile in the top bar.
      </p>
    </div>
  );
}
