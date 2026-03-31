'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Filter,
  X,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { downloadCSV } from '@/lib/csv-export';
import { apiClient } from '@/lib/api-client';
import type {
  Teacher,
  StaffSalaryPayment,
  SalaryPaymentStatus,
  StaffType,
} from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const PAY_SALARIES_COLUMNS: DataTableColumn[] = [
  { id: 'staff', label: 'Staff' },
  { id: 'period', label: 'Period' },
  { id: 'amount', label: 'Amount' },
  { id: 'paid', label: 'Paid' },
  { id: 'remaining', label: 'Remaining' },
  { id: 'due', label: 'Due Date' },
  { id: 'payment', label: 'Payment' },
  { id: 'action', label: 'Action' },
];

type CurrentUser = {
  schoolId?: string;
};

interface PaySalariesClientProps {
  user: CurrentUser | null;
}

interface StaffAvatarProps {
  staff: Teacher | undefined;
  displayName: string;
}

const StaffAvatar = ({ staff, displayName }: StaffAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  if (staff?.photo && !imageError) {
    return (
      <img
        src={staff.photo}
        alt={displayName}
        className="w-8 h-8 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-blue-500/20">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
};

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function PaySalariesClient({ user }: PaySalariesClientProps) {
  const [payments, setPayments] = useState<StaffSalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const { showError, showSuccess, showConfirm, AlertComponent, ConfirmComponent } =
    useAlert();

  // Filter states
  const [selectedStaffType, setSelectedStaffType] = useState<StaffType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<SalaryPaymentStatus | ''>('Unpaid');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load staff from backend
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setStaffLoading(true);
        const params = new URLSearchParams();
        params.append('limit', '1000');
        params.append('isActive', 'true');

        const result = await apiClient<{
          staff: Teacher[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(`/staff?${params.toString()}`);

        setStaff(result.staff);
      } catch (error) {
        console.error('Failed to load staff from backend:', error);
        const message =
          error instanceof Error ? error.message : 'Failed to load staff from server';
        showError(message);
        setStaff([]);
      } finally {
        setStaffLoading(false);
      }
    };

    void loadStaff();
  }, [showError]);

  // Load salary payments from backend
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('limit', '1000');

        const result = await apiClient<{
          salaries: StaffSalaryPayment[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(`/salaries?${params.toString()}`);

        setPayments(result.salaries);
      } catch (error) {
        console.error('Failed to load salaries from backend:', error);
        const message =
          error instanceof Error ? error.message : 'Failed to load salaries from server';
        showError(message);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    void loadPayments();
  }, [showError]);

  const schoolStaff = useMemo(() => {
    return user?.schoolId ? staff.filter((t) => t.schoolId === user.schoolId) : staff;
  }, [staff, user?.schoolId]);

  const getStaffName = (staffId: string) => {
    const staff = schoolStaff.find((t) => t.id === staffId);
    return staff?.name || 'Unknown';
  };

  const getStaffType = (staffId: string) => {
    const staff = schoolStaff.find((t) => t.id === staffId);
    return staff?.staffType || 'N/A';
  };

  // Filter payments - only show Unpaid and Partial
  const filteredPayments = useMemo(() => {
    let filtered = payments.filter((p) => {
      const staffIds = new Set(schoolStaff.map((s) => s.id));
      const status = p.status.toLowerCase();
      return staffIds.has(p.staffId) && (status === 'unpaid' || status === 'partial');
    });

    if (selectedStaffType) {
      const staffIdsInType = schoolStaff
        .filter((t) => t.staffType === selectedStaffType)
        .map((t) => t.id);
      filtered = filtered.filter((p) => staffIdsInType.includes(p.staffId));
    }

    if (selectedStatus) {
      filtered = filtered.filter(
        (p) => p.status.toLowerCase() === selectedStatus.toLowerCase(),
      );
    }

    if (selectedYear) {
      filtered = filtered.filter((p) => p.year === parseInt(selectedYear));
    }

    if (selectedMonth) {
      filtered = filtered.filter((p) => p.month === parseInt(selectedMonth));
    }

    return filtered.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );
  }, [payments, selectedStaffType, selectedStatus, selectedYear, selectedMonth, schoolStaff]);

  const totalFiltered = filteredPayments.length;
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedStaffType, selectedStatus, selectedYear, selectedMonth]);

  const hasActiveFilters =
    selectedStaffType || selectedStatus || selectedYear || selectedMonth;

  const clearFilters = () => {
    setSelectedStaffType('');
    setSelectedStatus('Unpaid');
    setSelectedYear('');
    setSelectedMonth('');
  };

  const refresh = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '1000');
      const result = await apiClient<{
        salaries: StaffSalaryPayment[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/salaries?${params.toString()}`);
      setPayments(result.salaries);
    } catch (error) {
      console.error('Failed to refresh salaries from backend:', error);
    }
  };

  const handlePayment = async (payment: StaffSalaryPayment) => {
    const staffName = getStaffName(payment.staffId);
    const paymentAmountStr = paymentAmounts[payment.id] || '';
    const remainingBefore = payment.finalAmount - (payment.paidAmount || 0);
    const paymentAmount = paymentAmountStr
      ? parseFloat(paymentAmountStr)
      : remainingBefore;

    if (paymentAmount <= 0) {
      showError('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > remainingBefore) {
      showError(
        `Payment amount cannot exceed remaining amount of ${formatCurrency(
          remainingBefore,
        )}`,
      );
      return;
    }

    const confirmed = await showConfirm(
      `Mark payment of ${formatCurrency(paymentAmount)} for ${staffName}?`,
      'Confirm Payment',
      'Mark as Paid',
      'Cancel',
    );

    if (!confirmed) return;

    const newPaidTotal = (payment.paidAmount || 0) + paymentAmount;
    // Frontend-friendly status for any local usage
    const newStatus: SalaryPaymentStatus =
      newPaidTotal >= payment.finalAmount ? 'Paid' : 'Partial';
    // Backend enum expects uppercase values: PAID / UNPAID / PARTIAL
    const backendStatus = newStatus === 'Paid' ? 'PAID' : 'PARTIAL';

    try {
      await apiClient(`/salaries/${payment.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: backendStatus,
          paidAmount: newPaidTotal,
          paymentDate: new Date().toISOString(),
        }),
      });

      setPaymentAmounts((prev) => {
        const updated = { ...prev };
        delete updated[payment.id];
        return updated;
      });

      await refresh();
      showSuccess(
        `Payment of ${formatCurrency(paymentAmount)} recorded for ${staffName} (${newStatus})`,
      );
    } catch (error) {
      console.error('Error recording payment:', error);
      showError('Failed to record payment. Please try again.');
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredPayments.map((payment) => {
      const displayName = getStaffName(payment.staffId);
      const remainingAmount = payment.finalAmount - (payment.paidAmount || 0);
      return {
        Staff: displayName,
        'Staff Type': getStaffType(payment.staffId),
        Period: `${MONTH_NAMES[payment.month - 1]} ${payment.year}`,
        Amount: formatCurrency(payment.finalAmount),
        'Paid Amount': payment.paidAmount
          ? formatCurrency(payment.paidAmount)
          : 'PKR 0',
        Remaining: formatCurrency(remainingAmount),
        'Due Date': new Date(payment.dueDate).toLocaleDateString(),
        Status: payment.status,
      };
    });

    downloadCSV(csvData, 'salary-payments');
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    payments.forEach((p) => years.add(p.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [payments]);

  const stats = useMemo(() => {
    const total = filteredPayments.length;
    const totalAmount = filteredPayments.reduce(
      (sum, p) => sum + (p.finalAmount - (p.paidAmount || 0)),
      0,
    );
    const paidAmount = filteredPayments.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0,
    );
    return { total, totalAmount, paidAmount };
  }, [filteredPayments]);

  if (loading || staffLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pay Salary</h1>
            <p className="text-slate-700 mt-1">
              Record salary payments for staff members
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <DollarSign className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-700">Loading payments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pay Salary</h1>
            <p className="text-slate-700 mt-1">
              Record salary payments for staff members
            </p>
          </div>
          {filteredPayments.length > 0 && (
            <Button variant="outline" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Pending Payments</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Total Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Total Paid</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {formatCurrency(stats.paidAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">Filters</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={selectedStaffType}
                onChange={(e) =>
                  setSelectedStaffType(e.target.value as StaffType | '')
                }
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Types</option>
                <option value="TEACHER">Teacher</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMINISTRATIVE">Administrative</option>
                <option value="SUPPORT">Support</option>
                <option value="SECURITY">Security</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="IT">IT</option>
                <option value="FINANCE">Finance</option>
                <option value="OTHER">Other</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as SalaryPaymentStatus | '')
                }
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Status</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Months</option>
                {MONTH_NAMES.map((month, index) => (
                  <option key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <PaginatedDataTable
          title={`Pending Salary Payments (${totalFiltered})`}
          columns={PAY_SALARIES_COLUMNS}
          isEmpty={totalFiltered === 0}
          emptyContent={
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-900 font-medium">No pending payments found</p>
              <p className="text-sm text-slate-700 mt-1">
                All salaries have been paid or try adjusting your filters
              </p>
            </div>
          }
          totalCount={totalFiltered}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        >
          {paginatedPayments.map((payment) => {
            const staffMember = schoolStaff.find((t) => t.id === payment.staffId);
            const displayName = getStaffName(payment.staffId);
            const remainingAmount = payment.finalAmount - (payment.paidAmount || 0);
            const paymentAmountStr = paymentAmounts[payment.id] || '';
            return (
              <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <StaffAvatar staff={staffMember} displayName={displayName} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{displayName}</p>
                      <p className="text-xs text-slate-700">{getStaffType(payment.staffId)}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">
                  {MONTH_NAMES[payment.month - 1]} {payment.year}
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(payment.finalAmount)}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-slate-800">{formatCurrency(payment.paidAmount || 0)}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-semibold text-orange-600">
                    {formatCurrency(remainingAmount)}
                  </p>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">
                  {new Date(payment.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={paymentAmountStr}
                    onChange={(e) =>
                      setPaymentAmounts((prev) => ({
                        ...prev,
                        [payment.id]: e.target.value,
                      }))
                    }
                    placeholder={formatCurrency(remainingAmount)}
                    min={0}
                    max={remainingAmount}
                    className="w-32 px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                  />
                </td>
                <td className="py-3 px-4">
                  <Button size="sm" onClick={() => handlePayment(payment)} disabled={remainingAmount === 0}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Pay
                  </Button>
                </td>
              </tr>
            );
          })}
        </PaginatedDataTable>
      </div>

      <AlertComponent />
      <ConfirmComponent />
    </>
  );
}

