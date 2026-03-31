'use client';

import { useMemo } from 'react';
import type { Teacher, StaffSalaryPayment } from '@/types';
import { getStaffSalaryPaymentsByStaff } from '@/lib/staff-salary-storage';

export interface StaffSalarySummary {
  totalSalaries: number;
  totalPaid: number;
  totalOutstanding: number;
  monthlyPayments: Array<{
    payment: StaffSalaryPayment;
    month: number;
    year: number;
    amount: number;
    status: string;
    outstanding: number;
    dueDate: Date;
  }>;
}

export function useStaffSalarySummary(staff: Teacher | null): StaffSalarySummary {
  return useMemo(() => {
    if (!staff) {
      return {
        totalSalaries: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        monthlyPayments: [],
      };
    }

    const allPayments = getStaffSalaryPaymentsByStaff(staff.id);
    
    // Calculate totals
    const totalSalaries = allPayments.reduce((sum, p) => sum + p.finalAmount, 0);
    const totalPaid = allPayments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.finalAmount, 0) +
      allPayments
        .filter(p => p.status === 'Partial')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalOutstanding = totalSalaries - totalPaid;

    // Group monthly payments
    const monthlyPayments = allPayments
      .filter(p => p.month && p.year)
      .map(payment => ({
        payment,
        month: payment.month,
        year: payment.year,
        amount: payment.finalAmount,
        status: payment.status,
        outstanding: payment.status === 'Paid' 
          ? 0 
          : payment.finalAmount - (payment.paidAmount || 0),
        dueDate: payment.dueDate,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    return {
      totalSalaries,
      totalPaid,
      totalOutstanding,
      monthlyPayments,
    };
  }, [staff]);
}
