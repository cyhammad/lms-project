'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, FileText, Pencil, Check, X, Trash2, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import { useAlert } from '@/hooks/use-alert';
import type { ExamDto, ExamSubjectDto } from '@/types';

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SUBJECT_COLUMNS: DataTableColumn[] = [
  { id: 'subject', label: 'Subject' },
  { id: 'marks', label: 'Total / Passing' },
  { id: 'examDate', label: 'Exam date' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface ExamDetailClientProps {
  initialExam: ExamDto;
}

export default function ExamDetailClient({ initialExam }: ExamDetailClientProps) {
  const [exam, setExam] = useState<ExamDto>(initialExam);
  const [loading, setLoading] = useState(false);
  const { showError, AlertComponent } = useAlert();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const subjects = exam.subjects ?? [];
  const totalSubjects = subjects.length;
  const totalPages = Math.max(1, Math.ceil(totalSubjects / pageSize));
  const paginatedSubjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return subjects.slice(start, start + pageSize);
  }, [subjects, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalSubjects]);

  useEffect(() => {
    if (totalSubjects > 0 && page > totalPages) setPage(totalPages);
  }, [totalSubjects, page, totalPages]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ exam: ExamDto }>(`/exams/${exam.id}`);
      setExam(res.exam);
    } catch {
      showError('Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExam();
  }, [exam.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.EXAMS}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="text-slate-700 text-sm">
              {exam.class?.name}{exam.section?.name ? ` — ${exam.section.name}` : ''} · {exam.session?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={ROUTES.ADMIN.EXAMS_RESULTS(exam.id)}>
            <Button variant="outline">View Results</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-700">Exam type</dt>
              <dd className="font-medium">{exam.examType.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-slate-700">Status</dt>
              <dd className="font-medium">{exam.status}</dd>
            </div>
            <div>
              <dt className="text-slate-700">Start date</dt>
              <dd>{formatDate(exam.startDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-700">End date</dt>
              <dd>{formatDate(exam.endDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-700">Schedule</dt>
              <dd className="font-medium">
                {exam.allowMultipleExamsPerDay
                  ? `Up to ${Math.max(1, exam.maxExamsPerDay ?? 1)} exam(s) per day`
                  : 'One exam per day'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title="Subjects"
        headerActions={
          <AddSubjectButton
            examId={exam.id}
            classId={exam.classId}
            examStartDate={exam.startDate}
            examEndDate={exam.endDate}
            addedSubjectIds={(exam.subjects ?? []).map((es: ExamSubjectDto) => es.subjectId)}
            existingExamDates={(exam.subjects ?? []).map((es: ExamSubjectDto) => es.examDate)}
            allowMultipleExamsPerDay={exam.allowMultipleExamsPerDay ?? false}
            maxExamsPerDay={Math.max(1, exam.maxExamsPerDay ?? 1)}
            onAdded={fetchExam}
          />
        }
        columns={SUBJECT_COLUMNS}
        loading={loading}
        loadingIcon={<Loader2 className="w-6 h-6 animate-spin text-slate-800" />}
        loadingContent={<p className="text-slate-800">Loading subjects…</p>}
        isEmpty={!loading && !exam.subjects?.length}
        emptyContent={
          <div className="text-center py-12 text-slate-700">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No subjects added. Add subjects to this exam.</p>
          </div>
        }
        totalCount={totalSubjects}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedSubjects.map((es: ExamSubjectDto) => (
          <SubjectRow
            key={es.id}
            examSubject={es}
            examId={exam.id}
            examStartDate={exam.startDate}
            examEndDate={exam.endDate}
            onUpdated={fetchExam}
            onRemoved={fetchExam}
            formatDate={formatDate}
          />
        ))}
      </PaginatedDataTable>
      <AlertComponent />
    </div>
  );
}

function toDateInputValue(d: string) {
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

/** Normalize any date string from API to YYYY-MM-DD for consistent comparison. */
function normalizeDateKey(d: string): string {
  if (!d || typeof d !== 'string') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return d.slice(0, 10);
}

/** Add one day to YYYY-MM-DD string (avoids timezone issues from Date). */
function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Returns the next date in [start, end] that can have another exam (respects one-per-day or max-per-day). */
function getNextAvailableExamDate(
  examStartDate: string,
  examEndDate: string,
  existingExamDates: string[],
  allowMultipleExamsPerDay: boolean,
  maxExamsPerDay: number
): string {
  const minDate = toDateInputValue(examStartDate);
  const maxDate = toDateInputValue(examEndDate);
  const countByDate: Record<string, number> = {};
  existingExamDates.forEach((d) => {
    const key = normalizeDateKey(d);
    if (key) countByDate[key] = (countByDate[key] ?? 0) + 1;
  });
  const limit = allowMultipleExamsPerDay ? maxExamsPerDay : 1;
  let current = minDate;
  while (current <= maxDate) {
    const count = countByDate[current] ?? 0;
    if (count < limit) return current;
    current = addOneDay(current);
  }
  return minDate;
}

function SubjectRow({
  examSubject,
  examId,
  examStartDate,
  examEndDate,
  onUpdated,
  onRemoved,
  formatDate,
}: {
  examSubject: ExamSubjectDto;
  examId: string;
  examStartDate: string;
  examEndDate: string;
  onUpdated: () => void;
  onRemoved: () => void;
  formatDate: (s: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [form, setForm] = useState({
    totalMarks: examSubject.totalMarks,
    passingMarks: examSubject.passingMarks,
    examDate: toDateInputValue(examSubject.examDate),
  });
  const { showSuccess, showError } = useAlert();

  const startEdit = () => {
    setForm({
      totalMarks: examSubject.totalMarks,
      passingMarks: examSubject.passingMarks,
      examDate: toDateInputValue(examSubject.examDate),
    });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (form.passingMarks > form.totalMarks) {
      showError('Passing marks cannot exceed total marks');
      return;
    }
    const maxDate = toDateInputValue(examEndDate);
    const minDate = toDateInputValue(examStartDate);
    if (form.examDate > maxDate || form.examDate < minDate) {
      showError(`Exam date must be between ${minDate} and ${maxDate}`);
      return;
    }
    setSaving(true);
    try {
      await apiClient(`/exams/${examId}/subjects/${examSubject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          totalMarks: form.totalMarks,
          passingMarks: form.passingMarks,
          examDate: form.examDate,
        }),
      });
      showSuccess('Subject updated');
      setEditing(false);
      onUpdated();
    } catch (e: any) {
      showError(e?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => setRemoveDialogOpen(true);

  const doRemove = async () => {
    setRemoving(true);
    try {
      await apiClient(`/exams/${examId}/subjects/${examSubject.id}`, { method: 'DELETE' });
      showSuccess('Subject removed');
      setRemoveDialogOpen(false);
      onRemoved();
    } catch (e: any) {
      showError(e?.message ?? 'Failed to remove');
    } finally {
      setRemoving(false);
    }
  };

  if (editing) {
    return (
      <tr className="bg-slate-50/50">
        <td className="py-3 px-4 font-medium">{examSubject.subject?.name ?? examSubject.subjectId}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={form.totalMarks}
              onChange={(e) => setForm((f) => ({ ...f, totalMarks: Number(e.target.value) }))}
              className="w-20 px-2 py-1.5 border rounded text-sm"
            />
            <span>/</span>
            <input
              type="number"
              min={0}
              value={form.passingMarks}
              onChange={(e) => setForm((f) => ({ ...f, passingMarks: Number(e.target.value) }))}
              className="w-20 px-2 py-1.5 border rounded text-sm"
            />
          </div>
        </td>
        <td className="py-3 px-4">
          <input
            type="date"
            value={form.examDate}
            onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
            min={toDateInputValue(examStartDate)}
            max={toDateInputValue(examEndDate)}
            className="px-2 py-1.5 border rounded text-sm"
          />
        </td>
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={saveEdit} disabled={saving} title="Save">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-slate-800" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={cancelEdit} disabled={saving} title="Cancel">
              <X className="w-4 h-4 text-slate-700" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="hover:bg-slate-50/50">
        <td className="py-3 px-4 font-medium">{examSubject.subject?.name ?? examSubject.subjectId}</td>
        <td className="py-3 px-4 text-sm">{examSubject.totalMarks} / {examSubject.passingMarks}</td>
        <td className="py-3 px-4 text-sm">{formatDate(examSubject.examDate)}</td>
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={startEdit} title="Edit">
              <Pencil className="w-4 h-4 text-slate-700" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleRemove}
              disabled={removing}
              title="Remove subject"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </td>
      </tr>
      <ConfirmDialog
        open={removeDialogOpen}
        onConfirm={doRemove}
        onCancel={() => setRemoveDialogOpen(false)}
        title="Remove subject"
        message="Remove this subject from the exam? Marks entered for it will be deleted."
        confirmText="Remove"
        variant="destructive"
      />
    </>
  );
}

function AddSubjectButton({
  examId,
  classId,
  examStartDate,
  examEndDate,
  addedSubjectIds,
  existingExamDates,
  allowMultipleExamsPerDay,
  maxExamsPerDay,
  onAdded,
}: {
  examId: string;
  classId: string;
  examStartDate: string;
  examEndDate: string;
  addedSubjectIds: string[];
  existingExamDates: string[];
  allowMultipleExamsPerDay: boolean;
  maxExamsPerDay: number;
  onAdded: () => void;
}) {
  const { showError } = useAlert();
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<{ id: string; name: string; totalMarks: number; passingPercentage: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const defaultExamDate = getNextAvailableExamDate(
    examStartDate,
    examEndDate,
    existingExamDates,
    allowMultipleExamsPerDay,
    maxExamsPerDay
  );
  const [form, setForm] = useState({ subjectId: '', examDate: defaultExamDate });

  useEffect(() => {
    if (!open || !classId) return;
    setLoading(true);
    setSubjects([]);
    apiClient<{ subjects: { id: string; name: string; totalMarks: number; passingPercentage: number }[] }>(
      `/exams/classes/${classId}/subjects`
    )
      .then((d) => setSubjects(d.subjects ?? []))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }, [open, classId]);

  // When opening the panel, set default exam date to next available
  useEffect(() => {
    if (open) {
      const next = getNextAvailableExamDate(
        examStartDate,
        examEndDate,
        existingExamDates,
        allowMultipleExamsPerDay,
        maxExamsPerDay
      );
      setForm((f) => ({ ...f, examDate: next }));
    }
  }, [open, examStartDate, examEndDate, existingExamDates, allowMultipleExamsPerDay, maxExamsPerDay]);

  const availableSubjects = subjects.filter((s) => !addedSubjectIds.includes(s.id));

  const addAllSubjects = async () => {
    if (availableSubjects.length === 0) return;
    const maxDate = toDateInputValue(examEndDate);
    const minDate = toDateInputValue(examStartDate);
    const examsPerDay = allowMultipleExamsPerDay ? maxExamsPerDay : 1;
    const countByDate: Record<string, number> = {};
    existingExamDates.forEach((d) => {
      const key = normalizeDateKey(d);
      if (key) countByDate[key] = (countByDate[key] ?? 0) + 1;
    });
    let availableSlots = 0;
    let d = minDate;
    while (d <= maxDate) {
      const count = countByDate[d] ?? 0;
      availableSlots += Math.max(0, examsPerDay - count);
      d = addOneDay(d);
    }
    if (availableSlots < availableSubjects.length) {
      showError(
        `Not enough room in the exam date range. You can add ${availableSlots} more subject(s) with the current schedule. Extend the exam end date or allow more exams per day.`
      );
      return;
    }
    const datesUsed = existingExamDates.map(normalizeDateKey).filter(Boolean);
    setSubmitting(true);
    try {
      for (const subject of availableSubjects) {
        const nextDate = getNextAvailableExamDate(
          examStartDate,
          examEndDate,
          datesUsed,
          allowMultipleExamsPerDay,
          maxExamsPerDay
        );
        const passingMarks = Math.round((subject.totalMarks * subject.passingPercentage) / 100);
        await apiClient(`/exams/${examId}/subjects`, {
          method: 'POST',
          body: JSON.stringify({
            subjectId: subject.id,
            totalMarks: subject.totalMarks,
            passingMarks,
            examDate: nextDate,
          }),
        });
        datesUsed.push(nextDate);
      }
      setOpen(false);
      setForm({ subjectId: '', examDate: getNextAvailableExamDate(examStartDate, examEndDate, datesUsed, allowMultipleExamsPerDay, maxExamsPerDay) });
      onAdded();
    } catch (e: any) {
      showError(e?.message ?? 'Failed to add some subjects');
    } finally {
      setSubmitting(false);
    }
  };

  const getCountOnDate = (date: string) => {
    const key = normalizeDateKey(date);
    return existingExamDates.filter((d) => normalizeDateKey(d) === key).length;
  };

  const handleAdd = async () => {
    if (!form.subjectId || !form.examDate) return;
    const maxDate = toDateInputValue(examEndDate);
    const minDate = toDateInputValue(examStartDate);
    if (form.examDate > maxDate || form.examDate < minDate) {
      showError('Exam date must be within the exam period');
      return;
    }
    const countOnSelectedDate = getCountOnDate(form.examDate);
    const limit = allowMultipleExamsPerDay ? maxExamsPerDay : 1;
    if (countOnSelectedDate >= limit) {
      showError(
        allowMultipleExamsPerDay
          ? `This day already has the maximum of ${maxExamsPerDay} exam(s). Choose another date or increase the limit in exam settings.`
          : 'Only one exam per day is allowed. Choose another date.'
      );
      return;
    }
    const subject = availableSubjects.find((s) => s.id === form.subjectId);
    if (!subject) return;
    const passingMarks = Math.round((subject.totalMarks * subject.passingPercentage) / 100);
    setSubmitting(true);
    try {
      await apiClient(`/exams/${examId}/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          subjectId: form.subjectId,
          totalMarks: subject.totalMarks,
          passingMarks,
          examDate: form.examDate,
        }),
      });
      setOpen(false);
      const nextDefault = getNextAvailableExamDate(
        examStartDate,
        examEndDate,
        [...existingExamDates, form.examDate],
        allowMultipleExamsPerDay,
        maxExamsPerDay
      );
      setForm({ subjectId: '', examDate: nextDefault });
      onAdded();
    } catch (e: any) {
      showError(e?.message ?? 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add subject
      </Button>
    );
  }
  return (
    <div className="w-full flex-[1_1_100%] rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <p className="text-sm font-medium text-slate-700 mb-3">Add subject to exam</p>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Subject</label>
          <div className="relative">
            <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
            <select
              value={form.subjectId}
              onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              disabled={loading}
            >
              <option value="">
                {loading ? 'Loading subjects...' : availableSubjects.length === 0 ? 'All subjects already added' : 'Select subject'}
              </option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.totalMarks} marks, pass {s.passingPercentage}%)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-[160px]">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Exam date</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
            <input
              type="date"
              value={form.examDate}
              onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
              min={toDateInputValue(examStartDate)}
              max={toDateInputValue(examEndDate)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleAdd} disabled={submitting || !form.subjectId || !form.examDate}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Add
          </Button>
          {availableSubjects.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={addAllSubjects}
              disabled={submitting || loading}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add all ({availableSubjects.length})
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
