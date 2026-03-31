'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Calculator, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import { useAlert } from '@/hooks/use-alert';
import type { ExamDto, ResultCardDto, ExamSubjectDto } from '@/types';

interface ReportCardData {
  student: { id: string; firstName: string; lastName: string };
  resultCards: Array<{ examId: string; totalMarks: number; obtainedMarks: number; percentage: number; grade?: string | null }>;
  subjectMarks: Array<{ examId?: string; subjectId?: string; subjectName: string; totalMarks: number; obtainedMarks: number; passingMarks: number }>;
}

/** Build subject rows for the result card: use exam subjects and merge with API marks (by name or id). */
function getSubjectRows(
  exam: ExamDto,
  reportCardData: ReportCardData | null
): Array<{ subjectName: string; totalMarks: number; passingMarks: number; obtainedMarks: number | null }> {
  const subjects = exam.subjects ?? [];
  if (subjects.length === 0) {
    // No exam subjects: show whatever the API returned (no filter by examId)
    if (!reportCardData?.subjectMarks?.length) return [];
    return reportCardData.subjectMarks.map((m) => ({
      subjectName: m.subjectName,
      totalMarks: m.totalMarks,
      passingMarks: m.passingMarks,
      obtainedMarks: m.obtainedMarks,
    }));
  }
  return subjects.map((es: ExamSubjectDto) => {
    const name = es.subject?.name ?? 'Subject';
    const mark = reportCardData?.subjectMarks?.find(
      (m) =>
        m.subjectName === name ||
        m.subjectId === es.subjectId
    );
    return {
      subjectName: name,
      totalMarks: es.totalMarks,
      passingMarks: es.passingMarks,
      obtainedMarks: mark != null ? mark.obtainedMarks : null,
    };
  });
}

interface ExamResultsClientProps {
  examId: string;
  initialExam: ExamDto;
  initialResultCards: ResultCardDto[];
}

const RESULT_COLUMNS: DataTableColumn[] = [
  { id: 'student', label: 'Student' },
  { id: 'obtained', label: 'Obtained', align: 'right' },
  { id: 'total', label: 'Total', align: 'right' },
  { id: 'pct', label: '%', align: 'right' },
  { id: 'grade', label: 'Grade', align: 'right' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

export default function ExamResultsClient({
  examId,
  initialExam,
  initialResultCards,
}: ExamResultsClientProps) {
  const [resultCards, setResultCards] = useState<ResultCardDto[]>(initialResultCards);
  const [calculating, setCalculating] = useState(false);
  const [viewCardStudentId, setViewCardStudentId] = useState<string | null>(null);
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { showSuccess, showError, AlertComponent } = useAlert();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalCount = resultCards.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedCards = useMemo(() => {
    const start = (page - 1) * pageSize;
    return resultCards.slice(start, start + pageSize);
  }, [resultCards, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  const fetchReportCard = async (studentId: string): Promise<ReportCardData | null> => {
    try {
      const data = await apiClient<ReportCardData>(
        `/exams/report-card/${studentId}?examId=${examId}`
      );
      return data;
    } catch {
      return null;
    }
  };

  const openResultCard = async (studentId: string) => {
    setViewCardStudentId(studentId);
    setReportCardData(null);
    setLoadingReportCard(true);
    try {
      const data = await fetchReportCard(studentId);
      setReportCardData(data ?? null);
    } finally {
      setLoadingReportCard(false);
    }
  };

  const closeResultCard = () => {
    setViewCardStudentId(null);
    setReportCardData(null);
  };

  const downloadResultCard = async (studentId: string, studentName: string) => {
    setDownloadingId(studentId);
    try {
      const data = await fetchReportCard(studentId);
      if (!data) {
        showError('Could not load result card');
        return;
      }
      const card = data.resultCards.find((c) => c.examId === examId);
      const subjectRows = getSubjectRows(initialExam, data);
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const margin = 20;
      let y = margin;
      pdf.setFontSize(16);
      pdf.text(initialExam.title, margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.text(`Student: ${studentName}`, margin, y);
      y += 6;
      pdf.text(`Class: ${initialExam.class?.name ?? ''}${initialExam.section?.name ? ` — ${initialExam.section.name}` : ''}`, margin, y);
      y += 10;
      pdf.setFontSize(10);
      pdf.text('Subject-wise marks', margin, y);
      y += 6;
      subjectRows.forEach((row) => {
        const obtained = row.obtainedMarks != null ? String(row.obtainedMarks) : '—';
        const status = row.obtainedMarks != null ? (row.obtainedMarks >= row.passingMarks ? 'Pass' : 'Fail') : '—';
        pdf.text(`${row.subjectName}: ${obtained} / ${row.totalMarks} (${status})`, margin + 5, y);
        y += 5;
      });
      y += 5;
      if (card) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Total: ${card.obtainedMarks} / ${card.totalMarks}`, margin, y);
        y += 6;
        pdf.text(`Percentage: ${card.percentage.toFixed(1)}%`, margin, y);
        y += 6;
        pdf.text(`Grade: ${card.grade ?? '—'}`, margin, y);
        pdf.setFont('helvetica', 'normal');
      }
      const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Result-Card-${safeName}-${initialExam.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      showSuccess('Result card downloaded');
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to download');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await apiClient<{ results: ResultCardDto[] }>(`/exams/${examId}/calculate-results`, {
        method: 'POST',
      });
      setResultCards(res.results ?? []);
      showSuccess('Results calculated and saved');
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to calculate results');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.EXAMS_VIEW(examId)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Results — {initialExam.title}</h1>
            <p className="text-slate-700 text-sm">
              {initialExam.class?.name}{initialExam.section?.name ? ` (${initialExam.section.name})` : ''}
            </p>
          </div>
        </div>
        {initialExam.status !== 'RESULT_PUBLISHED' && (
          <Button onClick={handleCalculate} disabled={calculating}>
            {calculating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
            Calculate results
          </Button>
        )}
      </div>

      <PaginatedDataTable
        title={
          <div className="space-y-1">
            <span>Result cards</span>
            <p className="text-sm font-normal text-slate-700">
              Total, percentage, and grade per student. Run &quot;Calculate results&quot; after marks are entered.
            </p>
          </div>
        }
        columns={RESULT_COLUMNS}
        loading={false}
        isEmpty={resultCards.length === 0}
        emptyContent={
          <div className="text-center py-12 text-slate-700">
            <p>No result cards yet. Enter marks for exam subjects, then click &quot;Calculate results&quot;.</p>
          </div>
        }
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedCards.map((card) => {
          const studentName = card.student
            ? `${card.student.firstName} ${card.student.lastName}`
            : card.studentId;
          return (
            <tr key={card.studentId}>
              <td className="py-3 px-4 font-medium">{studentName}</td>
              <td className="py-3 px-4 text-right">{card.obtainedMarks}</td>
              <td className="py-3 px-4 text-right">{card.totalMarks}</td>
              <td className="py-3 px-4 text-right">{card.percentage.toFixed(1)}%</td>
              <td className="py-3 px-4 text-right font-medium">{card.grade ?? '—'}</td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="View result card"
                    onClick={() => openResultCard(card.studentId)}
                  >
                    <Eye className="w-4 h-4 text-slate-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Download result card"
                    onClick={() => downloadResultCard(card.studentId, studentName)}
                    disabled={downloadingId === card.studentId}
                  >
                    {downloadingId === card.studentId ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    ) : (
                      <Download className="w-4 h-4 text-slate-700" />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </PaginatedDataTable>

      <Dialog open={!!viewCardStudentId} onOpenChange={(open) => !open && closeResultCard()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Result card</DialogTitle>
            <DialogDescription>
              {initialExam.title}
              {initialExam.class?.name && ` — ${initialExam.class.name}${initialExam.section?.name ? ` ${initialExam.section.name}` : ''}`}
            </DialogDescription>
          </DialogHeader>
          {loadingReportCard ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
            </div>
          ) : reportCardData ? (
            <>
              <p className="font-medium text-slate-800">
                {reportCardData.student.firstName} {reportCardData.student.lastName}
              </p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left py-2 px-3 font-medium">Subject</th>
                      <th className="text-right py-2 px-3 font-medium">Obtained</th>
                      <th className="text-right py-2 px-3 font-medium">Total</th>
                      <th className="text-right py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const subjectRows = getSubjectRows(initialExam, reportCardData);
                      return subjectRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-700">
                            No subjects in this exam.
                          </td>
                        </tr>
                      ) : (
                        subjectRows.map((row) => (
                          <tr key={row.subjectName} className="border-b last:border-0">
                            <td className="py-2 px-3">{row.subjectName}</td>
                            <td className="py-2 px-3 text-right">{row.obtainedMarks ?? '—'}</td>
                            <td className="py-2 px-3 text-right">{row.totalMarks}</td>
                            <td className="py-2 px-3 text-right">
                              {row.obtainedMarks != null
                                ? row.obtainedMarks >= row.passingMarks
                                  ? 'Pass'
                                  : 'Fail'
                                : '—'}
                            </td>
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              {(() => {
                const card = reportCardData.resultCards.find((c) => c.examId === examId);
                return card ? (
                  <p className="text-sm text-slate-800">
                    Total: <strong>{card.obtainedMarks}</strong> / {card.totalMarks} — {card.percentage.toFixed(1)}% — Grade: <strong>{card.grade ?? '—'}</strong>
                  </p>
                ) : null;
              })()}
              <DialogFooter>
                <Button variant="outline" onClick={closeResultCard}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const name = `${reportCardData.student.firstName} ${reportCardData.student.lastName}`;
                    downloadResultCard(reportCardData.student.id, name);
                  }}
                  disabled={!!downloadingId}
                >
                  {downloadingId === reportCardData.student.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download result card
                </Button>
              </DialogFooter>
            </>
          ) : viewCardStudentId && !loadingReportCard ? (
            <p className="text-sm text-slate-700 py-4">Could not load result card.</p>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertComponent />
    </div>
  );
}
