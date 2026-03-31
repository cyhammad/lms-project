import type { ElementType } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, BarChart3, Calendar, Wallet } from 'lucide-react';

export function DashboardQuickActionsSkeleton() {
  return (
    <Card className="lg:col-span-1" aria-hidden>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-300" />
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

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-20 max-w-full" />
                <Skeleton className="h-4 w-36 max-w-full" />
                <div className="min-h-[28px] flex items-center pt-0.5">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-12 w-12 rounded-2xl flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardRecommendationsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white"
        >
          <Skeleton className="h-1.5 w-1.5 rounded-full flex-shrink-0" />
          <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-[72%] max-w-[220px]" />
            <Skeleton className="h-3.5 w-full max-w-[320px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BottomCardSkeleton({ icon: Icon }: { icon: ElementType }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-300" />
          <Skeleton className="h-6 w-36 inline-block align-middle rounded-md" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

export function DashboardBottomCardsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-hidden
    >
      <BottomCardSkeleton icon={Wallet} />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-300" />
            <Skeleton className="h-6 w-44 inline-block rounded-md" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center p-3 bg-slate-50 rounded-xl space-y-2">
                <Skeleton className="h-8 w-12 mx-auto rounded-md" />
                <Skeleton className="h-3 w-14 mx-auto" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-48 mt-4" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-300" />
            <Skeleton className="h-6 w-40 inline-block rounded-md" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/80">
              <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
