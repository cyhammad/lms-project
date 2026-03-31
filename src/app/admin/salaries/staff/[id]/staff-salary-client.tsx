'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, User, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const STAFF_YEAR_SALARY_COLUMNS: DataTableColumn[] = [
  { id: 'month', label: 'Month' },
  { id: 'amount', label: 'Amount' },
  { id: 'due', label: 'Due Date' },
  { id: 'status', label: 'Status' },
];
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/constants/routes';
import type { Teacher, StaffSalaryPayment } from '@/types';

type CurrentUser = {
  schoolId?: string;
};

interface StaffSalaryClientProps {
  user: CurrentUser | null;
  staffId: string;
}

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface StaffAvatarProps {
  staff: Teacher | null;
  displayName: string;
}

const StaffAvatar = ({ staff, displayName }: StaffAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  if (staff?.photo && !imageError) {
    return (
      <img
        src={staff.photo}
        alt={displayName}
        className="w-10 h-10 rounded-full object-cover border border-gray-200"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="w-10 h-10 min-w-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
      <User className="w-5 h-5 text-gray-500" />
    </div>
  );
};

export function StaffSalaryClient({ user, staffId }: StaffSalaryClientProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<Teacher | null>(null);
  const [payments, setPayments] = useState<StaffSalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load staff
        const staffResult = await apiClient<{ staff: Teacher }>(`/staff/${staffId}`);
        // Optional: check school match
        if (user?.schoolId && staffResult.staff.schoolId !== user.schoolId) {
          router.push(ROUTES.ADMIN.STAFF);
          return;
        }
        setStaff(staffResult.staff);

        // Load salaries for this staff
        const params = new URLSearchParams();
        params.append('limit', '1000');
        params.append('staffId', staffId);

        const salariesResult = await apiClient<{
          salaries: StaffSalaryPayment[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(`/salaries?${params.toString()}`);

        setPayments(salariesResult.salaries);

        // Default selected year
        if (salariesResult.salaries.length > 0) {
          const years = Array.from(new Set(salariesResult.salaries.map((p) => p.year)));
          const latestYear = years.sort((a, b) => b - a)[0];
          setSelectedYear(latestYear);
        } else {
          setSelectedYear(new Date().getFullYear());
        }
      } catch (error) {
        console.error('Failed to load staff salary data:', error);
        router.push(ROUTES.ADMIN.STAFF);
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      void loadData();
    }
  }, [staffId, user?.schoolId, router]);

  const displayName = staff?.name || 'N/A';

  const staffPayments = staff ? payments : [];

  // Summary
  const salarySummary = useMemo(() => {
    const totalSalaries = staffPayments.reduce((sum, p) => sum + p.finalAmount, 0);
    const totalPaid = staffPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalOutstanding = staffPayments.reduce(
      (sum, p) => sum + (p.finalAmount - (p.paidAmount || 0)),
      0,
    );
    return { totalSalaries, totalPaid, totalOutstanding };
  }, [staffPayments]);

  // Group salaries by year
  const salariesByYear = useMemo(() => {
    return staffPayments.reduce((acc, payment) => {
      const year = payment.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(payment);
      return acc;
    }, {} as Record<number, StaffSalaryPayment[]>);
  }, [staffPayments]);

  const years = useMemo(
    () => Object.keys(salariesByYear).map((y) => parseInt(y, 10)).sort((a, b) => b - a),
    [salariesByYear],
  );

  const effectiveSelectedYear =
    selectedYear && years.includes(selectedYear) ? selectedYear : years[0];

  const [salPage, setSalPage] = useState(1);
  const [salPageSize, setSalPageSize] = useState(10);

  const yearSalariesSorted = useMemo(() => {
    if (effectiveSelectedYear == null) return [];
    const list = salariesByYear[effectiveSelectedYear] ?? [];
    return [...list].sort((a, b) => a.month - b.month);
  }, [salariesByYear, effectiveSelectedYear]);

  const paginatedYearSalaries = useMemo(() => {
    const start = (salPage - 1) * salPageSize;
    return yearSalariesSorted.slice(start, start + salPageSize);
  }, [yearSalariesSorted, salPage, salPageSize]);

  useEffect(() => {
    setSalPage(1);
  }, [effectiveSelectedYear]);

  const selectedYearTotals = useMemo(() => {
    const total = yearSalariesSorted.reduce((sum, p) => sum + p.finalAmount, 0);
    const paid = yearSalariesSorted.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const outstanding = yearSalariesSorted.reduce(
      (sum, p) => sum + (p.finalAmount - (p.paidAmount || 0)),
      0,
    );
    return { total, paid, outstanding };
  }, [yearSalariesSorted]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-500">Loading staff salary...</div>
      </div>
    );
  }

  if (!staff) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.SALARIES.VIEW}>
            <button className="text-gray-500 hover:text-gray-700 p-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <StaffAvatar staff={staff} displayName={displayName} />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
            <p className="text-xs text-gray-500">Salary History</p>
          </div>
        </div>
      </div>

      {/* Salary Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Total Salaries</p>
          <p className="text-base font-semibold text-gray-900">
            {formatCurrency(salarySummary.totalSalaries)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-base font-semibold text-green-600">
            {formatCurrency(salarySummary.totalPaid)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Outstanding</p>
          <p className="text-base font-semibold text-red-600">
            {formatCurrency(salarySummary.totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Monthly Salaries */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Monthly Salaries</h2>
            {years.length > 0 && (
              <select
                value={effectiveSelectedYear ?? ''}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
          {years.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-xs">No salaries</p>
            </div>
          ) : (
            <div>
              {effectiveSelectedYear != null && (
                <div>
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-700">{effectiveSelectedYear}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        Total: {formatCurrency(selectedYearTotals.total)}
                      </span>
                      <span className="text-green-600">
                        Paid: {formatCurrency(selectedYearTotals.paid)}
                      </span>
                      <span className="text-red-600">
                        Out: {formatCurrency(selectedYearTotals.outstanding)}
                      </span>
                    </div>
                  </div>
                  <PaginatedDataTable
                    className="border-0 shadow-none"
                    columns={STAFF_YEAR_SALARY_COLUMNS}
                    isEmpty={yearSalariesSorted.length === 0}
                    emptyContent={
                      <div className="py-6 text-center text-xs text-gray-400">No rows for this year</div>
                    }
                    totalCount={yearSalariesSorted.length}
                    page={salPage}
                    pageSize={salPageSize}
                    onPageChange={setSalPage}
                    onPageSizeChange={setSalPageSize}
                    pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
                  >
                    {paginatedYearSalaries.map((payment) => {
                      const status = payment.status.toLowerCase();
                      return (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-1.5 px-2 text-xs text-gray-900">
                            {MONTH_NAMES[payment.month - 1]}
                          </td>
                          <td className="py-1.5 px-2 text-xs text-gray-900">
                            {formatCurrency(payment.finalAmount)}
                            {payment.deductions > 0 && (
                              <span className="text-gray-500 ml-1">
                                (-{formatCurrency(payment.deductions)})
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-xs text-gray-600">{formatDate(payment.dueDate)}</td>
                          <td className="py-1.5 px-2">
                            {status === 'paid' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Paid
                              </span>
                            )}
                            {status === 'partial' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                <AlertCircle className="w-2.5 h-2.5" />
                                Partial
                              </span>
                            )}
                            {status === 'unpaid' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                <XCircle className="w-2.5 h-2.5" />
                                Unpaid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </PaginatedDataTable>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* If no salaries at all */}
      {years.length === 0 && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-slate-800" />
              </div>
              <p className="text-sm font-medium text-slate-900">
                No salary records for this staff member yet
              </p>
              <p className="text-xs text-slate-700 max-w-xs">
                Generate salaries from the main Salaries page to see month-wise history
                here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

