'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Filter,
  Calendar,
  Trash2,
  X,
  TrendingUp,
  AlertTriangle,
  Users,
  Download,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { apiClient } from '@/lib/api-client';
import type { SalaryPaymentStatus, StaffType, Teacher, StaffSalaryPayment } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const SALARY_RECORDS_COLUMNS: DataTableColumn[] = [
  { id: 'staff', label: 'Staff' },
  { id: 'type', label: 'Type' },
  { id: 'period', label: 'Period' },
  { id: 'amount', label: 'Amount' },
  { id: 'due', label: 'Due' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Action' },
];
import { SalarySlipButton } from './salary-slip-button';

type CurrentUser = {
  schoolId?: string;
};

interface SalariesClientProps {
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

export function SalariesClient({ user }: SalariesClientProps) {
  const [payments, setPayments] = useState<StaffSalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const { showError, showSuccess, showConfirm, AlertComponent, ConfirmComponent } = useAlert();

  // Filter states
  const [selectedStaffType, setSelectedStaffType] = useState<StaffType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<SalaryPaymentStatus | ''>('Unpaid');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load staff from backend (for type display/filtering)
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
        // Fetch a reasonably large page; further filtering is done client-side
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

  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    if (selectedStaffType) {
      const staffIdsInType = schoolStaff
        .filter((t) => t.staffType === selectedStaffType)
        .map((t) => t.id);
      filtered = filtered.filter((p) => staffIdsInType.includes(p.staffId));
    }

    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    if (selectedYear) {
      filtered = filtered.filter((p) => p.year === parseInt(selectedYear));
    }

    if (selectedMonth) {
      filtered = filtered.filter((p) => p.month === parseInt(selectedMonth));
    }

    const schoolStaffIds = new Set(schoolStaff.map((t) => t.id));
    filtered = filtered.filter((p) => schoolStaffIds.has(p.staffId));

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

  const stats = useMemo(() => {
    const total = filteredPayments.length;

    const paid = filteredPayments.filter(
      (p) => p.status.toLowerCase() === 'paid'.toLowerCase(),
    ).length;

    const unpaid = filteredPayments.filter(
      (p) => p.status.toLowerCase() === 'unpaid'.toLowerCase(),
    ).length;

    const partial = filteredPayments.filter(
      (p) => p.status.toLowerCase() === 'partial'.toLowerCase(),
    ).length;

    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.finalAmount, 0);

    const paidAmount = filteredPayments
      .filter((p) => {
        const status = p.status.toLowerCase();
        return status === 'paid' || status === 'partial';
      })
      .reduce((sum, p) => sum + (p.paidAmount || p.finalAmount), 0);

    const outstandingAmount = filteredPayments
      .filter((p) => {
        const status = p.status.toLowerCase();
        return status === 'unpaid' || status === 'partial';
      })
      .reduce((sum, p) => sum + (p.finalAmount - (p.paidAmount || 0)), 0);

    return { total, paid, unpaid, partial, totalAmount, paidAmount, outstandingAmount };
  }, [filteredPayments]);

  const clearFilters = () => {
    setSelectedStaffType('');
    setSelectedStatus('');
    setSelectedYear('');
    setSelectedMonth('');
  };

  const hasActiveFilters =
    selectedStaffType || selectedStatus || selectedYear || selectedMonth;

  const handleDeleteAll = async () => {
    showError('Bulk delete is not supported for backend salaries yet.');
  };

  const handleDownloadCSV = () => {
    const csvData = filteredPayments.map((payment) => {
      const displayName = getStaffName(payment.staffId);
      return {
        Staff: displayName,
        'Staff Type': getStaffType(payment.staffId),
        Period: payment.month
          ? `${MONTH_NAMES[payment.month - 1]} ${payment.year}`
          : `${payment.year}`,
        Amount: formatCurrency(payment.finalAmount),
        'Due Date': new Date(payment.dueDate).toLocaleDateString(),
        Status: payment.status,
        'Paid Amount': payment.paidAmount ? formatCurrency(payment.paidAmount) : 'N/A',
      };
    });

    downloadCSV(csvData, 'salaries');
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    payments.forEach((p) => years.add(p.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [payments]);

  useEffect(() => {
    if (!loading) {
      const today = new Date();
      if (!selectedMonth) setSelectedMonth(String(today.getMonth() + 1));
      if (!selectedYear) setSelectedYear(String(today.getFullYear()));
    }
  }, [loading, selectedMonth, selectedYear]);

  if (loading || staffLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Salary Management</h1>
            <p className="text-slate-700 mt-1">View and manage all staff salaries</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CreditCard className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-700">Loading salaries...</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Salary Management</h1>
            <p className="text-slate-700 mt-1">View and manage all staff salaries</p>
          </div>
          <div className="flex items-center gap-3">
            {payments.length > 0 && (
              <Button
                variant="outline"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete All'}
              </Button>
            )}
            <Link href={ROUTES.ADMIN.SALARIES.GENERATE}>
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                Generate Salaries
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Total Salaries</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                  <p className="text-xs text-slate-700 mt-1">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Paid</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.paid}</p>
                  <p className="text-xs text-slate-700 mt-1">
                    {formatCurrency(stats.paidAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Unpaid</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.unpaid}</p>
                  <p className="text-xs text-slate-700 mt-1">{stats.partial} partial</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {formatCurrency(stats.outstandingAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
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
                <option value="Paid">Paid</option>
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
          title={`Salary Records (${totalFiltered})`}
          headerActions={
            totalFiltered > 0 ? (
              <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            ) : null
          }
          columns={SALARY_RECORDS_COLUMNS}
          isEmpty={totalFiltered === 0}
          emptyContent={
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-900 font-medium">No salaries found</p>
              <p className="text-sm text-slate-700 mt-1">
                Try adjusting your filters or generate new salaries
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
            return (
              <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <StaffAvatar staff={staffMember} displayName={displayName} />
                    <p className="text-sm font-medium text-slate-900">{displayName}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                    {getStaffType(payment.staffId)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">
                  {MONTH_NAMES[payment.month - 1]} {payment.year}
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(payment.finalAmount)}
                  </p>
                  {payment.deductions > 0 && (
                    <p className="text-xs text-red-600">-{formatCurrency(payment.deductions)}</p>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-slate-700">
                  {new Date(payment.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${payment.status === 'Paid'
                      ? 'bg-slate-50 text-slate-700'
                      : payment.status === 'Partial'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                      }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <SalarySlipButton
                    payment={payment}
                    staff={staffMember}
                    schoolId={user?.schoolId}
                  />
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

