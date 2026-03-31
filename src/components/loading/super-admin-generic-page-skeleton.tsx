import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Default loading UI for super-admin routes other than the dashboard home. */
export function SuperAdminGenericPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-28 rounded-lg hidden sm:block" />
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0"
            >
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-2/5 max-w-[220px]" />
                <Skeleton className="h-3 w-4/5 max-w-xl" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md flex-shrink-0 hidden sm:block" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
