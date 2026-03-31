'use client';

import { useState, useMemo, useEffect } from 'react';
import { DollarSign, Filter, X, Download, CheckCircle, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { apiClient } from '@/lib/api-client';
import { getSchoolById } from '@/lib/storage';
import { getFeeSettings, hasBankDetails } from '@/lib/fee-settings-storage';
import { updateFee } from '@/actions/finance';
import type {
  Student,
  Section,
  Class,
  StudentFeePayment,
  PaymentStatus,
  User,
} from '@/types';
import {
  BackendFeesListResponse,
  mapBackendFeeTypeToFrontend,
  mapBackendStatusToFrontend,
} from '../../components/feesTypes';
import { getStorageUrl } from '@/lib/storage-url';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const COLLECT_FEES_COLUMNS: DataTableColumn[] = [
  { id: 'student', label: 'Student Details' },
  { id: 'breakdown', label: 'Fees Breakdown' },
  { id: 'total', label: 'Total Amount', align: 'right' },
  { id: 'paid', label: 'Paid', align: 'right' },
  { id: 'remaining', label: 'Remaining', align: 'right' },
  { id: 'status', label: 'Status', className: 'text-center' },
  { id: 'actions', label: 'Actions', className: 'text-center' },
];

interface StudentAvatarProps {
  student: Student | undefined;
  displayName: string;
}

const StudentAvatar = ({ student, displayName }: StudentAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const photoUrl = getStorageUrl(student?.studentPhoto);

  if (photoUrl && !imageError) {
    return (
      <img
        src={photoUrl}
        alt={displayName}
        className="w-8 h-8 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-800 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-slate-700/20">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
};

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

interface CollectFeeClientPageProps {
  initialUser: User | null;
  initialClasses: Class[];
  initialStudents: Student[];
  initialSections: Section[];
  initialPayments: StudentFeePayment[];
}

export function CollectFeeClientPage({
  initialUser,
  initialClasses,
  initialStudents,
  initialSections,
  initialPayments,
}: CollectFeeClientPageProps) {
  const user = initialUser;
  const classes = initialClasses;
  const [students] = useState<Student[]>(initialStudents);
  const [sections] = useState<Section[]>(initialSections);
  const [payments, setPayments] = useState<StudentFeePayment[]>(initialPayments);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, showConfirm, AlertComponent, ConfirmComponent } = useAlert();

  // Filter states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | ''>('Unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const refreshPayments = async () => {
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
      console.error('Failed to refresh payments:', error);
      showError('Failed to refresh payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const schoolStudents = useMemo(() => {
    return user?.schoolId
      ? students.filter((s) => s.schoolId === user.schoolId && s.isActive)
      : students.filter((s) => s.isActive);
  }, [students, user?.schoolId]);

  const schoolClasses = useMemo(() => {
    return user?.schoolId
      ? classes.filter((c) => c.schoolId === user.schoolId && c.isActive)
      : classes.filter((c) => c.isActive);
  }, [classes, user?.schoolId]);

  const schoolSections = useMemo(() => {
    return user?.schoolId
      ? sections.filter((s) => s.schoolId === user.schoolId && s.isActive)
      : sections.filter((s) => s.isActive);
  }, [sections, user?.schoolId]);

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

  // Filter payments - only show Unpaid and Partial
  const filteredPayments = useMemo(() => {
    let filtered = payments.filter((p) => p.status === 'Unpaid' || p.status === 'Partial');

    if (selectedClassId) {
      const studentIdsInClass = schoolStudents
        .filter((s) => s.classId === selectedClassId || s.classApplyingFor === selectedClassId)
        .map((s) => s.id);
      filtered = filtered.filter((p) => studentIdsInClass.includes(p.studentId));
    }

    if (selectedSectionId) {
      const studentIdsInSection = schoolStudents
        .filter((s) => s.sectionId === selectedSectionId)
        .map((s) => s.id);
      filtered = filtered.filter((p) => studentIdsInSection.includes(p.studentId));
    }

    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const student = schoolStudents.find((s) => s.id === p.studentId);
        if (!student) return false;
        const name = getStudentName(p.studentId).toLowerCase();
        const className = getClassName(p.studentId).toLowerCase();
        const sectionName = getSectionName(p.studentId).toLowerCase();
        return name.includes(query) || className.includes(query) || sectionName.includes(query);
      });
    }

    const schoolStudentIds = new Set(schoolStudents.map((s) => s.id));
    filtered = filtered.filter((p) => schoolStudentIds.has(p.studentId));

    return filtered.sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [
    payments,
    selectedClassId,
    selectedSectionId,
    selectedStatus,
    searchQuery,
    schoolStudents,
    classes,
    sections,
  ]);

  // Group payments by student
  const groupedByStudent = useMemo(() => {
    const studentMap = new Map<
      string,
      {
        student: Student;
        monthlyPayments: StudentFeePayment[];
        addOnPayments: StudentFeePayment[];
        totalAmount: number;
        totalPaid: number;
        totalRemaining: number;
        overallStatus: PaymentStatus;
      }
    >();

    filteredPayments.forEach((payment) => {
      const student = schoolStudents.find((s) => s.id === payment.studentId);
      if (!student) return;

      if (!studentMap.has(student.id)) {
        studentMap.set(student.id, {
          student,
          monthlyPayments: [],
          addOnPayments: [],
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          overallStatus: 'Unpaid',
        });
      }

      const group = studentMap.get(student.id)!;

      if (payment.feeType === 'MonthlyTuition') {
        group.monthlyPayments.push(payment);
      } else if (payment.feeType !== 'Admission') {
        group.addOnPayments.push(payment);
      }

      group.totalAmount += payment.finalAmount;
      group.totalPaid += payment.paidAmount || 0;
    });

    // Calculate remaining and overall status for each group
    studentMap.forEach((group) => {
      group.totalRemaining = group.totalAmount - group.totalPaid;

      if (group.totalRemaining === 0) {
        group.overallStatus = 'Paid';
      } else if (group.totalPaid > 0) {
        group.overallStatus = 'Partial';
      } else {
        group.overallStatus = 'Unpaid';
      }
    });

    return Array.from(studentMap.values()).filter((group) => group.totalRemaining > 0);
  }, [filteredPayments, schoolStudents]);

  const totalGrouped = groupedByStudent.length;
  const paginatedGrouped = useMemo(() => {
    const start = (page - 1) * pageSize;
    return groupedByStudent.slice(start, start + pageSize);
  }, [groupedByStudent, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedClassId, selectedSectionId, selectedStatus, searchQuery]);

  const handleCollectFee = async (
    studentId: string,
    payments: StudentFeePayment[],
    totalRemaining: number,
  ) => {
    const student = schoolStudents.find((s) => s.id === studentId);
    if (!student) return;

    const amountStr = paymentAmounts[studentId] || totalRemaining.toString();
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    if (amount > totalRemaining) {
      showError(`Payment amount cannot exceed remaining amount (${formatCurrency(totalRemaining)})`);
      return;
    }

    const studentName = getStudentName(studentId);
    const confirmed = await showConfirm(
      `Collect ${formatCurrency(amount)} from ${studentName}?`,
      'Collect Fee',
      'Collect',
      'Cancel',
    );

    if (!confirmed) return;

    try {
      // Distribute payment proportionally across all outstanding payments
      let remainingToDistribute = amount;
      const paymentDate = new Date().toISOString();

      // Sort payments by remaining amount (smallest first to pay off completely)
      const sortedPayments = [...payments].sort((a, b) => {
        const aRemaining = a.finalAmount - (a.paidAmount || 0);
        const bRemaining = b.finalAmount - (b.paidAmount || 0);
        return aRemaining - bRemaining;
      });

      // Update each payment via API
      for (const payment of sortedPayments) {
        if (remainingToDistribute <= 0) break;

        const paymentRemaining = payment.finalAmount - (payment.paidAmount || 0);
        const amountToPay = Math.min(remainingToDistribute, paymentRemaining);

        const newPaidAmount = (payment.paidAmount || 0) + amountToPay;
        const newStatus =
          newPaidAmount >= payment.finalAmount
            ? 'PAID'
            : newPaidAmount > 0
              ? 'PARTIAL'
              : 'UNPAID';

        const result = await updateFee(payment.id, {
          paidAmount: newPaidAmount,
          paymentDate: paymentDate,
          status: newStatus,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to update fee');
        }

        remainingToDistribute -= amountToPay;
      }

      setPaymentAmounts((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      await refreshPayments();
      showSuccess('Fee collected successfully');
    } catch (error) {
      console.error('Failed to collect fee:', error);
      showError('Failed to collect fee. Please try again.');
    }
  };

  const handleDownloadInvoice = async (payment: StudentFeePayment) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();

      const school = user?.schoolId ? getSchoolById(user.schoolId) : null;
      const feeSettings = user?.schoolId ? getFeeSettings(user.schoolId) : null;
      const showBankDetails = hasBankDetails(feeSettings);
      const student = schoolStudents.find((s) => s.id === payment.studentId);
      if (!student) {
        showError('Student not found');
        return;
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      const blackColor = [0, 0, 0];
      const grayColor = [100, 100, 100];

      // Header
      if (school) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.text(school.name, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;

        if (school.campusName) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(school.campusName, pageWidth / 2, yPos, { align: 'center' });
          yPos += 5;
        }

        pdf.setFontSize(9);
        if (school.address) {
          pdf.text(school.address, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
        }

        if (school.phone) {
          pdf.text(`Phone: ${school.phone}`, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
        }

        if (showBankDetails && feeSettings) {
          yPos += 6;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Bank details for fee payment', pageWidth / 2, yPos, { align: 'center' });
          yPos += 5;
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Bank: ${feeSettings.bankName}`, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
          pdf.text(`Account title: ${feeSettings.accountTitle}`, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
          pdf.text(`Account no: ${feeSettings.accountNumber}`, pageWidth / 2, yPos, { align: 'center' });
          if (feeSettings.iban) {
            yPos += 4;
            pdf.text(`IBAN: ${feeSettings.iban}`, pageWidth / 2, yPos, { align: 'center' });
          }
          if (feeSettings.branch) {
            yPos += 4;
            pdf.text(`Branch: ${feeSettings.branch}`, pageWidth / 2, yPos, { align: 'center' });
          }
        }
      }

      yPos += 8;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAYMENT INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Invoice Number and Date
      const invoiceNumber = `INV-${payment.id.substring(0, 8).toUpperCase()}-${Date.now()
        .toString()
        .slice(-6)}`;
      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice No: ${invoiceNumber}`, margin, yPos);
      pdf.text(`Date: ${dateStr}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 12;

      // Student Information
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Student Information', margin, yPos);
      yPos += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const studentName = getStudentName(payment.studentId);
      pdf.text(`Name: ${studentName}`, margin, yPos);
      yPos += 6;

      pdf.text(`Class: ${getClassName(payment.studentId)}`, margin, yPos);
      pdf.text(`Section: ${getSectionName(payment.studentId)}`, pageWidth / 2, yPos);
      yPos += 6;

      if (student.bFormCrc) {
        pdf.text(`B-Form/CRC: ${student.bFormCrc}`, margin, yPos);
        yPos += 6;
      }

      yPos += 8;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Payment Details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Details', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      const rowHeight = 6;
      const col1X = margin;
      const col2X = pageWidth - margin - 50;

      pdf.text(`Fee Type: ${payment.feeType}`, col1X, yPos);
      yPos += rowHeight;

      pdf.text(`Due Date: ${new Date(payment.dueDate).toLocaleDateString('en-GB')}`, col1X, yPos);
      yPos += rowHeight;

      pdf.text(`Amount: ${formatCurrency(payment.amount)}`, col1X, yPos);
      if (payment.discountAmount > 0) {
        pdf.text(`Discount: -${formatCurrency(payment.discountAmount)}`, col1X + 50, yPos);
      }
      yPos += rowHeight;

      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Amount: ${formatCurrency(payment.finalAmount)}`, col1X, yPos);
      yPos += rowHeight + 3;

      pdf.setFont('helvetica', 'normal');
      if (payment.paidAmount) {
        pdf.text(`Paid Amount: ${formatCurrency(payment.paidAmount)}`, col1X, yPos);
        yPos += rowHeight;
      }

      pdf.text(`Status: ${payment.status}`, col1X, yPos);
      if (payment.paymentDate) {
        pdf.text(
          `Payment Date: ${new Date(payment.paymentDate).toLocaleDateString('en-GB')}`,
          col1X + 50,
          yPos,
        );
      }
      yPos += rowHeight + 3;

      // Footer
      yPos = pageHeight - 20;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.text(
        'This is a computer-generated invoice. No signature required.',
        pageWidth / 2,
        yPos,
        { align: 'center' },
      );

      const fileName = `Invoice-${studentName.replace(/[^a-zA-Z0-9]/g, '_')}-${invoiceNumber}.pdf`;
      pdf.save(fileName);

      showSuccess('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      showError('Failed to generate invoice. Please try again.');
    }
  };

  const clearFilters = () => {
    setSelectedClassId('');
    setSelectedSectionId('');
    setSelectedStatus('Unpaid');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedClassId ||
    selectedSectionId ||
    selectedStatus !== 'Unpaid' ||
    searchQuery.trim() !== '';

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collect Fee</h1>
          <p className="text-slate-700 mt-1">Collect fees from students</p>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <DollarSign className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-700">Loading payments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Collect Fee</h1>
        <p className="text-slate-700 mt-1">Collect fees from students</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-800" />
              <input
                type="text"
                placeholder="Search by name, class, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              />
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId('');
              }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
            >
              <option value="">All Classes</option>
              {schoolClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!selectedClassId}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {schoolSections
                .filter((s) => !selectedClassId || s.classId === selectedClassId)
                .map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PaymentStatus | '')}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
            >
              <option value="">All Status</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={`Outstanding Payments (${totalGrouped})`}
        columns={COLLECT_FEES_COLUMNS}
        isEmpty={totalGrouped === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">No outstanding payments</p>
            <p className="text-sm text-slate-700 mt-1">All fees have been collected</p>
          </div>
        }
        totalCount={totalGrouped}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedGrouped.map((group) => {
          const displayName = getStudentName(group.student.id);
          const allPayments = [...group.monthlyPayments, ...group.addOnPayments];
          const paymentAmount = paymentAmounts[group.student.id] || group.totalRemaining.toString();
          const allPaid = group.overallStatus === 'Paid';

          return (
            <tr key={group.student.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <StudentAvatar student={group.student} displayName={displayName} />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{displayName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {getClassName(group.student.id)} • {getSectionName(group.student.id)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex flex-col gap-1.5">
                  {group.monthlyPayments.map((payment) => (
                    <div key={payment.id} className="text-xs">
                      <span className="text-gray-900 font-medium">Monthly Tuition</span>
                      {payment.month && payment.year && (
                        <span className="text-gray-500 ml-1">
                          ({new Date(payment.year, payment.month - 1).toLocaleDateString(
                            'en-GB',
                            { month: 'short', year: 'numeric' },
                          )})
                        </span>
                      )}
                      <span className="text-gray-600 ml-2">
                        {formatCurrency(payment.finalAmount)}
                      </span>
                    </div>
                  ))}
                  {group.addOnPayments.map((payment) => (
                    <div key={payment.id} className="text-xs">
                      <span className="text-gray-900 font-medium">{payment.feeType}</span>
                      <span className="text-gray-600 ml-2">
                        {formatCurrency(payment.finalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(group.totalAmount)}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-sm text-gray-600">
                  {formatCurrency(group.totalPaid)}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(group.totalRemaining)}
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${group.overallStatus === 'Paid'
                    ? 'bg-green-100 text-green-700'
                    : group.overallStatus === 'Partial'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}
                >
                  {group.overallStatus}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-center gap-2">
                  {allPaid ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadInvoice(allPayments[0])}
                      className="text-xs px-3 py-1.5 h-auto"
                      title="Download Invoice"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Invoice
                    </Button>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) =>
                          setPaymentAmounts((prev) => ({
                            ...prev,
                            [group.student.id]: e.target.value,
                          }))
                        }
                        min="0"
                        max={group.totalRemaining}
                        step="0.01"
                        className="w-24 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                        placeholder="Amount"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleCollectFee(group.student.id, allPayments, group.totalRemaining)
                        }
                        className="text-xs px-3 py-1.5 h-auto"
                        title="Collect Fee"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Collect
                      </Button>
                      {group.overallStatus === 'Partial' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoice(allPayments[0])}
                          className="text-xs px-2 py-1.5 h-auto"
                          title="Download Invoice"
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </PaginatedDataTable>

      <AlertComponent />
      <ConfirmComponent />
    </div>
  );
}
