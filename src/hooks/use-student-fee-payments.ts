'use client';

import { useState, useEffect } from 'react';
import type { StudentFeePayment, FeeType, PaymentStatus } from '@/types';
import { 
  getStudentFeePayments, 
  addStudentFeePayment, 
  updateStudentFeePayment, 
  deleteStudentFeePayment,
  getStudentFeePaymentsByStudent,
  getStudentFeePaymentsByType,
  getOutstandingFees,
  getMonthlyTuitionPayments,
  markAsPaid,
  generateMonthlyFees
} from '@/lib/student-fee-storage';

export function useStudentFeePayments() {
  const [payments, setPayments] = useState<StudentFeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = () => {
      setLoading(true);
      const data = getStudentFeePayments();
      setPayments(data);
      setLoading(false);
    };

    loadPayments();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_student_fee_payments') {
        loadPayments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createPayment = (paymentData: Omit<StudentFeePayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPayment = addStudentFeePayment(paymentData);
    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  };

  const updatePaymentById = (id: string, updates: Partial<StudentFeePayment>) => {
    const updated = updateStudentFeePayment(id, updates);
    if (updated) {
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  const removePayment = (id: string) => {
    const success = deleteStudentFeePayment(id);
    if (success) {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
    return success;
  };

  const getStudentPayments = (studentId: string) => {
    return getStudentFeePaymentsByStudent(studentId);
  };

  const getPaymentsByType = (studentId: string, feeType: FeeType) => {
    return getStudentFeePaymentsByType(studentId, feeType);
  };

  const getOutstanding = (studentId: string) => {
    return getOutstandingFees(studentId);
  };

  const getMonthlyPayments = (studentId: string, year: number, month?: number) => {
    return getMonthlyTuitionPayments(studentId, year, month);
  };

  const markPaymentAsPaid = (id: string, amount: number, date: Date) => {
    const updated = markAsPaid(id, amount, date);
    if (updated) {
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  const generateFees = (studentId: string, startDate: Date, endDate: Date) => {
    const generated = generateMonthlyFees(studentId, startDate, endDate);
    if (generated.length > 0) {
      setPayments(prev => [...prev, ...generated]);
    }
    return generated;
  };

  return {
    payments,
    loading,
    createPayment,
    updatePayment: updatePaymentById,
    deletePayment: removePayment,
    getStudentPayments,
    getPaymentsByType,
    getOutstanding,
    getMonthlyPayments,
    markPaymentAsPaid,
    generateFees,
    refresh: () => {
      setPayments(getStudentFeePayments());
    },
  };
}
