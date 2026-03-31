// Local storage utilities for student fee payments data

import type { StudentFeePayment, FeeType, PaymentStatus } from '@/types';
import { getStudentById } from './student-storage';
import { getClasses } from './class-storage';

const STORAGE_KEY = 'edflo_student_fee_payments';

export const getStudentFeePayments = (): StudentFeePayment[] => {
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
    console.error('Error reading student fee payments from localStorage:', error);
    return [];
  }
};

export const saveStudentFeePayments = (payments: StudentFeePayment[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error('Error saving student fee payments to localStorage:', error);
  }
};

export const addStudentFeePayment = (paymentData: Omit<StudentFeePayment, 'id' | 'createdAt' | 'updatedAt'>): StudentFeePayment => {
  const payments = getStudentFeePayments();
  const newPayment: StudentFeePayment = {
    ...paymentData,
    id: `fee-payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  payments.push(newPayment);
  saveStudentFeePayments(payments);
  return newPayment;
};

export const updateStudentFeePayment = (id: string, updates: Partial<StudentFeePayment>): StudentFeePayment | null => {
  const payments = getStudentFeePayments();
  const index = payments.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  payments[index] = {
    ...payments[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveStudentFeePayments(payments);
  return payments[index];
};

export const deleteStudentFeePayment = (id: string): boolean => {
  const payments = getStudentFeePayments();
  const filtered = payments.filter(p => p.id !== id);
  if (filtered.length === payments.length) return false;
  
  saveStudentFeePayments(filtered);
  return true;
};

export const getStudentFeePaymentById = (id: string): StudentFeePayment | null => {
  const payments = getStudentFeePayments();
  return payments.find(p => p.id === id) || null;
};

export const getStudentFeePaymentsByStudent = (studentId: string): StudentFeePayment[] => {
  const payments = getStudentFeePayments();
  return payments.filter(p => p.studentId === studentId);
};

export const getStudentFeePaymentsByType = (studentId: string, feeType: FeeType): StudentFeePayment[] => {
  const payments = getStudentFeePayments();
  return payments.filter(p => p.studentId === studentId && p.feeType === feeType);
};

export const getOutstandingFees = (studentId: string): StudentFeePayment[] => {
  const payments = getStudentFeePayments();
  return payments.filter(
    p => p.studentId === studentId && (p.status === 'Unpaid' || p.status === 'Partial')
  );
};

export const getMonthlyTuitionPayments = (studentId: string, year: number, month?: number): StudentFeePayment[] => {
  const payments = getStudentFeePayments();
  return payments.filter(p => {
    if (p.studentId !== studentId || p.feeType !== 'MonthlyTuition') return false;
    if (p.year !== year) return false;
    if (month !== undefined && p.month !== month) return false;
    return true;
  });
};

export const markAsPaid = (id: string, amount: number, date: Date): StudentFeePayment | null => {
  const payment = getStudentFeePaymentById(id);
  if (!payment) return null;
  
  const paidAmount = (payment.paidAmount || 0) + amount;
  const finalAmount = payment.finalAmount;
  
  let status: PaymentStatus = 'Paid';
  if (paidAmount < finalAmount) {
    status = 'Partial';
  }
  
  return updateStudentFeePayment(id, {
    status,
    paidAmount,
    paymentDate: date,
  });
};

export const clearAllFees = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing all fees from localStorage:', error);
    return false;
  }
};

export const generateMonthlyFees = (studentId: string, startDate: Date, endDate: Date): StudentFeePayment[] => {
  const student = getStudentById(studentId);
  if (!student || !student.discountedFee) {
    return [];
  }

  const payments = getStudentFeePayments();
  const generatedPayments: StudentFeePayment[] = [];
  
  const finalAmount = student.discountedFee;
  
  // Get standard fee from student's class
  const classId = student.classId || student.classApplyingFor;
  let standardFee = 0;
  if (classId) {
    const classes = getClasses();
    const cls = classes.find(c => c.id === classId);
    standardFee = cls?.standardFee || 0;
  }
  
  const discountAmount = standardFee > 0 ? standardFee - finalAmount : 0;
  const dueDay = 1; // Default due date is 1st of each month

  // Start from admission date or startDate, whichever is later
  const start = student.admissionDate > startDate ? student.admissionDate : startDate;
  
  let currentDate = new Date(start);
  currentDate.setDate(1); // Start of month
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    // Check if payment already exists for this month/year
    const existing = payments.find(
      p => p.studentId === studentId && 
           p.feeType === 'MonthlyTuition' && 
           p.year === year && 
           p.month === month
    );
    
    if (!existing) {
      // Create due date for this month
      const dueDate = new Date(year, month - 1, dueDay);
      
      const newPayment = addStudentFeePayment({
        studentId,
        feeType: 'MonthlyTuition',
        amount: standardFee, // Use standard fee as base amount
        discountAmount,
        finalAmount,
        dueDate,
        status: 'Unpaid',
        month,
        year,
      });
      
      generatedPayments.push(newPayment);
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return generatedPayments;
};
