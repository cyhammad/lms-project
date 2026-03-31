'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkCalendarView } from '@/components/work-calendar/work-calendar-view';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { WorkCalendarResponse } from '@/types';

export default function StaffWorkCalendarByIdClient({
  staffId,
  staffName,
}: {
  staffId: string;
  staffName: string;
}) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [data, setData] = useState<WorkCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient<WorkCalendarResponse>(
      `/staff/${staffId}/work-calendar?year=${year}&month=${month}`
    )
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [staffId, year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.STAFF_VIEW(staffId)}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Work Calendar</h1>
            <p className="text-slate-700 text-sm">{staffName}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
        </div>
      )}

      {!loading && data && (
        <WorkCalendarView
          data={data}
          teacherName={staffName}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          canChangeMonth={true}
        />
      )}

      {!loading && !data && (
        <p className="text-slate-800 text-center py-16">Could not load calendar.</p>
      )}
    </div>
  );
}
