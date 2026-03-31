import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';
import {
  DashboardBottomCardsSkeleton,
  DashboardQuickActionsSkeleton,
  DashboardRecommendationsSkeleton,
  DashboardStatsSkeleton,
} from '@/app/admin/dashboard-skeleton';

/** Matches `/admin` dashboard layout while the server page resolves. */
export function AdminDashboardRouteSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-[90%]" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="hidden md:block h-10 w-56 rounded-xl flex-shrink-0" />
      </div>
      <DashboardStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardQuickActionsSkeleton />
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-slate-300 flex-shrink-0" />
              <Skeleton className="h-6 w-44 max-w-[60%] rounded-md" />
            </div>
            <Skeleton className="h-4 w-full max-w-md mt-2 rounded-md" />
          </CardHeader>
          <CardContent>
            <DashboardRecommendationsSkeleton />
          </CardContent>
        </Card>
      </div>
      <DashboardBottomCardsSkeleton />
    </div>
  );
}
