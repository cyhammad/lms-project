'use client';

import { useState, useEffect } from 'react';
import { Building2, Save, Info, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { apiClient } from '@/lib/api-client';
import { saveFeeSettings, hasBankDetails } from '@/lib/fee-settings-storage';
import type { FeeChallanSettings } from '@/types';

interface FeeSettingsClientProps {
  user: { schoolId: string };
}

export default function FeeSettingsClient({ user }: FeeSettingsClientProps) {
  const { showSuccess, showError, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FeeChallanSettings>({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    branch: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!user.schoolId) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient<{ settings: FeeChallanSettings | null }>('/fees/settings');
        const existing = res.settings ?? null;
        if (existing) {
          setForm({
            bankName: existing.bankName ?? '',
            accountTitle: existing.accountTitle ?? '',
            accountNumber: existing.accountNumber ?? '',
            iban: existing.iban ?? '',
            branch: existing.branch ?? '',
          });
          saveFeeSettings(user.schoolId, existing);
        }
      } catch {
        // Fallback: no settings from API (e.g. not yet set or backend unavailable)
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.schoolId]);

  const handleChange = (field: keyof FeeChallanSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = {
      bankName: form.bankName.trim(),
      accountTitle: form.accountTitle.trim(),
      accountNumber: form.accountNumber.trim(),
      iban: form.iban?.trim() ?? '',
      branch: form.branch?.trim() ?? '',
    };
    if (!trimmed.bankName || !trimmed.accountTitle || !trimmed.accountNumber) {
      showError('Please fill in Bank Name, Account Title, and Account Number.');
      return;
    }
    setSaving(true);
    try {
      await apiClient<{ settings: FeeChallanSettings }>('/fees/settings', {
        method: 'PUT',
        body: JSON.stringify(trimmed),
      });
      saveFeeSettings(user.schoolId, trimmed);
      showSuccess('Fee settings saved. Bank details will appear on fee challans.');
    } catch {
      showError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canShowBankOnChallan = hasBankDetails(
    form.bankName.trim() && form.accountTitle.trim() && form.accountNumber.trim()
      ? { ...form, bankName: form.bankName.trim(), accountTitle: form.accountTitle.trim(), accountNumber: form.accountNumber.trim() }
      : null
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Settings</h1>
          <p className="text-slate-700 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee Settings</h1>
        <p className="text-slate-700 mt-1">Bank details shown on fee challans. Leave empty to show only school name (manual submission at school).</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">How it works</p>
          <p className="mt-1">
            If you add bank details here, they will appear at the top of every fee challan so parents can pay via bank transfer.
            If you leave them empty, challans will show only the school name and it will mean fees are to be submitted manually at the school.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Bank details for fee challan
          </CardTitle>
          <CardDescription>
            These fields will be displayed on generated fee challans. All fields except IBAN and Branch are required if you want bank details to appear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bank name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g. HBL, UBL, MCB"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account title</label>
              <input
                type="text"
                value={form.accountTitle}
                onChange={(e) => handleChange('accountTitle', e.target.value)}
                placeholder="e.g. ABC School Fee Account"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account number</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                placeholder="e.g. 1234567890"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IBAN (optional)</label>
              <input
                type="text"
                value={form.iban ?? ''}
                onChange={(e) => handleChange('iban', e.target.value)}
                placeholder="e.g. PK00HABB0000000000000000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch (optional)</label>
              <input
                type="text"
                value={form.branch ?? ''}
                onChange={(e) => handleChange('branch', e.target.value)}
                placeholder="e.g. Main Branch, Lahore"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save bank details
                  </>
                )}
              </Button>
            </div>
          </form>
          {!canShowBankOnChallan && (form.bankName || form.accountTitle || form.accountNumber) && (
            <p className="mt-3 text-sm text-amber-700">
              Fill Bank name, Account title, and Account number and save for them to appear on challans.
            </p>
          )}
        </CardContent>
      </Card>

      <AlertComponent />
    </div>
  );
}
