'use client';

import { useState, useEffect } from 'react';
import type { SecurityDeductionRecord } from '@/types';
import {
  getSecurityDeductionRecords,
  addSecurityDeductionRecord,
  updateSecurityDeductionRecord,
  deleteSecurityDeductionRecord,
  getSecurityDeductionsByStaff,
  getUnreturnedSecurityDeductions,
  returnSecurityDeduction,
  getSecurityDeductionByMonthYear,
} from '@/lib/security-deduction-storage';

export function useSecurityDeductions(staffId?: string) {
  const [records, setRecords] = useState<SecurityDeductionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecords = () => {
      setLoading(true);
      const data = getSecurityDeductionRecords(staffId);
      setRecords(data);
      setLoading(false);
    };

    loadRecords();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_security_deduction_records') {
        loadRecords();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [staffId]);

  const createRecord = (recordData: Omit<SecurityDeductionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecord = addSecurityDeductionRecord(recordData);
    setRecords(prev => [...prev, newRecord]);
    return newRecord;
  };

  const updateRecord = (id: string, updates: Partial<SecurityDeductionRecord>) => {
    const updated = updateSecurityDeductionRecord(id, updates);
    if (updated) {
      setRecords(prev => prev.map(r => r.id === id ? updated : r));
    }
    return updated;
  };

  const removeRecord = (id: string) => {
    const success = deleteSecurityDeductionRecord(id);
    if (success) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
    return success;
  };

  const getStaffRecords = (staffId: string) => {
    return getSecurityDeductionsByStaff(staffId);
  };

  const getUnreturnedRecords = (staffId: string) => {
    return getUnreturnedSecurityDeductions(staffId);
  };

  const returnSecurity = (staffId: string) => {
    const returned = returnSecurityDeduction(staffId);
    setRecords(prev => prev.map(r => {
      const updated = returned.find(ur => ur.id === r.id);
      return updated || r;
    }));
    return returned;
  };

  const getRecordByMonthYear = (staffId: string, month: number, year: number) => {
    return getSecurityDeductionByMonthYear(staffId, month, year);
  };

  return {
    records,
    loading,
    createRecord,
    updateRecord,
    removeRecord,
    getStaffRecords,
    getUnreturnedRecords,
    returnSecurity,
    getRecordByMonthYear,
    refresh: () => {
      setRecords(getSecurityDeductionRecords(staffId));
    },
  };
}
