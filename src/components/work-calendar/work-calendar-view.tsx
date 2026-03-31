'use client';

import { ChevronLeft, ChevronRight, CalendarDays, Briefcase, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkCalendarResponse, WorkCalendarDayStatus, WorkCalendarDay } from '@/types';

const STATUS_LABELS: Record<WorkCalendarDayStatus, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
  WEEKEND: 'Weekend',
  PENDING: 'Pending',
};

const STATUS_COLORS: Record<WorkCalendarDayStatus, string> = {
  PRESENT: 'border-slate-300 bg-gradient-to-br from-slate-50 to-white',
  LATE: 'border-amber-300 bg-gradient-to-br from-amber-50 to-white',
  ABSENT: 'border-red-300 bg-gradient-to-br from-red-50 to-white',
  LEAVE: 'border-blue-300 bg-gradient-to-br from-blue-50 to-white',
  HOLIDAY: 'border-purple-300 bg-gradient-to-br from-purple-50 to-white',
  WEEKEND: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white',
  PENDING: 'border-slate-200 bg-gradient-to-br from-gray-50 to-white',
};

const STATUS_TEXT_COLORS: Record<WorkCalendarDayStatus, string> = {
  PRESENT: 'text-slate-800',
  LATE: 'text-amber-800',
  ABSENT: 'text-red-800',
  LEAVE: 'text-blue-800',
  HOLIDAY: 'text-purple-800',
  WEEKEND: 'text-slate-800',
  PENDING: 'text-slate-700',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WorkCalendarViewProps {
  data: WorkCalendarResponse;
  teacherName?: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canChangeMonth?: boolean;
}

export function WorkCalendarView({
  data,
  teacherName,
  onPrevMonth,
  onNextMonth,
  canChangeMonth = true,
}: WorkCalendarViewProps) {
  const { year, month, days, summary } = data;
  const monthLabel = new Date(year, month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const padding: Array<{ key: string; empty: true }> = Array.from({ length: firstDay }, (_, i) => ({ key: `pad-${i}`, empty: true as const }));

  const totalDays = days.length;
  const presentCount = summary.PRESENT ?? 0;
  const leaveCount = summary.LEAVE ?? 0;
  const absentLateCount = (summary.ABSENT ?? 0) + (summary.LATE ?? 0);

  return (
    <div className="space-y-6">
      {/* Main calendar card - same wrapper as timetable */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Calendar</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {teacherName ? `${teacherName} — ${monthLabel}` : monthLabel}
            </p>
          </div>
          {canChangeMonth && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9" onClick={onPrevMonth} aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
                {monthLabel}
              </span>
              <Button variant="outline" size="sm" className="h-9" onClick={onNextMonth} aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Summary stats - above calendar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Total Days</p>
                <p className="text-2xl font-semibold text-gray-900">{totalDays}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Present</p>
                <p className="text-2xl font-semibold text-gray-900">{presentCount}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-slate-800" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Leave</p>
                <p className="text-2xl font-semibold text-gray-900">{leaveCount}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Absent / Late</p>
                <p className="text-2xl font-semibold text-gray-900">{absentLateCount}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar grid - timetable-style table */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {WEEKDAYS.map((d) => (
                    <th
                      key={d}
                      className="min-w-[100px] px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const allCells: Array<{ key: string; empty: true } | (typeof days[0])> = [
                    ...padding,
                    ...days,
                  ];
                  const rows: typeof allCells[] = [];
                  for (let i = 0; i < allCells.length; i += 7) {
                    rows.push(allCells.slice(i, i + 7));
                  }
                  // Ensure last row has 7 cells
                  const lastRow = rows[rows.length - 1];
                  if (lastRow && lastRow.length < 7) {
                    while (lastRow.length < 7) {
                      lastRow.push({ key: `pad-${lastRow.length}`, empty: true });
                    }
                  }
                  return rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100">
                      {row.map((cell: { key: string; empty: true } | WorkCalendarDay) =>
                        'empty' in cell && cell.empty ? (
                          <td key={cell.key} className="p-1.5 align-top">
                            <div className="min-h-[80px] p-2.5 border-2 border-dashed border-gray-200 rounded-lg bg-white" />
                          </td>
                        ) : (
                          (() => {
                            const dayCell = cell as WorkCalendarDay;
                            return (
                              <td key={dayCell.date} className="p-1.5 align-top">
                                <div
                                  className={`min-h-[80px] p-2.5 border-2 rounded-lg flex flex-col items-center justify-center gap-0.5 ${STATUS_COLORS[dayCell.status]} ${STATUS_TEXT_COLORS[dayCell.status]}`}
                                  title={dayCell.title || dayCell.remarks ? [dayCell.title, dayCell.remarks].filter(Boolean).join(' — ') : STATUS_LABELS[dayCell.status]}
                                >
                                  <span className="text-sm font-semibold">{new Date(dayCell.date).getDate()}</span>
                                  <span className="text-[10px] font-medium">{STATUS_LABELS[dayCell.status]}</span>
                                  {dayCell.title && (
                                    <span className="text-[10px] truncate w-full text-center mt-0.5" title={dayCell.title}>
                                      {dayCell.title}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })()
                        )
                      )}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
