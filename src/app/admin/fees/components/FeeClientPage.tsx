'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAlert } from '@/hooks/use-alert';
import { apiClient } from '@/lib/api-client';
import { downloadCSV } from '@/lib/csv-export';
import type { Class, PaymentStatus, Student, Section, StudentFeePayment, User } from '@/types';
import { FeesHeader } from './FeesHeader';
import { FeesStats } from './FeesStats';
import { FeesFilters } from './FeesFilters';
import { FeesStudentsTable } from './FeesStudentsTable';
import {
  buildAvailableYears,
  buildStats,
  formatCurrency,
  getStandardFee,
  getStudentPaymentStatus,
} from './feesUtils';
import {
  BackendFeesListResponse,
  mapBackendFeeTypeToFrontend,
  mapBackendStatusToFrontend,
} from './feesTypes';
import { generateChallanPdf, generateInvoicePdf } from './feesPdf';

export function FeeClientPage({
  initialUser,
  initialClasses,
  initialStudents,
  initialSections,
}: {
  initialUser: User | null;
  initialClasses: Class[];
  initialStudents: Student[];
  initialSections: Section[];
}) {
  const user = initialUser;
  const classes = initialClasses;
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [sections] = useState<Section[]>(initialSections);
  const [payments, setPayments] = useState<StudentFeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting] = useState(false);

  const { showError, showSuccess, AlertComponent, ConfirmComponent } = useAlert();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | ''>('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingFeeValue, setEditingFeeValue] = useState<string>('');

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('limit', '1000');
        const data = await apiClient<BackendFeesListResponse>(`/fees?${params.toString()}`);
        const normalized: StudentFeePayment[] = data.fees.map((fee) => ({
          id: fee.id,
          studentId: fee.studentId,
          feeType: mapBackendFeeTypeToFrontend(fee.feeType),
          amount: fee.amount,
          discountAmount: fee.discountAmount,
          finalAmount: fee.finalAmount,
          dueDate: new Date(fee.dueDate),
          status: mapBackendStatusToFrontend(fee.status),
          paidAmount: fee.paidAmount ?? undefined,
          paymentDate: fee.paymentDate ? new Date(fee.paymentDate) : undefined,
          month: fee.month ?? undefined,
          year: fee.year ?? undefined,
          notes: fee.notes ?? undefined,
          createdAt: new Date(fee.createdAt),
          updatedAt: new Date(fee.updatedAt),
        }));
        setPayments(normalized);
      } catch (error) {
        console.error('Failed to load fees:', error);
        showError('Failed to load fees. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, [showError]);

  const getStudentPayments = (studentId: string) =>
    payments.filter((p) => p.studentId === studentId);

  const schoolStudents = useMemo(
    () =>
      user?.schoolId ? students.filter((s) => s.schoolId === user.schoolId) : students,
    [students, user?.schoolId],
  );

  const schoolClasses = useMemo(
    () =>
      user?.schoolId
        ? classes.filter((c) => c.schoolId === user.schoolId && c.isActive)
        : classes.filter((c) => c.isActive),
    [classes, user?.schoolId],
  );

  const schoolSections = useMemo(
    () => sections.filter((s) => s.isActive),
    [sections],
  );

  const getStudentName = (studentId: string) => {
    const student = schoolStudents.find((s) => s.id === studentId);
    if (!student) return 'Unknown';
    return (
      student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown'
    );
  };

  const getClassName = (studentId: string) => {
    const student = schoolStudents.find((s) => s.id === studentId);
    if (!student) return 'N/A';
    const classId = student.classId || student.classApplyingFor;
    if (!classId) return 'N/A';
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : 'N/A';
  };

  const getSectionName = (studentId: string) => {
    const student = schoolStudents.find((s) => s.id === studentId);
    if (!student?.sectionId) return 'N/A';
    const section = sections.find((s) => s.id === student.sectionId);
    return section ? section.name : 'N/A';
  };

  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    if (selectedClassId) {
      const ids = schoolStudents
        .filter(
          (s) => s.classId === selectedClassId || s.classApplyingFor === selectedClassId,
        )
        .map((s) => s.id);
      filtered = filtered.filter((p) => ids.includes(p.studentId));
    }
    if (selectedSectionId) {
      const ids = schoolStudents
        .filter((s) => s.sectionId === selectedSectionId)
        .map((s) => s.id);
      filtered = filtered.filter((p) => ids.includes(p.studentId));
    }
    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }
    if (selectedYear) {
      const yearNum = parseInt(selectedYear, 10);
      filtered = filtered.filter((p) =>
        p.year ? p.year === yearNum : new Date(p.dueDate).getFullYear() === yearNum,
      );
    }
    if (selectedMonth) {
      const monthNum = parseInt(selectedMonth, 10);
      filtered = filtered.filter((p) => p.month === monthNum);
    }
    const schoolIds = new Set(schoolStudents.map((s) => s.id));
    filtered = filtered.filter((p) => schoolIds.has(p.studentId));
    return filtered.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );
  }, [
    payments,
    selectedClassId,
    selectedSectionId,
    selectedStatus,
    selectedYear,
    selectedMonth,
    schoolStudents,
  ]);

  const groupedStudents = useMemo(
    () =>
      schoolStudents
        .map((student) => ({
          student,
          payments: filteredPayments.filter((p) => p.studentId === student.id),
        }))
        .filter((entry) => entry.payments.length > 0),
    [filteredPayments, schoolStudents],
  );

  const stats = useMemo(() => buildStats(filteredPayments), [filteredPayments]);
  const availableYears = useMemo(() => buildAvailableYears(payments), [payments]);

  const clearFilters = () => {
    setSelectedClassId('');
    setSelectedSectionId('');
    setSelectedStatus('');
    setSelectedYear('');
    setSelectedMonth('');
  };

  const hasActiveFilters =
    selectedClassId || selectedSectionId || selectedStatus || selectedYear || selectedMonth;

  const handleDeleteAll = () => {
    if (payments.length === 0) {
      showError('No fees to delete');
      return;
    }
    showError(
      'Bulk deleting fees is not supported yet. Please contact support to remove fee records.',
    );
  };

  const handleDownloadCSV = () => {
    const csvData = filteredPayments.map((payment) => ({
      Student: getStudentName(payment.studentId),
      Class: getClassName(payment.studentId),
      Section: getSectionName(payment.studentId),
      'Fee Type': payment.feeType,
      Amount: formatCurrency(payment.finalAmount),
      'Due Date': new Date(payment.dueDate).toLocaleDateString(),
      Status: payment.status,
      'Paid Amount': payment.paidAmount ? formatCurrency(payment.paidAmount) : 'N/A',
    }));
    downloadCSV(csvData, 'fees');
  };

  const handleStartEditFee = (student: Student) => {
    setEditingStudentId(student.id);
    setEditingFeeValue(
      student.discountedFee?.toString() || getStandardFee(student, classes).toString(),
    );
  };

  const handleCancelEditFee = () => {
    setEditingStudentId(null);
    setEditingFeeValue('');
  };

  const handleSaveEditFee = async (student: Student) => {
    const feeValue = parseFloat(editingFeeValue);
    if (isNaN(feeValue) || feeValue < 0) {
      showError('Please enter a valid fee amount');
      return;
    }
    const standardFee = getStandardFee(student, classes);
    if (feeValue > standardFee) {
      showError(
        `Discounted fee cannot be greater than standard fee (PKR ${standardFee.toLocaleString()})`,
      );
      return;
    }
    try {
      await apiClient(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ discountedFee: feeValue }),
      });
      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, discountedFee: feeValue } : s)),
      );
      setEditingStudentId(null);
      setEditingFeeValue('');
      showSuccess('Fee updated successfully');
    } catch (error) {
      console.error('Failed to update fee:', error);
      showError('Failed to update fee');
    }
  };

  const handleDownloadChallan = async (student: Student) => {
    try {
      await generateChallanPdf({
        student,
        userSchoolId: user?.schoolId,
        getStudentName,
        getClassName,
        getSectionName,
        getStandardFee: (s) => getStandardFee(s, classes),
        getStudentPayments,
      });
      showSuccess('Challan downloaded successfully');
    } catch (error) {
      console.error('Error generating challan:', error);
      showError('Failed to generate challan. Please try again.');
    }
  };

  const handleDownloadInvoice = async (student: Student) => {
    try {
      await generateInvoicePdf({
        student,
        userSchoolId: user?.schoolId,
        getStudentName,
        getClassName,
        getSectionName,
        getStudentPayments,
      });
      showSuccess('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      showError('Failed to generate invoice. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">View Challans</h1>
            <p className="text-slate-700 mt-1">
              View and manage all generated challans
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Wallet className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-700">Loading fees...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeesHeader
        paymentsCount={payments.length}
        deleting={deleting}
        onDeleteAll={handleDeleteAll}
      />

      <FeesStats
        total={stats.total}
        paid={stats.paid}
        unpaid={stats.unpaid}
        partial={stats.partial}
        totalAmount={stats.totalAmount}
        paidAmount={stats.paidAmount}
        outstandingAmount={stats.outstandingAmount}
        formatCurrency={formatCurrency}
      />

      <Card>
        <FeesFilters
          selectedClassId={selectedClassId}
          selectedSectionId={selectedSectionId}
          selectedStatus={selectedStatus}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onClassChange={(id) => {
            setSelectedClassId(id);
            setSelectedSectionId('');
          }}
          onSectionChange={setSelectedSectionId}
          onStatusChange={setSelectedStatus}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          schoolClasses={schoolClasses}
          schoolSections={schoolSections}
          availableYears={availableYears}
          hasActiveFilters={!!hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </Card>

      <FeesStudentsTable
        groupedStudents={groupedStudents}
        filteredPaymentsCount={filteredPayments.length}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        getStudentPayments={getStudentPayments}
        getStudentName={getStudentName}
        getClassName={getClassName}
        getSectionName={getSectionName}
        getStandardFee={(s) => getStandardFee(s, classes)}
        getStudentPaymentStatus={(s) => getStudentPaymentStatus(s, getStudentPayments)}
        editingStudentId={editingStudentId}
        editingFeeValue={editingFeeValue}
        onChangeEditingFeeValue={setEditingFeeValue}
        onStartEditFee={handleStartEditFee}
        onCancelEditFee={handleCancelEditFee}
        onSaveEditFee={handleSaveEditFee}
        onDownloadChallan={handleDownloadChallan}
        onDownloadInvoice={handleDownloadInvoice}
        formatCurrency={formatCurrency}
        onDownloadCsv={handleDownloadCSV}
      />

      <AlertComponent />
      <ConfirmComponent />
    </div>
  );
}

