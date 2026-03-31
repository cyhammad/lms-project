'use client';

import { useState, useEffect } from 'react';
import type { StaffSalaryPayment, SalaryPaymentStatus } from '@/types';
import { 
  getStaffSalaryPayments, 
  addStaffSalaryPayment, 
  updateStaffSalaryPayment, 
  deleteStaffSalaryPayment,
  getStaffSalaryPaymentsByStaff,
  getStaffSalaryPaymentsByMonthYear,
  getOutstandingSalaries,
  markAsPaid,
  generateMonthlySalaries
} from '@/lib/staff-salary-storage';

export function useStaffSalaryPayments() {
  const [payments, setPayments] = useState<StaffSalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = () => {
      setLoading(true);
      const data = getStaffSalaryPayments();
      setPayments(data);
      setLoading(false);
    };

    loadPayments();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_staff_salary_payments') {
        loadPayments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createPayment = (paymentData: Omit<StaffSalaryPayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPayment = addStaffSalaryPayment(paymentData);
    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  };

  const updatePaymentById = (id: string, updates: Partial<StaffSalaryPayment>) => {
    const updated = updateStaffSalaryPayment(id, updates);
    if (updated) {
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  const removePayment = (id: string) => {
    const success = deleteStaffSalaryPayment(id);
    if (success) {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
    return success;
  };

  const getStaffPayments = (staffId: string) => {
    return getStaffSalaryPaymentsByStaff(staffId);
  };

  const getPaymentsByMonthYear = (month: number, year: number) => {
    return getStaffSalaryPaymentsByMonthYear(month, year);
  };

  const getOutstanding = (staffId?: string) => {
    return getOutstandingSalaries(staffId);
  };

  const markPaymentAsPaid = (id: string, amount: number, date: Date) => {
    const updated = markAsPaid(id, amount, date);
    if (updated) {
      setPayments(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  const generateSalaries = (staffIds: string[], month: number, year: number, dueDate: Date, schoolId?: string) => {
    const generated = generateMonthlySalaries(staffIds, month, year, dueDate, schoolId);
    if (generated.length > 0) {
      setPayments(prev => [...prev, ...generated]);
    }
    return generated;
  };

  const refresh = () => {
    const data = getStaffSalaryPayments();
    setPayments(data);
  };

  return {
    payments,
    loading,
    createPayment,
    updatePayment: updatePaymentById,
    deletePayment: removePayment,
    markPaymentAsPaid,
    generateSalaries,
    getStaffPayments,
    getPaymentsByMonthYear,
    getOutstanding,
    refresh,
  };
}
