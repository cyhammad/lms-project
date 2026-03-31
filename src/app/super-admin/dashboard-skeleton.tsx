import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Settings } from 'lucide-react';

export { DashboardStatsSkeleton } from '../admin/dashboard-skeleton';

export function SuperAdminRecentSchoolsSkeleton() {
  return (
    <Card className="lg:col-span-2" aria-hidden>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-300 flex-shrink-0" />
              <Skeleton className="h-6 w-40 max-w-[55%] rounded-md" />
            </div>
            <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-4 w-14 flex-shrink-0 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-48 max-w-[85%]" />
              <Skeleton className="h-3.5 w-full max-w-xs" />
            </div>
            <Skeleton className="h-3 w-16 flex-shrink-0 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SuperAdminQuickActionsSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-300" />
          <Skeleton className="h-6 w-32 inline-block rounded-md" />
        </CardTitle>
        <Skeleton className="h-4 w-52 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white"
          >
            <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-40 max-w-[70%]" />
              <Skeleton className="h-3.5 w-52 max-w-full" />
            </div>
            <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
