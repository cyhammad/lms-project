'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Filter, Eye, X, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/constants/routes';
import type { Teacher, StaffType } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const HISTORY_STAFF_COLUMNS: DataTableColumn[] = [
  { id: 'details', label: 'Staff Details' },
  { id: 'salary', label: 'Monthly Salary', align: 'right' },
  { id: 'actions', label: 'Actions', className: 'text-center' },
];

type CurrentUser = {
  schoolId?: string;
};

interface SalaryHistoryClientProps {
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

export function SalaryHistoryClient({ user }: SalaryHistoryClientProps) {
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [historyStaffType, setHistoryStaffType] = useState<StaffType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load staff from backend
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
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
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    void loadStaff();
  }, []);

  const schoolStaff = useMemo(() => {
    return user?.schoolId ? staff.filter((t) => t.schoolId === user.schoolId) : staff;
  }, [staff, user?.schoolId]);

  const getStaffName = (s: Teacher) => s.name || 'Unknown';
  const getStaffType = (s: Teacher) => s.staffType || 'N/A';

  // Filtered staff for Salary History
  const filteredHistoryStaff = useMemo(() => {
    let filtered = [...schoolStaff];

    if (historyStaffType) {
      filtered = filtered.filter((s) => s.staffType === historyStaffType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const name = getStaffName(s).toLowerCase();
        const type = getStaffType(s).toLowerCase();
        return name.includes(query) || type.includes(query);
      });
    }

    return filtered;
  }, [schoolStaff, historyStaffType, searchQuery]);

  const totalFiltered = filteredHistoryStaff.length;
  const paginatedHistoryStaff = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistoryStaff.slice(start, start + pageSize);
  }, [filteredHistoryStaff, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [historyStaffType, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salary History</h1>
          <p className="text-slate-700 mt-1">
            View salary history for all staff members
          </p>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CreditCard className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-700">Loading staff...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Salary History</h1>
        <p className="text-slate-700 mt-1">View salary history for all staff members</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
            {(historyStaffType || searchQuery) && (
              <button
                onClick={() => {
                  setHistoryStaffType('');
                  setSearchQuery('');
                }}
                className="ml-auto flex items-center gap-1 text-xs text-slate-800 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-800" />
              <input
                type="text"
                placeholder="Search by name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              />
            </div>
            <select
              value={historyStaffType}
              onChange={(e) => setHistoryStaffType(e.target.value as StaffType | '')}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
            >
              <option value="">All Staff Types</option>
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
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={`Staff Members (${totalFiltered})`}
        columns={HISTORY_STAFF_COLUMNS}
        isEmpty={totalFiltered === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">No staff members found</p>
            <p className="text-sm text-slate-700 mt-1">Try adjusting your filters</p>
          </div>
        }
        totalCount={totalFiltered}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedHistoryStaff.map((staffMember) => {
          const displayName = getStaffName(staffMember);
          const monthlySalary = staffMember.monthlySalary || 0;
          return (
            <tr key={staffMember.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <StaffAvatar staff={staffMember} displayName={displayName} />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{displayName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{getStaffType(staffMember)}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {monthlySalary > 0 ? formatCurrency(monthlySalary) : 'Not set'}
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <Link href={ROUTES.ADMIN.SALARIES.STAFF(staffMember.id)}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View History
                  </button>
                </Link>
              </td>
            </tr>
          );
        })}
      </PaginatedDataTable>
    </div>
  );
}

