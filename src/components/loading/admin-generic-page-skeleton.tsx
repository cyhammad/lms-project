import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Default loading UI for most admin routes (list/detail style pages). */
export function AdminGenericPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 sm:w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0"
            >
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-1/3 max-w-[200px]" />
                <Skeleton className="h-3 w-3/4 max-w-2xl" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md flex-shrink-0 hidden sm:block" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
