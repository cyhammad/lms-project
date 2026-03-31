'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Briefcase, Eye, UserPlus, Users, Search, X, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { deleteStaff } from '@/actions/staff';
// import { getSchoolById } from '@/lib/storage'; // Removed legacy storage dependency
import type { Teacher, StaffType } from '@/types';

const STAFF_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'member', label: 'Staff Member' },
  { id: 'contact', label: 'Contact' },
  { id: 'type', label: 'Type' },
  { id: 'joined', label: 'Joined' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface StaffClientProps {
  initialStaff: Teacher[];
  schoolId: string;
}

interface StaffRowProps {
  staff: Teacher;
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
}

const StaffRow = ({ staff, onDelete, deletingId }: StaffRowProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {staff.photo && !imageError ? (
            <img
              src={staff.photo}
              alt={staff.name}
              className="w-9 h-9 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20">
              {staff.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">{staff.name}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm text-slate-700">{staff.email}</p>
        <p className="text-xs text-slate-700">{staff.phone || 'No phone'}</p>
      </td>
      <td className="py-3 px-4">
        {staff.staffType ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
            {staff.staffType}
          </span>
        ) : (
          <span className="text-slate-800 text-sm">N/A</span>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-slate-700">
        {new Date(staff.createdAt).toLocaleDateString('en-GB')}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-1">
          <Link href={ROUTES.ADMIN.STAFF_VIEW(staff.id)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
              <Eye className="w-4 h-4 text-slate-700" />
            </Button>
          </Link>
          <Link href={ROUTES.ADMIN.STAFF_EDIT(staff.id)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
              <Edit className="w-4 h-4 text-slate-700" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onDelete(staff.id, staff.name)}
            disabled={deletingId === staff.id}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default function StaffClient({ initialStaff, schoolId }: StaffClientProps) {
  const { showError, showConfirm, AlertComponent, ConfirmComponent } = useAlert();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffType, setSelectedStaffType] = useState<StaffType | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const schoolStaff = useMemo(() => {
    let staff = initialStaff;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      staff = staff.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.staffType?.toLowerCase().includes(query)
      );
    }

    if (selectedStaffType) {
      staff = staff.filter(s => s.staffType === selectedStaffType);
    }

    return staff;
  }, [initialStaff, searchQuery, selectedStaffType]);

  const totalFiltered = schoolStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * pageSize;
    return schoolStaff.slice(start, start + pageSize);
  }, [schoolStaff, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedStaffType]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalFiltered, totalPages, page]);

  const hasActiveFilters = searchQuery || selectedStaffType;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStaffType('');
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete staff member "${name}"? This action cannot be undone.`,
      'Delete Staff Member',
      'Delete',
      'Cancel',
      'destructive'
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteStaff(id);
      if (!result.success) {
        showError(result.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff member:', error);
      showError('Failed to delete staff member. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = schoolStaff.map((staff) => ({
      Name: staff.name,
      Email: staff.email,
      Phone: staff.phone || 'N/A',
      'Staff Type': staff.staffType || 'N/A',
      'Joined Date': new Date(staff.createdAt).toLocaleDateString(),
    }));

    downloadCSV(csvData, 'staff');
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      // NOTE: We don't have school details in client without extra fetch or prop.
      // For now, simplify or omit detailed header if school info not available.

      // Basic PDF implementation
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      pdf.setFontSize(14);
      pdf.text('Staff Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Table Header
      pdf.setFontSize(10);
      pdf.text('Name', margin, yPos);
      pdf.text('Email', margin + 50, yPos);
      pdf.text('Type', margin + 110, yPos);
      yPos += 5;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Rows
      schoolStaff.forEach((staff) => {
        // simplified for brevity
        if (yPos > 280) { pdf.addPage(); yPos = 20; }
        pdf.text(staff.name.substring(0, 25), margin, yPos);
        pdf.text(staff.email.substring(0, 30), margin + 50, yPos);
        pdf.text(staff.staffType || '', margin + 110, yPos);
        yPos += 7;
      });

      pdf.save('Staff-Report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="text-slate-700 mt-1">Manage all staff members in your school</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-700">{schoolStaff.length} Staff</span>
          </div>
          <Link href={ROUTES.ADMIN.STAFF_CREATE}>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedStaffType}
                onChange={(e) => setSelectedStaffType(e.target.value as StaffType | '')}
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

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={`All Staff Members (${schoolStaff.length})`}
        headerActions={
          schoolStaff.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          ) : null
        }
        columns={STAFF_TABLE_COLUMNS}
        isEmpty={schoolStaff.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {hasActiveFilters ? 'No staff members match your filters' : 'No staff members added yet'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by adding your first staff member'}
            </p>
            {!hasActiveFilters && (
              <Link href={ROUTES.ADMIN.STAFF_CREATE}>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Staff
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
        {paginatedStaff.map((staff) => (
          <StaffRow key={staff.id} staff={staff} onDelete={handleDelete} deletingId={deletingId} />
        ))}
      </PaginatedDataTable>

      <AlertComponent />
      <ConfirmComponent />
    </div>
  );
}
