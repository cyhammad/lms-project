'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Edit, Trash2, Building2, Plus, Search, MapPin, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { School, SchoolStatus } from '@/types';
import { deleteSchool, updateSchoolStatus } from '@/actions/schools';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STATUS_OPTIONS: { value: '' | SchoolStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

function statusLabel(status: SchoolStatus): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'ON_HOLD': return 'On hold';
    case 'SUSPENDED': return 'Suspended';
    default: return status;
  }
}

const SCHOOL_COLUMNS: DataTableColumn[] = [
  { id: 'school', label: 'School' },
  { id: 'contact', label: 'Contact' },
  { id: 'plan', label: 'Plan' },
  { id: 'status', label: 'Status' },
  { id: 'created', label: 'Created' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface SchoolsClientProps {
  initialSchools: School[];
  initialStatusFilter?: '' | SchoolStatus;
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function SchoolsClient({ initialSchools, initialStatusFilter = '' }: SchoolsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<{ id: string; name: string } | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const statusFilter = (searchParams.get('status') as '' | SchoolStatus) || initialStatusFilter || '';

  useEffect(() => {
    setSchools(initialSchools);
  }, [initialSchools]);

  const filteredSchools = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return schools.filter((school) => {
      const matchesSearch =
        school.name.toLowerCase().includes(q) || school.email.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || school.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [schools, searchQuery, statusFilter]);

  const totalFiltered = filteredSchools.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedSchools = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSchools.slice(start, start + pageSize);
  }, [filteredSchools, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) setPage(totalPages);
  }, [totalFiltered, totalPages, page]);

  const handleStatusFilterChange = (value: '' | SchoolStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('status', value);
    else params.delete('status');
    router.push(`/super-admin/schools${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleQuickStatusChange = async (schoolId: string, newStatus: SchoolStatus) => {
    setUpdatingStatusId(schoolId);
    try {
      const result = await updateSchoolStatus(schoolId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: newStatus } : s));
        toast.success('Status updated');
        router.refresh();
      }
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!schoolToDelete) return;

    setDeletingId(schoolToDelete.id);
    try {
      const result = await deleteSchool(schoolToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSchools(prev => prev.filter(s => s.id !== schoolToDelete.id));
        toast.success(`School "${schoolToDelete.name}" deleted successfully`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error('Failed to delete school. Please try again.');
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setSchoolToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredSchools.map((school) => ({
      Name: school.name,
      Email: school.email,
      Phone: school.phone || 'N/A',
      Address: school.address || 'N/A',
      Plan: school.subscriptionTier?.name || 'No Plan',
      Status: statusLabel(school.status),
      'Created Date': formatDate(school.createdAt),
    }));

    downloadCSV(csvData, 'schools');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
          <p className="text-slate-700 mt-1">Manage all schools in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-semibold text-slate-700">{filteredSchools.length} Schools</span>
          </div>
          <Link href={ROUTES.SUPER_ADMIN.SCHOOLS_CREATE}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-md flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
              <input
                type="text"
                placeholder="Search schools by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm font-medium text-slate-800 whitespace-nowrap">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as '' | SchoolStatus)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={`All Schools (${totalFiltered})`}
        headerActions={
          totalFiltered > 0 ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          ) : null
        }
        columns={SCHOOL_COLUMNS}
        loading={false}
        isEmpty={totalFiltered === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {searchQuery || statusFilter ? 'No schools match your filters' : 'No schools found'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {searchQuery || statusFilter ? 'Try adjusting search or status' : 'Get started by adding your first school'}
            </p>
            {!searchQuery && !statusFilter && (
              <Link href={ROUTES.SUPER_ADMIN.SCHOOLS_CREATE}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First School
                </Button>
              </Link>
            )}
          </div>
        }
        totalCount={totalFiltered}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedSchools.map((school) => (
          <tr key={school.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
            <td className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 min-w-10 min-w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-slate-700/20">
                  {school.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{school.name}</p>
                  {school.address && (
                    <p className="text-xs text-slate-700 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {school.address}
                    </p>
                  )}
                </div>
              </div>
            </td>
            <td className="py-3 px-4">
              <p className="text-sm text-slate-700">{school.email}</p>
              <p className="text-xs text-slate-700">{school.phone}</p>
            </td>
            <td className="py-3 px-4">
              <div
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${school.subscriptionTier?.isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
              >
                {school.subscriptionTier?.name || 'No Plan'}
              </div>
            </td>
            <td className="py-3 px-4">
              <select
                value={school.status}
                onChange={(e) => handleQuickStatusChange(school.id, e.target.value as SchoolStatus)}
                disabled={updatingStatusId === school.id}
                className="text-xs border border-slate-200 rounded-lg py-1.5 pl-2 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-slate-700"
                title="Change status"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </td>
            <td className="py-3 px-4 text-sm text-slate-700">{formatDate(school.createdAt)}</td>
            <td className="py-3 px-4">
              <div className="flex items-center justify-end gap-1">
                <Link href={ROUTES.SUPER_ADMIN.SCHOOLS_VIEW(school.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                    <Eye className="w-4 h-4 text-blue-500" />
                  </Button>
                </Link>
                <Link href={ROUTES.SUPER_ADMIN.SCHOOLS_EDIT(school.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                    <Edit className="w-4 h-4 text-slate-700" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setSchoolToDelete({ id: school.id, name: school.name });
                    setShowDeleteDialog(true);
                  }}
                  disabled={deletingId === school.id}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the school "{schoolToDelete?.name}"?
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSchoolToDelete(null);
              }}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!!deletingId}
            >
              {deletingId ? 'Deleting...' : 'Delete School'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
