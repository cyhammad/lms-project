'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentFeePayments } from '@/hooks/use-student-fee-payments';
import { useStudentFeeSummary } from '@/hooks/use-student-fee-summary';
import { useClasses } from '@/hooks/use-classes';
import { useSections } from '@/hooks/use-sections';
import { useAlert } from '@/hooks/use-alert';
import { getSchoolById } from '@/lib/storage';
import { getFeeSettings, hasBankDetails } from '@/lib/fee-settings-storage';
import { generateSinglePaymentChallanPdf } from '@/app/admin/fees/components/feesPdf';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/constants/routes';
import type { Student, StudentFeePayment, FeeType } from '@/types';

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function useStudentFeesPage(studentId: string, user: any) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [showEditModal, setShowEditModal] = useState<{ payment: StudentFeePayment } | null>(null);
  const [editStandardFee, setEditStandardFee] = useState('');
  const [editDiscountedFee, setEditDiscountedFee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFeeType, setAddFeeType] = useState<FeeType>('Fine');
  const [addStandardFee, setAddStandardFee] = useState('');
  const [addDiscountedFee, setAddDiscountedFee] = useState('');
  const [addDueDate, setAddDueDate] = useState('');
  const [addMonth, setAddMonth] = useState('');
  const [addYear, setAddYear] = useState('');

  const [unpaidConfirmPaymentId, setUnpaidConfirmPaymentId] = useState<string | null>(null);

  const {
    markPaymentAsPaid,
    updatePayment,
    refresh,
    payments,
    createPayment,
    getStudentPayments,
  } = useStudentFeePayments();
  const { classes } = useClasses();
  const { sections } = useSections();
  const { showError, showSuccess } = useAlert();
  const feeSummary = useStudentFeeSummary(student);

  useEffect(() => {
    if (!studentId) return;

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await apiClient<{ student: Student }>(`/students/${studentId}`);

        if (!data.student) {
          router.push(ROUTES.ADMIN.STUDENTS);
          return;
        }

        setStudent(data.student);
      } catch (error) {
        console.error('Failed to load student:', error);
        showError('Failed to load student. Please try again.');
        router.push(ROUTES.ADMIN.FEES.HISTORY);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, router, showError]);

  const getStandardFee = () => {
    if (!student) return 0;
    const classId = student.classId || student.classApplyingFor;
    if (!classId) return 0;
    const cls = classes.find((c) => c.id === classId);
    return cls?.standardFee || 0;
  };

  useEffect(() => {
    if (student && student.admissionFee !== undefined && student.admissionFee !== null) {
      const studentPayments = payments.filter((p) => p.studentId === student.id);
      const admissionPayment = studentPayments.find((p) => p.feeType === 'Admission');
      if (!admissionPayment) {
        const baseAmount = student.admissionFee || 0;
        const finalAmount = baseAmount;
        createPayment({
          studentId: student.id,
          feeType: 'Admission',
          amount: baseAmount,
          discountAmount: 0,
          finalAmount,
          dueDate: student.admissionDate,
          status: 'Unpaid',
        });
      }
    }
  }, [student, payments, createPayment]);

  const getStudentName = (id: string) => {
    if (!student || student.id !== id) return 'Unknown';
    return (
      student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A'
    );
  };

  const getClassName = (id: string) => {
    if (!student || student.id !== id) return 'N/A';
    const classId = student.classId || student.classApplyingFor;
    if (!classId) return 'N/A';
    const cls = classes.find((c) => c.id === classId);
    return cls?.name || 'N/A';
  };

  const getSectionName = (id: string) => {
    if (!student || student.id !== id || !student.sectionId) return 'N/A';
    const section = sections.find((s) => s.id === student.sectionId);
    return section?.name || 'N/A';
  };

  const studentPayments = useMemo(
    () => (student ? payments.filter((p) => p.studentId === student.id) : []),
    [payments, student],
  );

  const admissionFee = useMemo(
    () => studentPayments.find((p) => p.feeType === 'Admission'),
    [studentPayments],
  );

  const displayName =
    student &&
    (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A');

  const handleMarkAsPaid = (paymentId: string, finalAmount: number) => {
    const amount = parseFloat(paymentAmount) || finalAmount;
    if (amount <= 0) {
      alert('LMS: Payment amount must be greater than 0');
      return;
    }
    markPaymentAsPaid(paymentId, amount, new Date());
    setShowPaymentModal(null);
    setPaymentAmount('');
    refresh();
  };

  const handleMarkAsUnpaid = (paymentId: string) => {
    setUnpaidConfirmPaymentId(paymentId);
  };

  const confirmMarkAsUnpaid = () => {
    if (!unpaidConfirmPaymentId) return;
    updatePayment(unpaidConfirmPaymentId, {
      status: 'Unpaid',
      paidAmount: 0,
      paymentDate: undefined,
    });
    refresh();
    setUnpaidConfirmPaymentId(null);
  };

  const cancelUnpaidConfirm = () => {
    setUnpaidConfirmPaymentId(null);
  };

  const openEditModal = (payment: StudentFeePayment) => {
    setShowEditModal({ payment });
    const standardFee = payment.feeType === 'MonthlyTuition' ? getStandardFee() : payment.amount;
    const discountedFee = payment.finalAmount;
    setEditStandardFee(standardFee.toString());
    setEditDiscountedFee(discountedFee.toString());
    setEditDueDate(new Date(payment.dueDate).toISOString().split('T')[0]);
  };

  const closeEditModal = () => {
    setShowEditModal(null);
    setEditStandardFee('');
    setEditDiscountedFee('');
    setEditDueDate('');
  };

  const handleSaveEdit = () => {
    if (!showEditModal) return;
    const standardFeeNum = parseFloat(editStandardFee);
    const discountedFeeNum = parseFloat(editDiscountedFee);
    if (!standardFeeNum || standardFeeNum <= 0) {
      alert('Please enter a valid standard fee');
      return;
    }
    if (discountedFeeNum < 0) {
      alert('Discounted fee cannot be negative');
      return;
    }
    if (discountedFeeNum > standardFeeNum) {
      alert('Discounted fee cannot be greater than standard fee');
      return;
    }
    if (!editDueDate) {
      alert('Please select a due date');
      return;
    }
    const discountAmount = standardFeeNum - discountedFeeNum;
    const dueDateObj = new Date(editDueDate);
    updatePayment(showEditModal.payment.id, {
      amount: standardFeeNum,
      discountAmount,
      finalAmount: discountedFeeNum,
      dueDate: dueDateObj,
    });
    refresh();
    closeEditModal();
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setAddFeeType('Fine');
    const standardFee = getStandardFee();
    setAddStandardFee(standardFee.toString());
    setAddDiscountedFee(standardFee.toString());
    const today = new Date();
    setAddDueDate(today.toISOString().split('T')[0]);
    setAddMonth(String(today.getMonth() + 1));
    setAddYear(String(today.getFullYear()));
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddStandardFee('');
    setAddDiscountedFee('');
    setAddDueDate('');
    setAddMonth('');
    setAddYear('');
  };

  const handleSaveAdd = () => {
    if (!student) return;
    const standardFeeNum = parseFloat(addStandardFee);
    const discountedFeeNum = parseFloat(addDiscountedFee);
    if (!standardFeeNum || standardFeeNum <= 0) {
      alert('LMS: Please enter a valid standard fee');
      return;
    }
    if (discountedFeeNum < 0) {
      alert('LMS: Discounted fee cannot be negative');
      return;
    }
    if (discountedFeeNum > standardFeeNum) {
      alert('LMS: Discounted fee cannot be greater than standard fee');
      return;
    }
    if (!addDueDate) {
      alert('LMS: Please select a due date');
      return;
    }
    const existingPayments = getStudentPayments(student.id);
    if (addFeeType === 'Admission') {
      const existingAdmission = existingPayments.find((p) => p.feeType === 'Admission');
      if (existingAdmission) {
        alert(
          'LMS: This student already has an admission fee. Please edit the existing fee instead.',
        );
        return;
      }
    } else if (addFeeType === 'MonthlyTuition') {
      if (!addMonth || !addYear) {
        alert('LMS: Please select month and year for monthly tuition fee');
        return;
      }
      const monthNum = parseInt(addMonth);
      const yearNum = parseInt(addYear);
      const existingMonthly = existingPayments.find(
        (p) => p.feeType === 'MonthlyTuition' && p.month === monthNum && p.year === yearNum,
      );
      if (existingMonthly) {
        alert(
          `LMS: This student already has a monthly tuition fee for ${MONTH_NAMES_FULL[monthNum - 1]
          } ${yearNum}. Please edit the existing fee instead.`,
        );
        return;
      }
    }
    const discountAmount = standardFeeNum - discountedFeeNum;
    const dueDateObj = new Date(addDueDate);
    createPayment({
      studentId: student.id,
      feeType: addFeeType,
      amount: standardFeeNum,
      discountAmount,
      finalAmount: discountedFeeNum,
      dueDate: dueDateObj,
      status: 'Unpaid',
      month: addMonth ? parseInt(addMonth) : undefined,
      year: addYear ? parseInt(addYear) : undefined,
    });
    refresh();
    closeAddModal();
  };

  const handleDownloadChallan = async (payment: StudentFeePayment) => {
    try {
      if (!student) {
        showError('Student not found');
        return;
      }
      await generateSinglePaymentChallanPdf({
        student,
        payment,
        userSchoolId: user?.schoolId,
        getStudentName,
        getClassName,
        getSectionName,
      });
      showSuccess('Challan downloaded successfully');
    } catch (error) {
      console.error('Error generating challan:', error);
      showError('Failed to generate challan. Please try again.');
    }
  };

  const handleDownloadInvoice = async (payment: StudentFeePayment) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const school = user?.schoolId ? getSchoolById(user.schoolId) : null;
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
      }
      yPos += 8;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAYMENT INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
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
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Student Information', margin, yPos);
      yPos += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const studentName = getStudentName(student.id);
      pdf.text(`Name: ${studentName}`, margin, yPos);
      yPos += 6;
      pdf.text(`Class: ${getClassName(student.id)}`, margin, yPos);
      pdf.text(`Section: ${getSectionName(student.id)}`, pageWidth / 2, yPos);
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
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Details', margin, yPos);
      yPos += 8;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const rowHeight = 6;
      const col1X = margin;
      pdf.text(`Fee Type: ${payment.feeType}`, col1X, yPos);
      if (payment.month && payment.year) {
        pdf.text(`Month: ${MONTH_NAMES_FULL[payment.month - 1]} ${payment.year}`, col1X + 50, yPos);
      }
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
      const fileName = `Invoice-${studentName.replace(/[^a-zA-Z0-9]/g, '_')}-${invoiceNumber}`;
      pdf.save(fileName);
      showSuccess('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      showError('Failed to generate invoice. Please try again.');
    }
  };

  const currentPayment =
    showPaymentModal != null && showPaymentModal !== ''
      ? studentPayments.find((p) => p.id === showPaymentModal) ?? null
      : null;

  return {
    loading,
    student,
    displayName,
    feeSummary,
    studentPayments,
    admissionFee,
    formatCurrency,
    formatDate,
    getStandardFee,
    getStudentName,
    getClassName,
    getSectionName,
    showPaymentModal,
    paymentAmount,
    setShowPaymentModal,
    setPaymentAmount,
    handleMarkAsPaid,
    handleMarkAsUnpaid,
    unpaidConfirmPaymentId,
    confirmMarkAsUnpaid,
    cancelUnpaidConfirm,
    showEditModal,
    editStandardFee,
    editDiscountedFee,
    editDueDate,
    setEditStandardFee,
    setEditDiscountedFee,
    setEditDueDate,
    openEditModal,
    closeEditModal,
    handleSaveEdit,
    showAddModal,
    addFeeType,
    addStandardFee,
    addDiscountedFee,
    addDueDate,
    addMonth,
    addYear,
    setAddFeeType,
    setAddStandardFee,
    setAddDiscountedFee,
    setAddDueDate,
    setAddMonth,
    setAddYear,
    openAddModal,
    closeAddModal,
    handleSaveAdd,
    handleDownloadChallan,
    handleDownloadInvoice,
    currentPayment,
  };
}
