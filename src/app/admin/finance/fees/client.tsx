'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn } from '@/components/data-table/paginated-data-table';

const FEE_COLUMNS: DataTableColumn[] = [
  { id: 'student', label: 'Student' },
  { id: 'class', label: 'Class' },
  { id: 'feeType', label: 'Fee Type' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: 'due', label: 'Due Date' },
  { id: 'actions', label: 'Actions', align: 'right' },
];
import { useAlert } from '@/hooks/use-alert';
import { generateFees, updateFee } from '@/actions/finance';
import { format } from 'date-fns';
import type { Class, Section, StudentFeePayment } from '@/types';

// Extended type to include student details
interface FeeWithStudent extends StudentFeePayment {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    bFormCrc: string;
    section: {
      name: string;
      class: {
        name: string;
      };
    };
  };
}

interface FeesClientProps {
  initialClasses: Class[];
  initialSections: Section[];
  fees: FeeWithStudent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function FeesClient({
  initialClasses,
  initialSections,
  fees,
  pagination,
}: FeesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess, AlertComponent } = useAlert();

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  // Generate Fee Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Update Fee State
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const availableSections = useMemo(() => {
    if (!selectedClassId) return [];
    return initialSections.filter(s => s.classId === selectedClassId);
  }, [selectedClassId, initialSections]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedClassId) params.set('classId', selectedClassId);
    if (selectedSectionId) params.set('sectionId', selectedSectionId);
    if (statusFilter) params.set('status', statusFilter);
    if (monthFilter) params.set('month', monthFilter.toString());
    if (yearFilter) params.set('year', yearFilter.toString());

    router.push(`/admin/finance/fees?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    router.push(`/admin/finance/fees?${params.toString()}`);
  };

  const handleMarkPaid = async (feeId: string) => {
    setUpdatingId(feeId);
    const result = await updateFee(feeId, {
      status: 'Paid',
      paymentDate: new Date().toISOString(),
    });
    setUpdatingId(null);

    if (result.success) {
      showSuccess('Fee marked as paid');
    } else {
      showError(result.error as string);
    }
  };

  const currentMonthName = new Date(0, monthFilter - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Fee Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student fee collection and records</p>
        </div>
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Fees
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId('');
              }}
              className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {initialClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedClassId}
            >
              <option value="">All Sections</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
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
        columns={FEE_COLUMNS}
        loading={false}
        isEmpty={fees.length === 0}
        emptyContent={
          <div className="py-12 text-center text-sm text-gray-500">No fee records found for this selection.</div>
        }
        totalCount={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={goToPage}
      >
        {fees.map((fee) => (
          <tr key={fee.id} className="hover:bg-gray-50/50">
            <td className="py-3 px-4 whitespace-nowrap">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {fee.student.firstName} {fee.student.lastName}
                </div>
                <div className="text-xs text-gray-500">{fee.student.bFormCrc}</div>
              </div>
            </td>
            <td className="py-3 px-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {fee.student.section.class.name} - {fee.student.section.name}
              </div>
            </td>
            <td className="py-3 px-4 whitespace-nowrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {fee.feeType.replace('_', ' ')}
              </span>
            </td>
            <td className="py-3 px-4 whitespace-nowrap">
              <div className="text-sm font-semibold text-gray-900">Rs. {fee.finalAmount.toLocaleString()}</div>
              {fee.discountAmount > 0 && (
                <div className="text-xs text-green-600">Disc: Rs. {fee.discountAmount}</div>
              )}
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-center">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${fee.status === 'Paid'
                    ? 'bg-slate-100 text-slate-800'
                    : fee.status === 'Partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
              >
                {fee.status}
              </span>
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
              {format(new Date(fee.dueDate), 'MMM dd, yyyy')}
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
              {fee.status !== 'Paid' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMarkPaid(fee.id)}
                  disabled={updatingId === fee.id}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  {updatingId === fee.id ? 'Saving...' : 'Mark Paid'}
                </Button>
              )}
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      <AlertComponent />

      {/* Generate Fees Modal Placeholder - In a real app, this would be a Dialog component */}
      {isGenerateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Generate Fees</h2>
            <p className="text-sm text-gray-500 mb-4">
              This feature is under development. It will verify student rosters and generate monthly tuition fees.
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
