'use client';

import { useMemo, useCallback } from 'react';
import type { FinancialSummary, StudentFeePayment, StaffSalaryPayment, FeeType, StaffType } from '@/types';
import { useStudentFeePayments } from './use-student-fee-payments';
import { useStaffSalaryPayments } from './use-staff-salary-payments';
import { useExpenses } from './use-expenses';
import { useTeachers } from './use-teachers';
import { useStudents } from './use-students';

export function useAccounting() {
  const { payments: feePayments } = useStudentFeePayments();
  const { payments: salaryPayments } = useStaffSalaryPayments();
  const { expenses: apiExpenses } = useExpenses();
  const { teachers } = useTeachers();
  const { students } = useStudents();

  // Get monthly summary
  const getMonthlySummary = useCallback((
    month: number,
    year: number,
    schoolId?: string
  ): FinancialSummary => {
    // Filter fees for the month/year
    const monthFees = feePayments.filter(payment => {
      if (schoolId) {
        const student = students.find(s => s.id === payment.studentId);
        if (!student || student.schoolId !== schoolId) return false;
      }
      return payment.month === month && payment.year === year;
    });

    // Filter salaries for the month/year
    const monthSalaries = salaryPayments.filter(payment => {
      if (schoolId) {
        const teacher = teachers.find(t => t.id === payment.staffId);
        if (!teacher || teacher.schoolId !== schoolId) return false;
      }
      return payment.month === month && payment.year === year;
    });

    // Calculate revenue
    const revenueTotal = monthFees.reduce((sum, p) => sum + p.finalAmount, 0);
    const revenuePaid = monthFees
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.finalAmount, 0) +
      monthFees
        .filter(p => p.status === 'Partial')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const revenueOutstanding = revenueTotal - revenuePaid;

    // Revenue by fee type
    const revenueByFeeType: Partial<Record<FeeType, number>> = {};
    monthFees.forEach(payment => {
      const current = revenueByFeeType[payment.feeType] || 0;
      revenueByFeeType[payment.feeType] = current + payment.finalAmount;
    });

    // Expenses from salary payments
    const salaryExpensesTotal = monthSalaries.reduce((sum, p) => sum + p.finalAmount, 0);
    const expensesPaid = monthSalaries
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.finalAmount, 0) +
      monthSalaries
        .filter(p => p.status === 'Partial')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const expensesOutstanding = salaryExpensesTotal - expensesPaid;

    // Expenses by staff type
    const expensesByStaffType: Partial<Record<StaffType, number>> = {};
    monthSalaries.forEach(payment => {
      const teacher = teachers.find(t => t.id === payment.staffId);
      if (teacher && teacher.staffType) {
        const current = expensesByStaffType[teacher.staffType] || 0;
        expensesByStaffType[teacher.staffType] = current + payment.finalAmount;
      }
    });

    // Other expenses from Expense Management module (filter by schoolId and month/year via createdAt)
    const monthExpenses = apiExpenses.filter(e => {
      if (schoolId && e.schoolId !== schoolId) return false;
      const d = new Date(e.createdAt);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const otherExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesTotal = salaryExpensesTotal + otherExpenses;

    // Calculate profit
    const profit = revenueTotal - expensesTotal;
    const profitMargin = revenueTotal > 0 ? (profit / revenueTotal) * 100 : 0;

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      revenue: {
        total: revenueTotal,
        byFeeType: revenueByFeeType,
        paid: revenuePaid,
        outstanding: revenueOutstanding,
      },
      expenses: {
        total: expensesTotal,
        byStaffType: expensesByStaffType,
        paid: expensesPaid,
        outstanding: expensesOutstanding,
        otherExpenses,
      },
      profit,
      profitMargin,
    };
  }, [feePayments, salaryPayments, apiExpenses, teachers, students]);

  // Get yearly summary
  const getYearlySummary = useCallback((year: number, schoolId?: string): FinancialSummary => {
    // Filter fees for the year
    const yearFees = feePayments.filter(payment => {
      if (schoolId) {
        const student = students.find(s => s.id === payment.studentId);
        if (!student || student.schoolId !== schoolId) return false;
      }
      return payment.year === year;
    });

    // Filter salaries for the year
    const yearSalaries = salaryPayments.filter(payment => {
      if (schoolId) {
        const teacher = teachers.find(t => t.id === payment.staffId);
        if (!teacher || teacher.schoolId !== schoolId) return false;
      }
      return payment.year === year;
    });

    // Calculate revenue
    const revenueTotal = yearFees.reduce((sum, p) => sum + p.finalAmount, 0);
    const revenuePaid = yearFees
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.finalAmount, 0) +
      yearFees
        .filter(p => p.status === 'Partial')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const revenueOutstanding = revenueTotal - revenuePaid;

    // Revenue by fee type
    const revenueByFeeType: Partial<Record<FeeType, number>> = {};
    yearFees.forEach(payment => {
      const current = revenueByFeeType[payment.feeType] || 0;
      revenueByFeeType[payment.feeType] = current + payment.finalAmount;
    });

    // Expenses from salary payments
    const salaryExpensesTotal = yearSalaries.reduce((sum, p) => sum + p.finalAmount, 0);
    const expensesPaid = yearSalaries
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.finalAmount, 0) +
      yearSalaries
        .filter(p => p.status === 'Partial')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const expensesOutstanding = salaryExpensesTotal - expensesPaid;

    // Expenses by staff type
    const expensesByStaffType: Partial<Record<StaffType, number>> = {};
    yearSalaries.forEach(payment => {
      const teacher = teachers.find(t => t.id === payment.staffId);
      if (teacher && teacher.staffType) {
        const current = expensesByStaffType[teacher.staffType] || 0;
        expensesByStaffType[teacher.staffType] = current + payment.finalAmount;
      }
    });

    // Other expenses from Expense Management module
    const yearExpenses = apiExpenses.filter(e => {
      if (schoolId && e.schoolId !== schoolId) return false;
      return new Date(e.createdAt).getFullYear() === year;
    });
    const otherExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesTotal = salaryExpensesTotal + otherExpenses;

    // Calculate profit
    const profit = revenueTotal - expensesTotal;
    const profitMargin = revenueTotal > 0 ? (profit / revenueTotal) * 100 : 0;

    return {
      period: String(year),
      revenue: {
        total: revenueTotal,
        byFeeType: revenueByFeeType,
        paid: revenuePaid,
        outstanding: revenueOutstanding,
      },
      expenses: {
        total: expensesTotal,
        byStaffType: expensesByStaffType,
        paid: expensesPaid,
        outstanding: expensesOutstanding,
        otherExpenses,
      },
      profit,
      profitMargin,
    };
  }, [feePayments, salaryPayments, apiExpenses, teachers, students]);

  // Get quarterly summary
  const getQuarterlySummary = useCallback((
    quarter: number,
    year: number,
    schoolId?: string
  ): FinancialSummary => {
    // Determine months for the quarter
    // Q1: Jan-Mar (1-3), Q2: Apr-Jun (4-6), Q3: Jul-Sep (7-9), Q4: Oct-Dec (10-12)
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;

    // Filter fees for the quarter
    const quarterFees = feePayments.filter(payment => {
      if (schoolId) {
        const student = students.find(s => s.id === payment.studentId);
        if (!student || student.schoolId !== schoolId) return false;
      }
      return payment.year === year && 
             payment.month !== undefined &&
             payment.month >= startMonth && 
             payment.month <= endMonth;
    });

    // Filter salaries for the quarter
    const quarterSalaries = salaryPayments.filter(payment => {
      if (schoolId) {
        const teacher = teachers.find(t => t.id === payment.staffId);
        if (!teacher || teacher.schoolId !== schoolId) return false;
      }
      return payment.year === year && 
             payment.month !== undefined &&
             payment.month >= startMonth && 
             payment.month <= endMonth;
    });

    // Calculate revenue
    const revenueTotal = quarterFees.reduce((sum, p) => sum + p.finalAmount, 0);
    const revenuePaid = quarterFees
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.finalAmount, 0) +
      quarterFees
        .filter(p => p.status === 'Partial')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const revenueOutstanding = revenueTotal - revenuePaid;

    // Revenue by fee type
    const revenueByFeeType: Partial<Record<FeeType, number>> = {};
    quarterFees.forEach(payment => {
      const current = revenueByFeeType[payment.feeType] || 0;
      revenueByFeeType[payment.feeType] = current + payment.finalAmount;
    });

    // Expenses from salary payments
    const salaryExpensesTotal = quarterSalaries.reduce((sum, p) => sum + p.finalAmount, 0);
    const expensesPaid = quarterSalaries
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.finalAmount, 0) +
      quarterSalaries
        .filter(p => p.status === 'Partial')
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const expensesOutstanding = salaryExpensesTotal - expensesPaid;

    // Expenses by staff type
    const expensesByStaffType: Partial<Record<StaffType, number>> = {};
    quarterSalaries.forEach(payment => {
      const teacher = teachers.find(t => t.id === payment.staffId);
      if (teacher && teacher.staffType) {
        const current = expensesByStaffType[teacher.staffType] || 0;
        expensesByStaffType[teacher.staffType] = current + payment.finalAmount;
      }
    });

    // Other expenses from Expense Management module
    const quarterExpenses = apiExpenses.filter(e => {
      if (schoolId && e.schoolId !== schoolId) return false;
      const d = new Date(e.createdAt);
      const m = d.getMonth() + 1;
      return d.getFullYear() === year && m >= startMonth && m <= endMonth;
    });
    const otherExpenses = quarterExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesTotal = salaryExpensesTotal + otherExpenses;

    // Calculate profit
    const profit = revenueTotal - expensesTotal;
    const profitMargin = revenueTotal > 0 ? (profit / revenueTotal) * 100 : 0;

    return {
      period: `Q${quarter} ${year}`,
      revenue: {
        total: revenueTotal,
        byFeeType: revenueByFeeType,
        paid: revenuePaid,
        outstanding: revenueOutstanding,
      },
      expenses: {
        total: expensesTotal,
        byStaffType: expensesByStaffType,
        paid: expensesPaid,
        outstanding: expensesOutstanding,
        otherExpenses,
      },
      profit,
      profitMargin,
    };
  }, [feePayments, salaryPayments, apiExpenses, teachers, students]);

  // Get quarterly trends for a year
  const getQuarterlyTrends = useCallback((year: number, schoolId?: string): FinancialSummary[] => {
    const trends: FinancialSummary[] = [];
    for (let quarter = 1; quarter <= 4; quarter++) {
      trends.push(getQuarterlySummary(quarter, year, schoolId));
    }
    return trends;
  }, [getQuarterlySummary]);

  // Get monthly trends for a year
  const getMonthlyTrends = useCallback((year: number, schoolId?: string): FinancialSummary[] => {
    const trends: FinancialSummary[] = [];
    for (let month = 1; month <= 12; month++) {
      trends.push(getMonthlySummary(month, year, schoolId));
    }
    return trends;
  }, [getMonthlySummary]);

  // Get yearly trends for a range
  const getYearlyTrends = useCallback((
    startYear: number,
    endYear: number,
    schoolId?: string
  ): FinancialSummary[] => {
    const trends: FinancialSummary[] = [];
    for (let year = startYear; year <= endYear; year++) {
      trends.push(getYearlySummary(year, schoolId));
    }
    return trends;
  }, [getYearlySummary]);

  return {
    getMonthlySummary,
    getYearlySummary,
    getQuarterlySummary,
    getMonthlyTrends,
    getQuarterlyTrends,
    getYearlyTrends,
  };
}
