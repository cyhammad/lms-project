'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  addDays,
  differenceInCalendarDays,
} from 'date-fns';
import { apiClient } from '@/lib/api-client';
import { AcademicSession, SchoolHoliday } from '@/types';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import { ChevronLeft, ChevronRight, X, Edit2, Plus } from 'lucide-react';

/** Derive session date range from name (e.g. "2024-2025" -> 1 Jul 2024 - 30 Jun 2025) */
function getSessionDateRange(sessionName: string): { start: Date; end: Date } {
  const match = sessionName.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (match) {
    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);
    return {
      start: new Date(startYear, 6, 1), // July 1
      end: new Date(endYear, 5, 30), // June 30
    };
  }
  const singleYear = sessionName.match(/(\d{4})/);
  if (singleYear) {
    const y = parseInt(singleYear[1], 10);
    return {
      start: new Date(y, 0, 1),
      end: new Date(y, 11, 31),
    };
  }
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31),
  };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EventCalendarClientProps {
  sessions: AcademicSession[];
}

export default function EventCalendarClient({ sessions: sessionsProp }: EventCalendarClientProps) {
  const { session: selectedSession, sessions } = useAdminSession();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<SchoolHoliday | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<string>('holiday');
  const [formRemarks, setFormRemarks] = useState('');
  const [formDateStart, setFormDateStart] = useState('');
  const [formDateEnd, setFormDateEnd] = useState('');
  const [formIsRange, setFormIsRange] = useState(false);
  const [selectedDayForList, setSelectedDayForList] = useState<Date | null>(null);

  const sessionRange = useMemo(() => {
    if (!selectedSession) return null;
    return getSessionDateRange(selectedSession.name);
  }, [selectedSession?.id, selectedSession?.name]);

  const fetchHolidays = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      });
      const data = await apiClient<{ holidays: SchoolHoliday[] }>(
        `/school-holidays?${params.toString()}`
      );
      setHolidays(data.holidays ?? []);
    } catch (e) {
      console.error('Failed to fetch holidays:', e);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(currentMonthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(currentMonthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, SchoolHoliday[]>();
    for (const h of holidays) {
      const key = h.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return map;
  }, [holidays]);

  const openModalForAdd = (type: 'holiday' | 'event') => {
    setEditingHoliday(null);
    setFormTitle('');
    setFormType(type);
    setFormRemarks('');
    setFormIsRange(false);
    const ref = startOfMonth(currentMonth);
    const defaultDate = sessionRange
      ? format(isWithinInterval(ref, sessionRange) ? ref : sessionRange.start, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    setFormDateStart(defaultDate);
    setFormDateEnd(defaultDate);
    setModalOpen(true);
  };

  const openModalForEdit = (h: SchoolHoliday) => {
    setEditingHoliday(h);
    setFormTitle(h.title);
    setFormType(h.type || 'holiday');
    setFormRemarks(h.remarks || '');
    setFormIsRange(false);
    const d = h.date.slice(0, 10);
    setFormDateStart(d);
    setFormDateEnd(d);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingHoliday(null);
  };

  const saveHoliday = async () => {
    if (!formTitle.trim() || !formDateStart) return;
    const start = parseISO(formDateStart);
    const end = formIsRange && formDateEnd ? parseISO(formDateEnd) : start;
    if (end < start) return;
    setLoading(true);
    try {
      if (editingHoliday) {
        await apiClient(`/school-holidays/${editingHoliday.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle.trim(),
            date: formDateStart,
            type: formType || null,
            remarks: formRemarks.trim() || null,
          }),
        });
      } else if (differenceInCalendarDays(end, start) > 0) {
        const dates: string[] = [];
        let d = start;
        while (d <= end) {
          dates.push(format(d, 'yyyy-MM-dd'));
          d = addDays(d, 1);
        }
        await apiClient<{ holidays: SchoolHoliday[] }>('/school-holidays/batch', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle.trim(),
            dates,
            type: formType || null,
            remarks: formRemarks.trim() || null,
          }),
        });
      } else {
        await apiClient('/school-holidays', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle.trim(),
            date: formDateStart,
            type: formType || null,
            remarks: formRemarks.trim() || null,
          }),
        });
      }
      if (sessionRange) {
        await fetchHolidays(sessionRange.start, sessionRange.end);
      }
      closeModal();
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setLoading(false);
    }
  };

  const deleteHoliday = async (id: string) => {
    setLoading(true);
    try {
      await apiClient(`/school-holidays/${id}`, { method: 'DELETE' });
      if (sessionRange) {
        await fetchHolidays(sessionRange.start, sessionRange.end);
      }
    } catch (e) {
      console.error('Failed to delete:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day: Date) => {
    if (!sessionRange || !isWithinInterval(day, { start: sessionRange.start, end: sessionRange.end }))
      return;
    setSelectedDayForList(day);
  };

  const canPrevMonth = sessionRange && currentMonthStart > sessionRange.start;
  const canNextMonth = sessionRange && currentMonthEnd < sessionRange.end;

  useEffect(() => {
    if (sessionRange) {
      fetchHolidays(sessionRange.start, sessionRange.end);
    } else {
      setHolidays([]);
    }
  }, [selectedSession?.id, sessionRange?.start?.getTime(), sessionRange?.end?.getTime(), fetchHolidays]);

  useEffect(() => {
    if (selectedSession && sessionRange) {
      const inRange = currentMonth >= sessionRange.start && currentMonth <= sessionRange.end;
      if (!inRange) setCurrentMonth(sessionRange.start);
    }
  }, [selectedSession?.id, sessionRange?.start?.getTime(), sessionRange?.end?.getTime()]);

  const selectedDayHolidays = selectedDayForList
    ? holidaysByDate.get(format(selectedDayForList, 'yyyy-MM-dd')) ?? []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Event Calendar
        </h1>
        {selectedSession && (
          <p className="text-sm text-slate-800 dark:text-slate-800">
            Session: <span className="font-medium text-slate-800 dark:text-slate-200">{selectedSession.name}</span> (change in header)
          </p>
        )}
      </div>

      {!selectedSession && (
        <p className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          No session available. Create a session from Curriculum → Sessions.
        </p>
      )}

      {selectedSession && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openModalForAdd('holiday')}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
              Add Holiday
            </button>
            <button
              type="button"
              onClick={() => openModalForAdd('event')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                disabled={!canPrevMonth}
                className="rounded-lg p-2 text-slate-800 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-800 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                disabled={!canNextMonth}
                className="rounded-lg p-2 text-slate-800 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-800 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {loading && (
              <div className="mb-4 text-center text-sm text-slate-700">Loading…</div>
            )}

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-700 dark:text-slate-800">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const inRange =
                  sessionRange &&
                  isWithinInterval(day, { start: sessionRange.start, end: sessionRange.end });
                const inMonth = isSameMonth(day, currentMonth);
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayHolidays = holidaysByDate.get(dateKey) ?? [];
                const isSelectedDay = selectedDayForList && isSameDay(day, selectedDayForList);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`
                      min-h-[72px] rounded-lg border p-2 text-left text-sm
                      ${inMonth ? 'text-slate-900 dark:text-slate-200' : 'text-slate-800 dark:text-slate-700'}
                      ${!inRange ? 'cursor-not-allowed bg-slate-50 opacity-60 dark:bg-slate-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                      ${isSelectedDay ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : 'border-slate-200 dark:border-slate-800'}
                    `}
                  >
                    <span>{format(day, 'd')}</span>
                    {dayHolidays.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {dayHolidays.slice(0, 2).map((h) => (
                          <div
                            key={h.id}
                            className="truncate rounded px-1 py-0.5 text-xs"
                            style={{
                              backgroundColor:
                                (h.type === 'event' ? '#c7d2fe' : '#fde68a'),
                              color: (h.type === 'event' ? '#312e81' : '#78350f'),
                            }}
                            title={h.title}
                          >
                            {h.title}
                          </div>
                        ))}
                        {dayHolidays.length > 2 && (
                          <span className="text-xs text-slate-700">
                            +{dayHolidays.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDayForList && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
              <h3 className="mb-3 font-medium text-slate-800 dark:text-slate-200">
                {format(selectedDayForList, 'EEEE, MMM d, yyyy')}
              </h3>
              {selectedDayHolidays.length === 0 ? (
                <p className="text-sm text-slate-700 dark:text-slate-800">
                  No events or holidays on this day.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedDayHolidays.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50"
                    >
                      <div>
                        <span className="font-medium">{h.title}</span>
                        {h.type && (
                          <span className="ml-2 text-xs text-slate-700">({h.type})</span>
                        )}
                        {h.remarks && (
                          <p className="text-xs text-slate-700">{h.remarks}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openModalForEdit(h)}
                          className="rounded p-1 text-slate-700 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHoliday(h.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30"
                          title="Delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {editingHoliday ? 'Edit' : 'Add'} {formType === 'event' ? 'Event' : 'Holiday'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-800">
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Winter Break"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              {!editingHoliday && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-800">
                    Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-200"
                  >
                    <option value="holiday">Holiday</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-800">
                  {editingHoliday ? 'Date' : formIsRange ? 'Start date' : 'Date'}
                </label>
                <input
                  type="date"
                  value={formDateStart}
                  onChange={(e) => setFormDateStart(e.target.value)}
                  disabled={!!editingHoliday}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-200 disabled:opacity-60"
                />
              </div>
              {!editingHoliday && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="formIsRange"
                    checked={formIsRange}
                    onChange={(e) => {
                      setFormIsRange(e.target.checked);
                      if (!e.target.checked) setFormDateEnd(formDateStart);
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor="formIsRange" className="text-sm text-slate-800 dark:text-slate-800">
                    Add for a date range
                  </label>
                </div>
              )}
              {!editingHoliday && formIsRange && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-800">
                    End date
                  </label>
                  <input
                    type="date"
                    value={formDateEnd}
                    onChange={(e) => setFormDateEnd(e.target.value)}
                    min={formDateStart}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-200"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-800">
                  Remarks (optional)
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-800 dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveHoliday}
                disabled={!formTitle.trim() || !formDateStart || (formIsRange && (!formDateEnd || formDateEnd < formDateStart))}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {editingHoliday ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

