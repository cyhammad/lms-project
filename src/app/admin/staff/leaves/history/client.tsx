'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { History, ArrowLeft, Search, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const HISTORY_COLUMNS: DataTableColumn[] = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'type', label: 'Leave Type' },
  { id: 'period', label: 'Period' },
  { id: 'days', label: 'Days' },
  { id: 'reason', label: 'Reason' },
  { id: 'status', label: 'Status' },
  { id: 'remarks', label: 'Remarks' },
];
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { TeacherLeaveRequest, LeaveRequestStatus } from '@/types';

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LeaveHistoryClient() {
  const { showError, AlertComponent } = useAlert();
  const [requests, setRequests] = useState<TeacherLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [approvedRes, rejectedRes] = await Promise.all([
        apiClient<{ requests: TeacherLeaveRequest[] }>('/staff/leaves/requests?status=APPROVED'),
        apiClient<{ requests: TeacherLeaveRequest[] }>('/staff/leaves/requests?status=REJECTED'),
      ]);
      const combined = [
        ...(approvedRes?.requests ?? []),
        ...(rejectedRes?.requests ?? []),
      ].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setRequests(combined);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to load leave history');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.teacher?.name?.toLowerCase().includes(q) ||
        r.teacher?.email?.toLowerCase().includes(q) ||
        r.leaveType?.name?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const statusBadge = (status: LeaveRequestStatus) => {
    const styles = {
      PENDING: 'bg-amber-50 text-amber-700',
      APPROVED: 'bg-slate-50 text-slate-700',
      REJECTED: 'bg-red-50 text-red-700',
    };
    return (
      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.STAFF_LEAVES_REQUESTS}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leave History</h1>
            <p className="text-slate-700 text-sm">Approved and rejected leave requests</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
              <input
                type="text"
                placeholder="Search by teacher or leave type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeaveRequestStatus | 'all')}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            >
              <option value="all">All (Approved & Rejected)</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

        </CardContent>
      </Card>

      <PaginatedDataTable
        title="Leave history"
        columns={HISTORY_COLUMNS}
        loading={loading}
        loadingContent={<p className="text-slate-800">Loading…</p>}
        loadingIcon={<Loader2 className="w-8 h-8 animate-spin text-slate-800" />}
        isEmpty={!loading && filteredRequests.length === 0}
        emptyContent={
          <div className="py-12 text-center text-slate-700">
            <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>{searchQuery || statusFilter !== 'all' ? 'No matching requests' : 'No approved or rejected leaves yet'}</p>
          </div>
        }
        totalCount={filteredRequests.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedRequests.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50/50">
            <td className="py-3 px-4">
              <div>
                <p className="font-medium text-slate-900">{r.teacher?.name ?? '—'}</p>
                <p className="text-xs text-slate-700">{r.teacher?.email ?? ''}</p>
              </div>
            </td>
            <td className="py-3 px-4 text-sm">{r.leaveType?.name ?? '—'}</td>
            <td className="py-3 px-4 text-sm">
              {formatDate(r.startDate)} – {formatDate(r.endDate)}
            </td>
            <td className="py-3 px-4 text-sm">{r.totalDays}</td>
            <td className="py-3 px-4 text-sm max-w-[160px] truncate" title={r.reason ?? ''}>
              {r.reason || '—'}
            </td>
            <td className="py-3 px-4">{statusBadge(r.status)}</td>
            <td className="py-3 px-4 text-sm max-w-[140px]" title={r.remarks ?? ''}>
              {r.remarks ? (
                <span className="flex items-center gap-1 text-slate-800">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{r.remarks}</span>
                </span>
              ) : (
                '—'
              )}
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      <AlertComponent />
    </div>
  );
}
