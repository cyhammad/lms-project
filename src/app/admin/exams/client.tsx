'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Loader2, Eye, Pencil, Award, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import { useAlert } from '@/hooks/use-alert';
import type { ExamDto, ExamStatus, ExamType } from '@/types';

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MID_TERM: 'Mid Term',
  FINAL: 'Final',
  QUARTERLY: 'Quarterly',
  MONTHLY: 'Monthly',
  CLASS_TEST: 'Class Test',
  OTHER: 'Other',
};

const STATUS_COLORS: Record<ExamStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-amber-100 text-amber-800',
  RESULT_PUBLISHED: 'bg-slate-100 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const EXAM_COLUMNS: DataTableColumn[] = [
  { id: 'title', label: 'Title' },
  { id: 'class', label: 'Class' },
  { id: 'session', label: 'Session' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'dates', label: 'Dates' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface ExamsClientProps {
  initialExams: ExamDto[];
}

export default function ExamsClient({ initialExams }: ExamsClientProps) {
  const [exams, setExams] = useState<ExamDto[]>(initialExams);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<ExamDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showError, showSuccess, AlertComponent } = useAlert();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ exams: ExamDto[] }>('/exams?limit=100');
      setExams(res.exams ?? []);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const totalCount = exams.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedExams = useMemo(() => {
    const start = (page - 1) * pageSize;
    return exams.slice(start, start + pageSize);
  }, [exams, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  const handleDelete = (exam: ExamDto) => {
    setExamToDelete(exam);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!examToDelete) return;
    setDeletingId(examToDelete.id);
    try {
      await apiClient(`/exams/${examToDelete.id}`, { method: 'DELETE' });
      showSuccess('Exam deleted');
      setExams((prev) => prev.filter((e) => e.id !== examToDelete.id));
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    } catch (e: unknown) {
      showError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to delete exam');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.DASHBOARD}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Exams</h1>
            <p className="text-slate-700 text-sm">Create and manage exams, marks, and results</p>
          </div>
        </div>
        <Link href={ROUTES.ADMIN.EXAMS_CREATE}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        </Link>
      </div>

      <PaginatedDataTable
        title={`All Exams (${exams.length})`}
        columns={EXAM_COLUMNS}
        loading={loading}
        loadingIcon={<Loader2 className="w-8 h-8 animate-spin text-slate-700" />}
        loadingContent={<p className="text-slate-800">Loading exams…</p>}
        isEmpty={!loading && exams.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 font-medium">No exams yet</p>
            <p className="text-sm text-slate-700 mt-1 mb-4">Create an exam for a class to get started</p>
            <Link href={ROUTES.ADMIN.EXAMS_CREATE}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </Link>
          </div>
        }
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedExams.map((exam) => (
          <tr key={exam.id} className="hover:bg-slate-50/50">
            <td className="py-3 px-4 font-medium text-slate-900">{exam.title}</td>
            <td className="py-3 px-4 text-sm text-slate-800">
              {exam.class?.name ?? exam.classId}
              {exam.section?.name ? ` (${exam.section.name})` : ''}
            </td>
            <td className="py-3 px-4 text-sm text-slate-800">{exam.session?.name ?? exam.sessionId}</td>
            <td className="py-3 px-4 text-sm">{EXAM_TYPE_LABELS[exam.examType] ?? exam.examType}</td>
            <td className="py-3 px-4">
              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[exam.status]}`}>
                {exam.status.replace('_', ' ')}
              </span>
            </td>
            <td className="py-3 px-4 text-sm text-slate-800">
              {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
            </td>
            <td className="py-3 px-4 text-right">
              <div className="flex items-center justify-end gap-1">
                <Link href={ROUTES.ADMIN.EXAMS_VIEW(exam.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
                    <Eye className="w-4 h-4 text-slate-700" />
                  </Button>
                </Link>
                <Link href={ROUTES.ADMIN.EXAMS_EDIT(exam.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                    <Pencil className="w-4 h-4 text-slate-700" />
                  </Button>
                </Link>
                <Link href={ROUTES.ADMIN.EXAMS_RESULTS(exam.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Results">
                    <Award className="w-4 h-4 text-slate-700" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(exam)}
                  disabled={deletingId === exam.id}
                  title="Delete"
                >
                  {deletingId === exam.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>
      <ConfirmDialog
        open={deleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteDialogOpen(false); setExamToDelete(null); }}
        title="Delete exam"
        message={examToDelete ? `Are you sure you want to delete "${examToDelete.title}"? All subjects and marks for this exam will be removed. This action cannot be undone.` : ''}
        confirmText="Delete"
        variant="destructive"
      />
      <AlertComponent />
    </div>
  );
}
