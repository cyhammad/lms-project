import type {
  Class,
  PaymentStatus,
  Student,
  StudentFeePayment,
} from '@/types';

export const formatCurrency = (amount: number) =>
  `PKR ${amount.toLocaleString()}`;

export const getStandardFee = (student: Student, classes: Class[]) => {
  const classId = student.classId || student.classApplyingFor;
  if (!classId) return 0;
  const cls = classes.find((c) => c.id === classId);
  return cls?.standardFee || 0;
};

export const getStudentPaymentStatus = (
  student: Student,
  getStudentPayments: (studentId: string) => StudentFeePayment[],
): PaymentStatus => {
  const allPayments = getStudentPayments(student.id);
  const monthlyPayments = allPayments.filter(
    (p) => p.feeType === 'MonthlyTuition',
  );
  if (monthlyPayments.length === 0) return 'Unpaid';

  const hasUnpaid = monthlyPayments.some((p) => p.status === 'Unpaid');
  const hasPartial = monthlyPayments.some((p) => p.status === 'Partial');
  const allPaid = monthlyPayments.every((p) => p.status === 'Paid');

  if (hasUnpaid) return 'Unpaid';
  if (hasPartial) return 'Partial';
  if (allPaid) return 'Paid';
  return 'Unpaid';
};

export const buildStats = (payments: StudentFeePayment[]) => {
  const total = payments.length;
  const paid = payments.filter((p) => p.status === 'Paid').length;
  const unpaid = payments.filter((p) => p.status === 'Unpaid').length;
  const partial = payments.filter((p) => p.status === 'Partial').length;
  const totalAmount = payments.reduce((sum, p) => sum + p.finalAmount, 0);
  const paidAmount = payments
    .filter((p) => p.status === 'Paid' || p.status === 'Partial')
    .reduce((sum, p) => sum + (p.paidAmount || p.finalAmount), 0);
  const outstandingAmount = payments
    .filter((p) => p.status === 'Unpaid' || p.status === 'Partial')
    .reduce((sum, p) => sum + (p.finalAmount - (p.paidAmount || 0)), 0);

  return { total, paid, unpaid, partial, totalAmount, paidAmount, outstandingAmount };
};

export const buildAvailableYears = (payments: StudentFeePayment[]) => {
  const years = new Set<number>();
  payments.forEach((p) => {
    if (p.year) {
      years.add(p.year);
    } else {
      years.add(new Date(p.dueDate).getFullYear());
    }
  });
  return Array.from(years).sort((a, b) => b - a);
};

