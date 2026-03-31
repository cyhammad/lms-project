import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStatsSkeleton } from '@/app/admin/dashboard-skeleton';
import {
  SuperAdminQuickActionsSkeleton,
  SuperAdminRecentSchoolsSkeleton,
} from '@/app/super-admin/dashboard-skeleton';

/** Matches `/super-admin` dashboard while the server page resolves. */
export function SuperAdminDashboardRouteSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden md:block h-10 w-56 rounded-xl flex-shrink-0" />
      </div>
      <DashboardStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SuperAdminRecentSchoolsSkeleton />
        <SuperAdminQuickActionsSkeleton />
      </div>
    </div>
  );
}
