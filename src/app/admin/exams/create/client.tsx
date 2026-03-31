'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import { useAlert } from '@/hooks/use-alert';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import type { ExamType } from '@/types';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T12:00:00').getTime();
  const end = new Date(endDate + 'T12:00:00').getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'MID_TERM', label: 'Mid Term' },
  { value: 'FINAL', label: 'Final' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'CLASS_TEST', label: 'Class Test' },
  { value: 'OTHER', label: 'Other' },
];

export default function CreateExamClient() {
  const router = useRouter();
  const { showError, showSuccess, AlertComponent } = useAlert();
  const { sessionId: globalSessionId } = useAdminSession();
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [classSubjects, setClassSubjects] = useState<{ id: string; name: string; totalMarks: number; passingPercentage: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sessionId: '',
    classId: '',
    sectionId: '' as string | null,
    title: '',
    examType: 'FINAL' as ExamType,
    startDate: '',
    endDate: '',
    allowMultipleExamsPerDay: false,
    maxExamsPerDay: '1',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiClient<{ sessions: { id: string; name: string }[] }>('/sessions').then((d) => d.sessions ?? []),
      apiClient<{ classes: { id: string; name: string; code: string }[] }>('/classes').then((d) => d.classes ?? []),
    ]).then(([s, c]) => {
      if (!cancelled) {
        setSessions(Array.isArray(s) ? s : []);
        setClasses(Array.isArray(c) ? c : []);
      }
    }).catch(() => { if (!cancelled) { setSessions([]); setClasses([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (globalSessionId && sessions.some((s) => s.id === globalSessionId) && !form.sessionId) {
      setForm((f) => ({ ...f, sessionId: globalSessionId }));
    }
  }, [globalSessionId, sessions, form.sessionId]);

  useEffect(() => {
    if (!form.classId) {
      setSections([]);
      return;
    }
    apiClient<{ sections: { id: string; name: string }[] }>(`/sections?classId=${form.classId}`)
      .then((d: any) => setSections(Array.isArray(d?.sections) ? d.sections : []))
      .catch(() => setSections([]));
  }, [form.classId]);

  useEffect(() => {
    if (!form.classId) {
      setClassSubjects([]);
      return;
    }
    apiClient<{ subjects: { id: string; name: string; totalMarks: number; passingPercentage: number }[] }>(
      `/exams/classes/${form.classId}/subjects`
    )
      .then((d) => setClassSubjects(Array.isArray(d?.subjects) ? d.subjects : []))
      .catch(() => setClassSubjects([]));
  }, [form.classId]);

  const examsPerDay = form.allowMultipleExamsPerDay
    ? Math.min(10, Math.max(1, parseInt(form.maxExamsPerDay, 10) || 1))
    : 1;
  const subjectCount = classSubjects.length;
  const minDaysRequired = subjectCount > 0 ? Math.ceil(subjectCount / examsPerDay) : 0;
  const actualDays = form.startDate && form.endDate ? daysBetween(form.startDate, form.endDate) : 0;
  const dateRangeValid = minDaysRequired === 0 || actualDays >= minDaysRequired;
  const minEndDate = form.startDate && minDaysRequired > 0 ? addDays(form.startDate, minDaysRequired - 1) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sessionId || !form.classId || !form.title || !form.startDate || !form.endDate) {
      showError('Please fill session, class, title, and dates');
      return;
    }
    if (!dateRangeValid) {
      showError(
        `Date range must span at least ${minDaysRequired} day(s) to fit ${subjectCount} subject(s) (${examsPerDay} per day). Choose a later end date.`
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient<{ exam: { id: string } }>('/exams', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: form.sessionId,
          classId: form.classId,
          sectionId: form.sectionId || null,
          title: form.title,
          examType: form.examType,
          startDate: form.startDate,
          endDate: form.endDate,
          allowMultipleExamsPerDay: form.allowMultipleExamsPerDay,
          maxExamsPerDay: form.allowMultipleExamsPerDay ? Math.min(10, Math.max(1, parseInt(form.maxExamsPerDay, 10) || 1)) : 1,
        }),
      });
      showSuccess('Exam created');
      router.push(ROUTES.ADMIN.EXAMS_VIEW((res as any).exam.id));
    } catch (err: any) {
      showError(err?.message ?? 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.ADMIN.EXAMS}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Exam</h1>
          <p className="text-slate-700 text-sm">Add a new exam for a class</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="e.g. First Term Exam"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Exam type</label>
              <select
                value={form.examType}
                onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value as ExamType }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Session *</label>
              <select
                value={form.sessionId}
                onChange={(e) => setForm((f) => ({ ...f, sessionId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                required
              >
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
              <select
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, sectionId: null }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                required
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Section (optional)</label>
              <select
                value={form.sectionId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value || null }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">Exam schedule</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowMultipleExamsPerDay}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    allowMultipleExamsPerDay: e.target.checked,
                    maxExamsPerDay: e.target.checked ? f.maxExamsPerDay : '1',
                  }))}
                  className="rounded border-slate-300 text-slate-800 focus:ring-slate-700"
                />
                <span className="text-sm text-slate-700">Allow multiple exams on a single day</span>
              </label>
              {form.allowMultipleExamsPerDay && (
                <div className="pl-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max exams per day</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.maxExamsPerDay}
                    onChange={(e) => setForm((f) => ({ ...f, maxExamsPerDay: e.target.value }))}
                    onBlur={() => {
                      const n = parseInt(form.maxExamsPerDay, 10);
                      if (form.maxExamsPerDay === '' || isNaN(n) || n < 1 || n > 10) {
                        setForm((f) => ({ ...f, maxExamsPerDay: '1' }));
                      } else {
                        setForm((f) => ({ ...f, maxExamsPerDay: String(n) }));
                      }
                    }}
                    className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <p className="text-xs text-slate-700 mt-1">Maximum number of subject exams that can be held on one day (1–10).</p>
                </div>
              )}
              {!form.allowMultipleExamsPerDay && (
                <p className="text-xs text-slate-700">By default, only one subject exam will be scheduled per day within the exam date range.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  min={minEndDate}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
                {minDaysRequired > 0 && (
                  <p className={`text-xs mt-1 ${dateRangeValid ? 'text-slate-700' : 'text-amber-600'}`}>
                    {dateRangeValid
                      ? `Range spans ${actualDays} day(s). Minimum ${minDaysRequired} day(s) needed for ${subjectCount} subject(s) (${examsPerDay} per day).`
                      : `Date range must be at least ${minDaysRequired} day(s) to fit all ${subjectCount} subjects.`}
                  </p>
                )}
              </div>
            </div>
            {form.classId && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-700" />
                  Subjects that will be added ({classSubjects.length})
                </p>
                {classSubjects.length === 0 ? (
                  <p className="text-sm text-slate-700">No subjects found for this class. Add subjects to the class first.</p>
                ) : (
                  <ul className="text-sm text-slate-800 list-disc list-inside space-y-0.5">
                    {classSubjects.map((s) => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting || (minDaysRequired > 0 && !dateRangeValid)}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Exam
              </Button>
              <Link href={ROUTES.ADMIN.EXAMS}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <AlertComponent />
    </div>
  );
}
