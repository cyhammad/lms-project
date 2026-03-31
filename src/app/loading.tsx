import { Skeleton } from '@/components/ui/skeleton';

export default function RootLoading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-8"
      aria-busy
      aria-label="Loading"
    >
      <Skeleton className="h-14 w-48 rounded-xl" />
      <Skeleton className="h-5 w-72 max-w-full" />
      <Skeleton className="h-12 w-40 rounded-2xl mt-2" />
    </div>
  );
}
