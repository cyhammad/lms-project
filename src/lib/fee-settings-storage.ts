// Fee challan settings (bank details) per school - stored in localStorage

import type { FeeChallanSettings } from '@/types';

const STORAGE_KEY = 'edflo_fee_settings';

function getStorage(): Record<string, FeeChallanSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function setStorage(data: Record<string, FeeChallanSettings>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving fee settings:', e);
  }
}

export function getFeeSettings(schoolId: string): FeeChallanSettings | null {
  const data = getStorage();
  return data[schoolId] ?? null;
}

export function saveFeeSettings(schoolId: string, settings: FeeChallanSettings): void {
  const data = getStorage();
  data[schoolId] = settings;
  setStorage(data);
}

export function clearFeeSettings(schoolId: string): void {
  const data = getStorage();
  delete data[schoolId];
  setStorage(data);
}

/** Returns true if the given settings have at least the required bank fields to show on challan */
export function hasBankDetails(settings: FeeChallanSettings | null): boolean {
  if (!settings) return false;
  return !!(settings.bankName?.trim() && settings.accountTitle?.trim() && settings.accountNumber?.trim());
}
