'use client';

import { useMemo } from 'react';
import type { Student, StudentFeePayment } from '@/types';
import { getStudentFeePaymentsByStudent } from '@/lib/student-fee-storage';
import { getClasses } from '@/lib/class-storage';

export interface StudentFeeSummary {
  totalFees: number;
  totalPaid: number;
  totalOutstanding: number;
  admissionFee: {
    amount: number;
    discountAmount: number;
    finalAmount: number;
    status: 'Paid' | 'Unpaid' | 'Partial' | 'NotSet';
    paidAmount?: number;
    outstanding: number;
    payment?: StudentFeePayment;
  } | null;
  monthlyTuition: {
    baseAmount: number;
    discountAmount: number;
    finalAmount: number;
    monthlyPayments: Array<{
      month: number;
      year: number;
      amount: number;
      status: 'Paid' | 'Unpaid' | 'Partial';
      paidAmount?: number;
      outstanding: number;
      dueDate: Date;
      payment: StudentFeePayment;
    }>;
    totalOutstanding: number;
    totalPaid: number;
  } | null;
}

export function useStudentFeeSummary(student: Student | null): StudentFeeSummary {
  const summary = useMemo(() => {
    if (!student) {
      return {
        totalFees: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        admissionFee: null,
        monthlyTuition: null,
      };
    }

    const allPayments = getStudentFeePaymentsByStudent(student.id);
    
    // Calculate admission fee
    let admissionFee = null;
    if (student.admissionFee !== undefined && student.admissionFee !== null) {
      const baseAmount = student.admissionFee || 0;
      // Admission fee doesn't have discount, use amount directly
      const discountAmount = 0;
      const finalAmount = baseAmount;
      
      const admissionPayment = allPayments.find(p => p.feeType === 'Admission');
      const paidAmount = admissionPayment?.paidAmount || 0;
      const status = admissionPayment?.status || 'NotSet';
      const outstanding = finalAmount - paidAmount;
      
      admissionFee = {
        amount: baseAmount,
        discountAmount,
        finalAmount,
        status: status as 'Paid' | 'Unpaid' | 'Partial' | 'NotSet',
        paidAmount: admissionPayment ? paidAmount : undefined,
        outstanding: outstanding > 0 ? outstanding : 0,
        payment: admissionPayment,
      };
    }

    // Calculate monthly tuition fees
    let monthlyTuition = null;
    if (student.discountedFee !== undefined) {
      const finalAmount = student.discountedFee;
      // Get standard fee from class to calculate discount amount
      const classId = student.classId || student.classApplyingFor;
      let standardFee = 0;
      if (classId) {
        const classes = getClasses();
        const cls = classes.find(c => c.id === classId);
        standardFee = cls?.standardFee || 0;
      }
      const discountAmount = standardFee > 0 ? standardFee - finalAmount : 0;
      
      const monthlyPayments = allPayments
        .filter(p => p.feeType === 'MonthlyTuition')
        .map(payment => ({
          month: payment.month!,
          year: payment.year!,
          amount: finalAmount,
          status: payment.status,
          paidAmount: payment.paidAmount,
          outstanding: payment.status === 'Paid' ? 0 : (payment.status === 'Partial' ? payment.finalAmount - (payment.paidAmount || 0) : payment.finalAmount),
          dueDate: payment.dueDate,
          payment,
        }))
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
      
      const totalOutstanding = monthlyPayments.reduce((sum, p) => sum + p.outstanding, 0);
      const totalPaid = monthlyPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      
      monthlyTuition = {
        baseAmount: standardFee, // Use standardFee as baseAmount for monthly tuition
        discountAmount,
        finalAmount,
        monthlyPayments,
        totalOutstanding,
        totalPaid,
      };
    }

    // Calculate totals
    const admissionTotal = admissionFee ? admissionFee.finalAmount : 0;
    const admissionPaid = admissionFee ? (admissionFee.paidAmount || 0) : 0;
    const admissionOutstanding = admissionFee ? admissionFee.outstanding : 0;
    
    const monthlyTotal = monthlyTuition ? monthlyTuition.monthlyPayments.length * monthlyTuition.finalAmount : 0;
    const monthlyPaid = monthlyTuition ? monthlyTuition.totalPaid : 0;
    const monthlyOutstanding = monthlyTuition ? monthlyTuition.totalOutstanding : 0;
    
    const totalFees = admissionTotal + monthlyTotal;
    const totalPaid = admissionPaid + monthlyPaid;
    const totalOutstanding = admissionOutstanding + monthlyOutstanding;

    return {
      totalFees,
      totalPaid,
      totalOutstanding,
      admissionFee,
      monthlyTuition,
    };
  }, [student]);

  return summary;
}
