'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crown, LayoutDashboard, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_UPGRADE_MESSAGE } from '@/constants/subscription-messages';
import { ROUTES } from '@/constants/routes';
import {
  getAdminPanelSubscriptionRequirement,
  subscriptionAllowsAction,
} from '@/lib/admin-subscription-path';
import { cn } from '@/lib/utils';

export type SubscriptionPermissionRow = {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type Props = {
  children: React.ReactNode;
  /** When true (e.g. super admin), all subscription checks pass */
  bypass: boolean;
  /** Built from GET /subscription/me/effective; null means fail-closed for gated routes */
  permissionsByModule: Record<string, SubscriptionPermissionRow> | null;
};

export function AdminSubscriptionGate({ children, bypass, permissionsByModule }: Props) {
  const pathname = usePathname();
  const requirement = getAdminPanelSubscriptionRequirement(pathname);
  const allowed = subscriptionAllowsAction(permissionsByModule, bypass, requirement);

  if (!allowed) {
    return (
      <div
        className="relative mx-auto flex min-h-[min(72vh,580px)] max-w-xl flex-col items-center justify-center px-4 py-10 sm:py-14"
        role="alert"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem]" aria-hidden>
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-slate-800/15 blur-3xl" />
          <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#3b82f6]/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] opacity-90" />
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_50px_-12px_rgb(15_23_42/0.12)] ring-1 ring-slate-700/[0.06] sm:p-10">
          <div className="absolute right-0 top-0 h-28 w-28 translate-x-1/3 -translate-y-1/3 rounded-full bg-slate-50 opacity-80" aria-hidden />
          <div className="relative">
            <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800 text-white shadow-lg shadow-slate-700/25">
              <Sparkles className="h-9 w-9" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-700/90">
              Subscription
            </p>
            <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
              This feature isn&apos;t on your plan
            </h1>
            <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-slate-800 sm:text-[15px]">
              {SUBSCRIPTION_UPGRADE_MESSAGE}
            </p>

            <div className="mt-8 rounded-xl border border-slate-100/90 bg-slate-50/50 px-4 py-3 text-center text-xs leading-relaxed text-slate-900/80">
              <span className="font-medium text-slate-900">Tip:</span> higher tiers unlock more modules. You can
              request an upgrade from the subscription page—approval may be required.
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href={ROUTES.ADMIN.SUBSCRIPTION}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md shadow-slate-700/20 transition-all duration-200',
                  'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-700',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2',
                  'active:scale-[0.98] sm:w-auto'
                )}
              >
                <Crown className="h-4 w-4 shrink-0" aria-hidden />
                View subscription &amp; plan
              </Link>
              <Link
                href={ROUTES.ADMIN.DASHBOARD}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all duration-200',
                  'hover:border-slate-300 hover:bg-slate-50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2',
                  'active:scale-[0.98] sm:w-auto'
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
