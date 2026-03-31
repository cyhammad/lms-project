'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const REQUESTS_COLUMNS: DataTableColumn[] = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'type', label: 'Leave Type' },
  { id: 'period', label: 'Period' },
  { id: 'days', label: 'Days' },
  { id: 'reason', label: 'Reason' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', align: 'right' },
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

export default function LeaveRequestsClient() {
  const { showSuccess, showError, AlertComponent } = useAlert();
  const [requests, setRequests] = useState<TeacherLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [remarksModal, setRemarksModal] = useState<{
    id: string;
    action: 'approve' | 'reject';
    remarks: string;
  } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiClient<{ requests: TeacherLeaveRequest[] }>(
        '/staff/leaves/requests?status=PENDING'
      );
      setRequests(data?.requests ?? []);
    } catch (e: any) {
      showError(e?.message || 'Failed to load leave requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        r.teacher?.name?.toLowerCase().includes(q) ||
        r.teacher?.email?.toLowerCase().includes(q) ||
        r.leaveType?.name?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleApproveReject = async (
    id: string,
    action: 'approve' | 'reject',
    remarks?: string
  ) => {
    setActionId(id);
    try {
      await apiClient(`/staff/leaves/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, remarks: remarks || undefined }),
      });
      showSuccess(action === 'approve' ? 'Leave approved' : 'Leave rejected');
      setRemarksModal(null);
      fetchRequests();
    } catch (e: any) {
      showError(e?.message || (action === 'approve' ? 'Approve failed' : 'Reject failed'));
    } finally {
      setActionId(null);
    }
  };

  const openRemarks = (id: string, action: 'approve' | 'reject') => {
    setRemarksModal({ id, action, remarks: '' });
  };

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
          <Link href={ROUTES.ADMIN.STAFF}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leave Requests</h1>
            <p className="text-slate-700 text-sm">Approve or reject teacher leave requests</p>
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
          </div>

        </CardContent>
      </Card>

      <PaginatedDataTable
        title="Pending requests"
        columns={REQUESTS_COLUMNS}
        loading={loading}
        loadingContent={<p className="text-slate-800">Loading…</p>}
        loadingIcon={<Loader2 className="w-8 h-8 animate-spin text-slate-800" />}
        isEmpty={!loading && filteredRequests.length === 0}
        emptyContent={
          <div className="py-12 text-center text-slate-700">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>{searchQuery ? 'No matching requests' : 'No pending leave requests'}</p>
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
            <td className="py-3 px-4 text-right">
              {r.status === 'PENDING' && (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-800 border-slate-200"
                    disabled={actionId === r.id}
                    onClick={() => openRemarks(r.id, 'approve')}
                  >
                    {actionId === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200"
                    disabled={actionId === r.id}
                    onClick={() => openRemarks(r.id, 'reject')}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {r.status !== 'PENDING' && r.remarks && (
                <span className="text-xs text-slate-700" title={r.remarks}>
                  <MessageSquare className="w-4 h-4 inline" />
                </span>
              )}
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      {remarksModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                {remarksModal.action === 'approve' ? 'Approve' : 'Reject'} leave request
              </h3>
              <p className="text-sm text-slate-700 mb-3">Remarks (optional)</p>
              <textarea
                value={remarksModal.remarks}
                onChange={(e) =>
                  setRemarksModal((m) => (m ? { ...m, remarks: e.target.value } : null))
                }
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4"
                placeholder="Add a note..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRemarksModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleApproveReject(remarksModal.id, remarksModal.action, remarksModal.remarks)
                  }
                  disabled={actionId === remarksModal.id}
                  className={
                    remarksModal.action === 'approve'
                      ? 'bg-slate-800 hover:bg-slate-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {actionId === remarksModal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    remarksModal.action === 'approve'
                      ? 'Approve'
                      : 'Reject'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertComponent />
    </div>
  );
}
