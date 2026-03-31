'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn } from '@/components/data-table/paginated-data-table';

const SALARY_COLUMNS: DataTableColumn[] = [
  { id: 'staff', label: 'Staff' },
  { id: 'type', label: 'Type' },
  { id: 'basic', label: 'Basic Pay' },
  { id: 'deductions', label: 'Deductions' },
  { id: 'net', label: 'Net Pay' },
  { id: 'status', label: 'Status' },
  { id: 'due', label: 'Due Date' },
  { id: 'actions', label: 'Actions', align: 'right' },
];
import { useAlert } from '@/hooks/use-alert';
import { generateSalaries, updateSalary } from '@/actions/finance';
import { format } from 'date-fns';
import type { StaffSalaryPayment } from '@/types';

interface SalaryWithStaff extends StaffSalaryPayment {
  staff: {
    id: string;
    name: string;
    staffType: string;
  };
}

interface SalariesClientProps {
  salaries: SalaryWithStaff[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SalariesClient({
  salaries,
  pagination,
}: SalariesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess, AlertComponent } = useAlert();

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  // Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (monthFilter) params.set('month', monthFilter.toString());
    if (yearFilter) params.set('year', yearFilter.toString());

    router.push(`/admin/finance/salaries?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    router.push(`/admin/finance/salaries?${params.toString()}`);
  };

  const handleMarkPaid = async (id: string, currentAmount: number) => {
    setUpdatingId(id);
    const result = await updateSalary(id, {
      status: 'Paid',
      paymentDate: new Date().toISOString(),
      paidAmount: currentAmount,
    });
    setUpdatingId(null);

    if (result.success) {
      showSuccess('Salary marked as paid');
    } else {
      showError(result.error as string);
    }
  };

  const currentMonthName = new Date(0, monthFilter - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Salary Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff salary payments and records</p>
        </div>
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Salaries
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(parseInt(e.target.value))}
              className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={yearFilter}
              onChange={(e) => setYearFilter(parseInt(e.target.value))}
              className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <Button onClick={handleSearch} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
              <Search className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <PaginatedDataTable
        title={`Records for ${currentMonthName} ${yearFilter}`}
        headerActions={
          <span className="text-xs text-gray-500 whitespace-nowrap">Total: {pagination.total}</span>
        }
        columns={SALARY_COLUMNS}
        loading={false}
        isEmpty={salaries.length === 0}
        emptyContent={
          <div className="py-12 text-center text-sm text-gray-500">No salary records found for this selection.</div>
        }
        totalCount={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={goToPage}
      >
        {salaries.map((s) => (
          <tr key={s.id} className="hover:bg-gray-50/50">
            <td className="py-3 px-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{s.staff.name}</div>
            </td>
            <td className="py-3 px-4 whitespace-nowrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {s.staff.staffType}
              </span>
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">Rs. {s.amount.toLocaleString()}</td>
            <td className="py-3 px-4 whitespace-nowrap text-sm text-red-600">Rs. {s.deductions.toLocaleString()}</td>
            <td className="py-3 px-4 whitespace-nowrap text-sm font-bold text-gray-900">
              Rs. {s.finalAmount.toLocaleString()}
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-center">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.status === 'Paid'
                    ? 'bg-slate-100 text-slate-800'
                    : s.status === 'Partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
              >
                {s.status}
              </span>
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
              {format(new Date(s.dueDate), 'MMM dd, yyyy')}
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
              {s.status !== 'Paid' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMarkPaid(s.id, s.finalAmount)}
                  disabled={updatingId === s.id}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  {updatingId === s.id ? 'Saving...' : 'Mark Paid'}
                </Button>
              )}
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      <AlertComponent />

      {/* Generate Salaries Placeholder */}
      {isGenerateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Generate Salaries</h2>
            <p className="text-sm text-gray-500 mb-4">
              This feature is under development. It will process staff records and generate salary slips.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
