'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import { WorkCalendarView } from '@/components/work-calendar/work-calendar-view';
import type { WorkCalendarResponse, Teacher } from '@/types';

export default function WorkCalendarClient({
  initialStaff,
}: {
  initialStaff: Teacher[];
}) {
  const [teacherId, setTeacherId] = useState<string>('');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [data, setData] = useState<WorkCalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const teachers = initialStaff.filter((s) => s.staffType === 'TEACHER' || !s.staffType);
  const selectedTeacher = initialStaff.find((s) => s.id === teacherId);

  useEffect(() => {
    if (!teacherId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient<WorkCalendarResponse>(
      `/staff/${teacherId}/work-calendar?year=${year}&month=${month}`
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
  }, [teacherId, year, month]);

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

  const monthLabel = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header - same structure as timetable */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={ROUTES.ADMIN.STAFF}>
              <Button variant="outline" size="sm" className="h-9">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Work Calendar</h1>
              <p className="text-sm text-gray-500 mt-1.5">
                {selectedTeacher
                  ? `${selectedTeacher.name} • ${monthLabel}`
                  : 'Monthly work status: attendance, leave, holidays, weekends'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {teacherId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
                  {monthLabel}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Teacher select - inside main card area like timetable */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">Monthly Schedule</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a teacher to view their work calendar (Present, Late, Absent, Leave, Holiday, Weekend)
          </p>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select teacher</label>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="w-full max-w-md px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
        >
          <option value="">Choose a teacher...</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.email ? `(${t.email})` : ''}
            </option>
          ))}
        </select>
      </div>

      {!teacherId && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-16 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Select a teacher to view their work calendar</p>
            <p className="text-xs text-gray-500 mt-1">Shows Present, Late, Absent, Leave, Holiday, Weekend, Pending</p>
          </div>
        </div>
      )}

      {teacherId && loading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
        </div>
      )}

      {teacherId && !loading && data && (
        <WorkCalendarView
          data={data}
          teacherName={selectedTeacher?.name}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          canChangeMonth={true}
        />
      )}

      {teacherId && !loading && !data && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-16 text-gray-500">
            <p className="text-sm">Could not load calendar. Try another month or teacher.</p>
          </div>
        </div>
      )}
    </div>
  );
}
