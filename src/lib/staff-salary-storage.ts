// Local storage utilities for staff salary payments data

import type { StaffSalaryPayment, SalaryPaymentStatus } from '@/types';
import { getTeacherById } from './teacher-storage';
import { getActiveSecurityDeductionPolicy, getActiveLeaveDeductionPolicy } from './policy-storage';
import { addSecurityDeductionRecord, getSecurityDeductionByMonthYear, clearAllSecurityDeductionRecords } from './security-deduction-storage';
import { getAttendanceByStaff } from './attendance-storage';

const STORAGE_KEY = 'edflo_staff_salary_payments';

export const getStaffSalaryPayments = (): StaffSalaryPayment[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const payments = JSON.parse(stored);
    return payments.map((payment: any) => ({
      ...payment,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : new Date(),
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : undefined,
      createdAt: new Date(payment.createdAt),
      updatedAt: new Date(payment.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading staff salary payments from localStorage:', error);
    return [];
  }
};

export const saveStaffSalaryPayments = (payments: StaffSalaryPayment[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error('Error saving staff salary payments to localStorage:', error);
  }
};

export const addStaffSalaryPayment = (paymentData: Omit<StaffSalaryPayment, 'id' | 'createdAt' | 'updatedAt'>): StaffSalaryPayment => {
  const payments = getStaffSalaryPayments();
  const newPayment: StaffSalaryPayment = {
    ...paymentData,
    id: `salary-payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  payments.push(newPayment);
  saveStaffSalaryPayments(payments);
  return newPayment;
};

export const updateStaffSalaryPayment = (id: string, updates: Partial<StaffSalaryPayment>): StaffSalaryPayment | null => {
  const payments = getStaffSalaryPayments();
  const index = payments.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  payments[index] = {
    ...payments[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveStaffSalaryPayments(payments);
  return payments[index];
};

export const deleteStaffSalaryPayment = (id: string): boolean => {
  const payments = getStaffSalaryPayments();
  const filtered = payments.filter(p => p.id !== id);
  if (filtered.length === payments.length) return false;
  
  saveStaffSalaryPayments(filtered);
  return true;
};

export const getStaffSalaryPaymentById = (id: string): StaffSalaryPayment | null => {
  const payments = getStaffSalaryPayments();
  return payments.find(p => p.id === id) || null;
};

export const getStaffSalaryPaymentsByStaff = (staffId: string): StaffSalaryPayment[] => {
  const payments = getStaffSalaryPayments();
  return payments.filter(p => p.staffId === staffId);
};

export const getStaffSalaryPaymentsByMonthYear = (month: number, year: number): StaffSalaryPayment[] => {
  const payments = getStaffSalaryPayments();
  return payments.filter(p => p.month === month && p.year === year);
};

export const getOutstandingSalaries = (staffId?: string): StaffSalaryPayment[] => {
  const payments = getStaffSalaryPayments();
  return payments.filter(
    p => (!staffId || p.staffId === staffId) && (p.status === 'Unpaid' || p.status === 'Partial')
  );
};

export const markAsPaid = (id: string, amount: number, date: Date): StaffSalaryPayment | null => {
  const payment = getStaffSalaryPaymentById(id);
  if (!payment) return null;
  
  const paidAmount = (payment.paidAmount || 0) + amount;
  const finalAmount = payment.finalAmount;
  
  let status: SalaryPaymentStatus = 'Paid';
  if (paidAmount < finalAmount) {
    status = 'Partial';
  }
  
  return updateStaffSalaryPayment(id, {
    status,
    paidAmount,
    paymentDate: date,
  });
};

export const clearAllSalaries = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Clear all salary payments
    localStorage.removeItem(STORAGE_KEY);
    
    // Clear all security deduction records (balances and deductions)
    clearAllSecurityDeductionRecords();
    
    return true;
  } catch (error) {
    console.error('Error clearing all salaries and related data from localStorage:', error);
    return false;
  }
};

// Helper function to calculate security deduction
const calculateSecurityDeduction = (
  staffId: string,
  monthlySalary: number,
  month: number,
  year: number,
  schoolId: string
  ): number => {
  const activePolicy = getActiveSecurityDeductionPolicy(schoolId);
  if (!activePolicy) {
    return 0;
  }

  const staff = getTeacherById(staffId);
  if (!staff) {
    return 0;
  }

  // Check if security deduction record already exists for this month/year
  const existingRecord = getSecurityDeductionByMonthYear(staffId, month, year);
  if (existingRecord) {
    return existingRecord.amount;
  }

  // Calculate months since staff joined
  const joinDate = new Date(staff.createdAt);
  const salaryDate = new Date(year, month - 1, 1);
  const monthsSinceJoin = (salaryDate.getFullYear() - joinDate.getFullYear()) * 12 + 
                          (salaryDate.getMonth() - joinDate.getMonth());
  
  // Check if staff is within policy duration
  if (monthsSinceJoin < 0 || monthsSinceJoin >= activePolicy.durationMonths) {
    return 0;
  }

  // Calculate deduction amount
  let deductionAmount = 0;
  switch (activePolicy.deductionType) {
    case 'half':
      deductionAmount = monthlySalary * 0.5;
      break;
    case 'quarter':
      deductionAmount = monthlySalary * 0.25;
      break;
    case 'percentage':
      deductionAmount = (monthlySalary * activePolicy.deductionValue) / 100;
      break;
  }
  
  if (deductionAmount > 0) {
    addSecurityDeductionRecord({
      staffId,
      policyId: activePolicy.id,
      amount: deductionAmount,
      month,
      year,
      status: 'deducted',
    });
  }

  return deductionAmount;
};

const calculateLeaveDeduction = (
  staffId: string,
  monthlySalary: number,
  month: number,
  year: number,
  schoolId: string
): number => {
  const activePolicy = getActiveLeaveDeductionPolicy(schoolId);
  if (!activePolicy) return 0;

  const allAttendances = getAttendanceByStaff(staffId);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const absentDays = allAttendances.filter(att => {
    const attDate = new Date(att.date);
    return attDate >= monthStart &&
           attDate <= monthEnd &&
           att.status === 'Absent';
  }).length;

  if (absentDays === 0) return 0;

  let deductionAmount = 0;

  if (activePolicy.deductionType === 'fixed') {
    deductionAmount = absentDays * activePolicy.deductionValue;
  } else {
    const workingDays = getWorkingDaysInMonth(month, year);
    const dailySalary = monthlySalary / workingDays;
    deductionAmount = (dailySalary * absentDays * activePolicy.deductionValue) / 100;
  }

  return deductionAmount;
};

const getWorkingDaysInMonth = (month: number, year: number): number => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  let workingDays = 0;

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays || 22;
};

export const generateMonthlySalaries = (staffIds: string[], month: number, year: number, dueDate: Date, schoolId?: string): StaffSalaryPayment[] => {
  const payments = getStaffSalaryPayments();
  const generatedPayments: StaffSalaryPayment[] = [];
  
  staffIds.forEach((staffId) => {
    const staff = getTeacherById(staffId);
    if (!staff || !staff.monthlySalary) return;

    const existing = payments.find(
      p => p.staffId === staffId && p.year === year && p.month === month
    );
    
    if (existing) return;
    
    const baseAmount = staff.monthlySalary;
    const securityDeduction = schoolId 
      ? calculateSecurityDeduction(staffId, baseAmount, month, year, schoolId)
      : 0;
    const leaveDeduction = schoolId
      ? calculateLeaveDeduction(staffId, baseAmount, month, year, schoolId)
      : 0;
    const deductions = securityDeduction + leaveDeduction;
    const finalAmount = baseAmount - deductions;
    const newPayment = addStaffSalaryPayment({
      staffId,
      amount: baseAmount,
      deductions,
      finalAmount,
      dueDate,
      status: 'Unpaid',
      month,
      year,
    });
    generatedPayments.push(newPayment);
  });
  
  return generatedPayments;
};
