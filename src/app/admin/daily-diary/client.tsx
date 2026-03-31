'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, X, Eye, Calendar, User } from 'lucide-react';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import type { DailyDiary } from '@/types';
import { listDailyDiary, type ListDailyDiaryParams } from '@/actions/daily-diary';

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DIARY_COLUMNS: DataTableColumn[] = [
  { id: 'date', label: 'Date' },
  { id: 'title', label: 'Title' },
  { id: 'classSection', label: 'Class / Section' },
  { id: 'subject', label: 'Subject' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

export default function DailyDiaryClient() {
  const [data, setData] = useState<{ diaries: DailyDiary[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ListDailyDiaryParams>({ page: 1, limit: 20 });
  const [viewing, setViewing] = useState<DailyDiary | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchDiaries = useCallback(async () => {
    setLoading(true);
    const result = await listDailyDiary({
      ...filters,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
    setLoading(false);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData({ diaries: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }
  }, [filters, fromDate, toDate]);

  useEffect(() => {
    fetchDiaries();
  }, [fetchDiaries]);

  const hasFilters = fromDate || toDate;
  const clearFilters = () => {
    setFromDate('');
    setToDate('');
  };

  useEffect(() => {
    setFilters((f) => ({ ...f, page: 1 }));
  }, [fromDate, toDate]);

  const diaries = data?.diaries ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 };
  const diaryPage = filters.page ?? 1;
  const diaryLimit = filters.limit ?? 20;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Daily Diary</h1>
        <p className="text-slate-700 mt-1.5">
          Monitor daily diary entries created by teachers for classes and sections
        </p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="border-slate-300">
                <X className="w-4 h-4 mr-1.5" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={
          <span className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            All Diary Entries ({pagination.total})
          </span>
        }
        columns={DIARY_COLUMNS}
        loading={loading}
        loadingContent={<p className="text-slate-800">Loading...</p>}
        loadingIcon={<BookOpen className="w-8 h-8 text-indigo-400" />}
        isEmpty={!loading && diaries.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-slate-900 font-semibold text-lg">No diary entries found</p>
            <p className="text-sm text-slate-700 mt-1">Entries will appear here when teachers add them.</p>
          </div>
        }
        totalCount={pagination.total}
        page={diaryPage}
        pageSize={diaryLimit}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onPageSizeChange={(limit) => setFilters((f) => ({ ...f, limit, page: 1 }))}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {diaries.map((diary) => (
          <tr key={diary.id} className="hover:bg-slate-50/50">
            <td className="py-4 px-6">
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <Calendar className="w-4 h-4 text-slate-800" />
                {formatDate(diary.diaryDate)}
              </div>
            </td>
            <td className="py-4 px-6 font-medium text-slate-900">{diary.title}</td>
            <td className="py-4 px-6 text-sm text-slate-800">
              {diary.class?.name ?? diary.classId} / {diary.section?.name ?? diary.sectionId}
            </td>
            <td className="py-4 px-6 text-sm text-slate-800">{diary.subject ?? '—'}</td>
            <td className="py-4 px-6">
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <User className="w-4 h-4 text-slate-800" />
                {diary.teacher?.name ?? '—'}
              </div>
            </td>
            <td className="py-4 px-6 text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setViewing(diary)}
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      {/* View modal */}
      {viewing && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Diary Entry</h2>
              <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-700">Date</p>
                <p className="font-medium">{formatDate(viewing.diaryDate)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-700">Title</p>
                <p className="font-semibold text-lg">{viewing.title}</p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-slate-700">Class / Section</p>
                  <p className="font-medium">{viewing.class?.name ?? viewing.classId} / {viewing.section?.name ?? viewing.sectionId}</p>
                </div>
                {viewing.subject && (
                  <div>
                    <p className="text-sm text-slate-700">Subject</p>
                    <p className="font-medium">{viewing.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-700">Teacher</p>
                  <p className="font-medium">{viewing.teacher?.name ?? '—'}</p>
                </div>
              </div>
              {viewing.topicCovered && (
                <div>
                  <p className="text-sm text-slate-700">Topic covered</p>
                  <p className="text-slate-700">{viewing.topicCovered}</p>
                </div>
              )}
              {viewing.homework && (
                <div>
                  <p className="text-sm text-slate-700">Homework</p>
                  <p className="text-slate-700">{viewing.homework}</p>
                </div>
              )}
              {viewing.reminder && (
                <div>
                  <p className="text-sm text-slate-700">Reminder</p>
                  <p className="text-slate-700">{viewing.reminder}</p>
                </div>
              )}
              {viewing.notes && (
                <div>
                  <p className="text-sm text-slate-700">Notes</p>
                  <p className="text-slate-700">{viewing.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
