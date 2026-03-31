// Local storage utilities for security deduction records

import type { SecurityDeductionRecord } from '@/types';

const STORAGE_KEY = 'edflo_security_deduction_records';

export const getSecurityDeductionRecords = (staffId?: string): SecurityDeductionRecord[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const records = JSON.parse(stored);
    const parsed = records.map((record: any) => ({
      ...record,
      returnedDate: record.returnedDate ? new Date(record.returnedDate) : undefined,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    }));
    return staffId ? parsed.filter((r: SecurityDeductionRecord) => r.staffId === staffId) : parsed;
  } catch (error) {
    console.error('Error reading security deduction records from localStorage:', error);
    return [];
  }
};

export const saveSecurityDeductionRecords = (records: SecurityDeductionRecord[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error saving security deduction records to localStorage:', error);
  }
};

export const addSecurityDeductionRecord = (recordData: Omit<SecurityDeductionRecord, 'id' | 'createdAt' | 'updatedAt'>): SecurityDeductionRecord => {
  const records = getSecurityDeductionRecords();
  const newRecord: SecurityDeductionRecord = {
    ...recordData,
    id: `security-record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  records.push(newRecord);
  saveSecurityDeductionRecords(records);
  return newRecord;
};

export const updateSecurityDeductionRecord = (id: string, updates: Partial<SecurityDeductionRecord>): SecurityDeductionRecord | null => {
  const records = getSecurityDeductionRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  records[index] = {
    ...records[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveSecurityDeductionRecords(records);
  return records[index];
};

export const deleteSecurityDeductionRecord = (id: string): boolean => {
  const records = getSecurityDeductionRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) return false;
  
  saveSecurityDeductionRecords(filtered);
  return true;
};

export const getSecurityDeductionRecordById = (id: string): SecurityDeductionRecord | null => {
  const records = getSecurityDeductionRecords();
  return records.find(r => r.id === id) || null;
};

export const getSecurityDeductionsByStaff = (staffId: string): SecurityDeductionRecord[] => {
  return getSecurityDeductionRecords(staffId);
};

export const getUnreturnedSecurityDeductions = (staffId: string): SecurityDeductionRecord[] => {
  const records = getSecurityDeductionRecords(staffId);
  return records.filter(r => r.status === 'deducted');
};

export const returnSecurityDeduction = (staffId: string): SecurityDeductionRecord[] => {
  const unreturned = getUnreturnedSecurityDeductions(staffId);
  const returnedRecords: SecurityDeductionRecord[] = [];
  
  unreturned.forEach(record => {
    const updated = updateSecurityDeductionRecord(record.id, {
      status: 'returned',
      returnedDate: new Date(),
    });
    if (updated) {
      returnedRecords.push(updated);
    }
  });
  
  return returnedRecords;
};

export const getSecurityDeductionByMonthYear = (staffId: string, month: number, year: number): SecurityDeductionRecord | null => {
  const records = getSecurityDeductionRecords(staffId);
  return records.find(r => r.month === month && r.year === year) || null;
};

export const clearAllSecurityDeductionRecords = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing all security deduction records from localStorage:', error);
    return false;
  }
};
