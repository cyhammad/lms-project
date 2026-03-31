'use client';

import { useState, useMemo } from 'react';
import { Shield, CalendarX, Plus, Edit, Trash2, FileText, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSecurityDeductions } from '@/hooks/use-security-deductions';
import { useSecurityPolicies } from '@/hooks/use-security-policies-api';
import { useLeavePolicies } from '@/hooks/use-leave-policies-api';
import { useAlert } from '@/hooks/use-alert';
import type {
  SecurityDeductionType,
  LeaveDeductionType,
  SecurityDeductionPolicy,
  LeaveDeductionPolicy,
} from '@/types';

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

interface SalaryPoliciesClientProps {
  schoolId: string;
}

export default function SalaryPoliciesClient({ schoolId }: SalaryPoliciesClientProps) {
  const {
    securityPolicies,
    createSecurityPolicy,
    updateSecurityPolicy,
    removeSecurityPolicy,
    getActiveSecurityPolicy,
  } = useSecurityPolicies(schoolId);
  const {
    leavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    removeLeavePolicy,
    getActiveLeavePolicy,
  } = useLeavePolicies(schoolId);
  const { records: securityRecords } = useSecurityDeductions();
  const { showError, showSuccess, showConfirm, AlertComponent, ConfirmComponent } = useAlert();

  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [editingSecurityId, setEditingSecurityId] = useState<string | null>(null);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);

  const [securityFormData, setSecurityFormData] = useState({
    deductionType: 'half' as SecurityDeductionType,
    deductionValue: '',
    durationMonths: '',
    isActive: false,
  });

  const [leaveFormData, setLeaveFormData] = useState({
    deductionType: 'fixed' as LeaveDeductionType,
    deductionValue: '',
    isActive: false,
  });

  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [leaveErrors, setLeaveErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'security' | 'leave'>('security');

  const activeSecurityPolicy = getActiveSecurityPolicy();
  const activeLeavePolicy = getActiveLeavePolicy();

  const securityStats = useMemo(() => {
    const totalDeducted = securityRecords
      .filter(r => r.status === 'deducted')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalReturned = securityRecords
      .filter(r => r.status === 'returned')
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingReturn = securityRecords
      .filter(r => r.status === 'deducted')
      .length;

    return {
      totalDeducted,
      totalReturned,
      pendingReturn,
      totalRecords: securityRecords.length,
    };
  }, [securityRecords]);

  const validateSecurityForm = () => {
    const newErrors: Record<string, string> = {};

    if (!securityFormData.deductionType) {
      newErrors.deductionType = 'Deduction type is required';
    }

    if (securityFormData.deductionType === 'percentage') {
      const value = parseFloat(securityFormData.deductionValue);
      if (!securityFormData.deductionValue || isNaN(value) || value <= 0 || value > 100) {
        newErrors.deductionValue = 'Please enter a valid percentage (1-100)';
      }
    }

    const duration = parseInt(securityFormData.durationMonths);
    if (!securityFormData.durationMonths || isNaN(duration) || duration < 1 || duration > 12) {
      newErrors.durationMonths = 'Please enter a valid duration (1-12 months)';
    }

    setSecurityErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLeaveForm = () => {
    const newErrors: Record<string, string> = {};

    if (!leaveFormData.deductionType) {
      newErrors.deductionType = 'Deduction type is required';
    }

    const value = parseFloat(leaveFormData.deductionValue);
    if (!leaveFormData.deductionValue || isNaN(value) || value <= 0) {
      newErrors.deductionValue = leaveFormData.deductionType === 'fixed'
        ? 'Please enter a valid amount'
        : 'Please enter a valid percentage (1-100)';
    }

    if (leaveFormData.deductionType === 'percentage' && (value > 100)) {
      newErrors.deductionValue = 'Percentage cannot exceed 100%';
    }

    setLeaveErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSecurityForm()) {
      return;
    }

    const policyData = {
      schoolId,
      deductionType: securityFormData.deductionType,
      deductionValue:
        securityFormData.deductionType === 'percentage'
          ? parseFloat(securityFormData.deductionValue)
          : 0,
      durationMonths: parseInt(securityFormData.durationMonths),
      isActive: securityFormData.isActive,
    };

    try {
      if (editingSecurityId) {
        const updated = await updateSecurityPolicy(editingSecurityId, policyData);
        if (updated) {
          showSuccess('Security deduction policy updated successfully');
          resetSecurityForm();
        } else {
          showError('Failed to update policy');
        }
      } else {
        const created = await createSecurityPolicy(policyData);
        if (created) {
          showSuccess('Security deduction policy created successfully');
          resetSecurityForm();
        } else {
          showError('Failed to create policy');
        }
      }
    } catch {
      showError('Failed to save policy');
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLeaveForm()) {
      return;
    }

    const policyData = {
      schoolId,
      deductionType: leaveFormData.deductionType,
      deductionValue: parseFloat(leaveFormData.deductionValue),
      isActive: leaveFormData.isActive,
    };

    try {
      if (editingLeaveId) {
        const updated = await updateLeavePolicy(editingLeaveId, policyData);
        if (updated) {
          showSuccess('Leave deduction policy updated successfully');
          resetLeaveForm();
        } else {
          showError('Failed to update policy');
        }
      } else {
        const created = await createLeavePolicy(policyData);
        if (created) {
          showSuccess('Leave deduction policy created successfully');
          resetLeaveForm();
        } else {
          showError('Failed to create policy');
        }
      }
    } catch {
      showError('Failed to save policy');
    }
  };

  const resetSecurityForm = () => {
    setSecurityFormData({
      deductionType: 'half',
      deductionValue: '',
      durationMonths: '',
      isActive: false,
    });
    setSecurityErrors({});
    setShowSecurityForm(false);
    setEditingSecurityId(null);
  };

  const resetLeaveForm = () => {
    setLeaveFormData({
      deductionType: 'fixed',
      deductionValue: '',
      isActive: false,
    });
    setLeaveErrors({});
    setShowLeaveForm(false);
    setEditingLeaveId(null);
  };

  const handleEditSecurity = (policy: SecurityDeductionPolicy) => {
    setSecurityFormData({
      deductionType: policy.deductionType,
      deductionValue: policy.deductionType === 'percentage' ? policy.deductionValue.toString() : '',
      durationMonths: policy.durationMonths.toString(),
      isActive: policy.isActive,
    });
    setEditingSecurityId(policy.id);
    setShowSecurityForm(true);
  };

  const handleEditLeave = (policy: LeaveDeductionPolicy) => {
    setLeaveFormData({
      deductionType: policy.deductionType,
      deductionValue: policy.deductionValue.toString(),
      isActive: policy.isActive,
    });
    setEditingLeaveId(policy.id);
    setShowLeaveForm(true);
  };

  const handleDeleteSecurity = async (id: string) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this security deduction policy? This action cannot be undone.',
      'Delete Policy',
      'Delete',
      'Cancel',
      'destructive'
    );

    if (!confirmed) return;

    const success = await removeSecurityPolicy(id);
    if (success) {
      showSuccess('Policy deleted successfully');
    } else {
      showError('Failed to delete policy');
    }
  };

  const handleDeleteLeave = async (id: string) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this leave deduction policy? This action cannot be undone.',
      'Delete Policy',
      'Delete',
      'Cancel',
      'destructive'
    );

    if (!confirmed) return;

    const success = await removeLeavePolicy(id);
    if (success) {
      showSuccess('Policy deleted successfully');
    } else {
      showError('Failed to delete policy');
    }
  };

  const getSecurityDeductionTypeLabel = (type: SecurityDeductionType, value?: number) => {
    switch (type) {
      case 'half':
        return 'Half Salary';
      case 'quarter':
        return 'Quarter Salary';
      case 'percentage':
        return `${value}% of Salary`;
      default:
        return type;
    }
  };

  const getLeaveDeductionTypeLabel = (type: LeaveDeductionType, value: number) => {
    if (type === 'fixed') {
      return `Fixed: ${formatCurrency(value)} per leave`;
    } else {
      return `Percentage: ${value}% of daily salary`;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salary Policies</h1>
          <p className="text-slate-700 mt-1">Manage security and leave deduction policies for staff salaries</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('security')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'security'
                  ? 'border-slate-700 text-slate-800'
                  : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Deduction
              </div>
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'leave'
                  ? 'border-slate-700 text-slate-800'
                  : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <CalendarX className="w-4 h-4" />
                Leave Deduction
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Deduction Policy Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Security Deduction</CardTitle>
                      <CardDescription>Manage security deduction policies for new staff</CardDescription>
                    </div>
                  </div>
                  {!showSecurityForm && (
                    <Button onClick={() => setShowSecurityForm(true)} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Policy
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Policy Notice */}
                {activeSecurityPolicy && !showSecurityForm && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-slate-800" />
                      <span className="text-sm font-semibold text-slate-900">Active Policy</span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {getSecurityDeductionTypeLabel(activeSecurityPolicy.deductionType, activeSecurityPolicy.deductionValue)} for {activeSecurityPolicy.durationMonths} month(s)
                    </p>
                  </div>
                )}

                {/* Form */}
                {showSecurityForm && (
                  <form onSubmit={handleSecuritySubmit} className="space-y-4 p-4 bg-slate-50 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Deduction Type *</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-white">
                          <input
                            type="radio"
                            name="securityDeductionType"
                            value="half"
                            checked={securityFormData.deductionType === 'half'}
                            onChange={(e) => setSecurityFormData({ ...securityFormData, deductionType: e.target.value as SecurityDeductionType, deductionValue: '' })}
                            className="text-slate-800"
                          />
                          <span className="text-sm">Half Salary (50%)</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-white">
                          <input
                            type="radio"
                            name="securityDeductionType"
                            value="quarter"
                            checked={securityFormData.deductionType === 'quarter'}
                            onChange={(e) => setSecurityFormData({ ...securityFormData, deductionType: e.target.value as SecurityDeductionType, deductionValue: '' })}
                            className="text-slate-800"
                          />
                          <span className="text-sm">Quarter Salary (25%)</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-white">
                          <input
                            type="radio"
                            name="securityDeductionType"
                            value="percentage"
                            checked={securityFormData.deductionType === 'percentage'}
                            onChange={(e) => setSecurityFormData({ ...securityFormData, deductionType: e.target.value as SecurityDeductionType })}
                            className="text-slate-800"
                          />
                          <span className="text-sm">Custom Percentage</span>
                        </label>
                      </div>
                      {securityErrors.deductionType && (
                        <p className="text-sm text-red-600 mt-1">{securityErrors.deductionType}</p>
                      )}
                    </div>

                    {securityFormData.deductionType === 'percentage' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Percentage *</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="0.1"
                          value={securityFormData.deductionValue}
                          onChange={(e) => setSecurityFormData({ ...securityFormData, deductionValue: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          placeholder="Enter percentage (1-100)"
                        />
                        {securityErrors.deductionValue && (
                          <p className="text-sm text-red-600 mt-1">{securityErrors.deductionValue}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Duration (Months) *</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={securityFormData.durationMonths}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, durationMonths: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        placeholder="Enter duration (1-12)"
                      />
                      {securityErrors.durationMonths && (
                        <p className="text-sm text-red-600 mt-1">{securityErrors.durationMonths}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="securityIsActive"
                        checked={securityFormData.isActive}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, isActive: e.target.checked })}
                        className="w-4 h-4 text-slate-800 rounded"
                      />
                      <label htmlFor="securityIsActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Set as active policy
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button type="submit" size="sm">
                        {editingSecurityId ? 'Update' : 'Create'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={resetSecurityForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {/* Policies List */}
                {!showSecurityForm && securityPolicies.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {securityPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className={`p-3 border rounded-lg ${policy.isActive ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {getSecurityDeductionTypeLabel(policy.deductionType, policy.deductionValue)}
                              </span>
                              {policy.isActive && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 mt-1">
                              Duration: {policy.durationMonths} month(s)
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSecurity(policy)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSecurity(policy.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showSecurityForm && securityPolicies.length === 0 && (
                  <p className="text-sm text-slate-700 text-center py-4">No policies configured</p>
                )}

                {/* Statistics */}
                {!showSecurityForm && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-700">Total Deducted</p>
                        <p className="font-semibold text-slate-900 mt-1">{formatCurrency(securityStats.totalDeducted)}</p>
                      </div>
                      <div>
                        <p className="text-slate-700">Pending Return</p>
                        <p className="font-semibold text-orange-600 mt-1">{securityStats.pendingReturn} records</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Security Deduction Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-800">Total Policies</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{securityPolicies.length}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600">Total Deducted</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(securityStats.totalDeducted)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-800">Total Returned</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(securityStats.totalReturned)}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-orange-600">Pending Return</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">{securityStats.pendingReturn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="space-y-6">
            {/* Leave Deduction Policy Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                      <CalendarX className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Leave Deduction</CardTitle>
                      <CardDescription>Manage leave deduction policies</CardDescription>
                    </div>
                  </div>
                  {!showLeaveForm && (
                    <Button onClick={() => setShowLeaveForm(true)} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Policy
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Policy Notice */}
                {activeLeavePolicy && !showLeaveForm && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4 text-slate-800" />
                      <span className="text-sm font-semibold text-slate-900">Active Policy</span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {getLeaveDeductionTypeLabel(activeLeavePolicy.deductionType, activeLeavePolicy.deductionValue)}
                    </p>
                  </div>
                )}

                {/* Info Card */}
                {!showLeaveForm && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs text-blue-900">
                      <strong>Note:</strong> Leave deductions are automatically calculated from attendance records. Days marked as &ldquo;Absent&rdquo; will be considered as leaves.
                    </p>
                  </div>
                )}

                {/* Form */}
                {showLeaveForm && (
                  <form onSubmit={handleLeaveSubmit} className="space-y-4 p-4 bg-slate-50 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Deduction Type *</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-white">
                          <input
                            type="radio"
                            name="leaveDeductionType"
                            value="fixed"
                            checked={leaveFormData.deductionType === 'fixed'}
                            onChange={(e) => setLeaveFormData({ ...leaveFormData, deductionType: e.target.value as LeaveDeductionType })}
                            className="text-slate-800"
                          />
                          <span className="text-sm">Fixed Amount per Leave</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-white">
                          <input
                            type="radio"
                            name="leaveDeductionType"
                            value="percentage"
                            checked={leaveFormData.deductionType === 'percentage'}
                            onChange={(e) => setLeaveFormData({ ...leaveFormData, deductionType: e.target.value as LeaveDeductionType })}
                            className="text-slate-800"
                          />
                          <span className="text-sm">Percentage of Daily Salary</span>
                        </label>
                      </div>
                      {leaveErrors.deductionType && (
                        <p className="text-sm text-red-600 mt-1">{leaveErrors.deductionType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {leaveFormData.deductionType === 'fixed' ? 'Amount (PKR)' : 'Percentage (%)'} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={leaveFormData.deductionType === 'percentage' ? '100' : undefined}
                        step={leaveFormData.deductionType === 'fixed' ? '1' : '0.1'}
                        value={leaveFormData.deductionValue}
                        onChange={(e) => setLeaveFormData({ ...leaveFormData, deductionValue: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        placeholder={leaveFormData.deductionType === 'fixed' ? 'Enter amount in PKR' : 'Enter percentage (1-100)'}
                      />
                      {leaveErrors.deductionValue && (
                        <p className="text-sm text-red-600 mt-1">{leaveErrors.deductionValue}</p>
                      )}
                      {leaveFormData.deductionType === 'percentage' && (
                        <p className="text-xs text-slate-700 mt-1">
                          Daily salary = Monthly salary ÷ Working days in month
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="leaveIsActive"
                        checked={leaveFormData.isActive}
                        onChange={(e) => setLeaveFormData({ ...leaveFormData, isActive: e.target.checked })}
                        className="w-4 h-4 text-slate-800 rounded"
                      />
                      <label htmlFor="leaveIsActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Set as active policy
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button type="submit" size="sm">
                        {editingLeaveId ? 'Update' : 'Create'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={resetLeaveForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {/* Policies List */}
                {!showLeaveForm && leavePolicies.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {leavePolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className={`p-3 border rounded-lg ${policy.isActive ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {getLeaveDeductionTypeLabel(policy.deductionType, policy.deductionValue)}
                              </span>
                              {policy.isActive && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLeave(policy)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLeave(policy.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showLeaveForm && leavePolicies.length === 0 && (
                  <p className="text-sm text-slate-700 text-center py-4">No policies configured</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AlertComponent />
      <ConfirmComponent />
    </>
  );
}
