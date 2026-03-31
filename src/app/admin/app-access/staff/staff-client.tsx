'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAlert } from '@/hooks/use-alert';
import { apiClient } from '@/lib/api-client';
import type { Teacher, StaffType } from '@/types';
import { StaffAccessRow } from './staff-access-row';
import { StaffEditAccessModal } from './staff-edit-access-modal';
import { ResetPasswordModal } from '../reset-password-modal';
import { StaffFilters } from './staff-filters';
import { PaginatedDataTable, type DataTableColumn } from '@/components/data-table/paginated-data-table';

const STAFF_COLUMNS: DataTableColumn[] = [
  { id: 'member', label: 'Staff Member' },
  { id: 'type', label: 'Type' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

type CurrentUser = {
  schoolId?: string;
  user?: { schoolId?: string };
} | null;

interface StaffAppAccessClientProps {
  user: CurrentUser;
}

export function StaffAppAccessClient({ user }: StaffAppAccessClientProps) {
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const effectiveSchoolId =
    (user as { schoolId?: string } | null)?.schoolId ??
    (user as { user?: { schoolId?: string } } | null)?.user?.schoolId;

  const {
    showError,
    showSuccess,
    showConfirm,
    AlertComponent,
    ConfirmComponent,
  } = useAlert();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffType, setSelectedStaffType] = useState<StaffType | ''>('');
  const [editingStaff, setEditingStaff] = useState<Teacher | null>(null);
  const [resettingStaff, setResettingStaff] = useState<Teacher | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setStaffLoading(true);
        const params = new URLSearchParams();
        params.append('limit', '1000');
        params.append('isActive', 'true');

        const result = await apiClient<{
          staff: Teacher[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/staff?${params.toString()}`);

        setStaff(result.staff);
      } catch (error) {
        console.error('Failed to load staff from backend:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load staff from server';
        showError(message);
        setStaff([]);
      } finally {
        setStaffLoading(false);
      }
    };

    void loadStaff();
  }, [showError]);

  const schoolStaff = useMemo(() => {
    let filtered = effectiveSchoolId
      ? staff.filter((t) => t.schoolId === effectiveSchoolId && t.isActive)
      : staff.filter((t) => t.isActive);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.staffType?.toLowerCase().includes(query),
      );
    }

    if (selectedStaffType) {
      filtered = filtered.filter((s) => s.staffType === selectedStaffType);
    }

    return filtered;
  }, [staff, effectiveSchoolId, searchQuery, selectedStaffType]);

  // Derive access info directly from the API staff record (staff.username comes from the backend)
  const staffWithAccess = useMemo(() => {
    return schoolStaff.map((member) => ({
      staff: member,
      access: member.username
        ? {
          username: member.username,
          isActive: member.isActive,
          id: member.id,
        }
        : null,
    }));
  }, [schoolStaff]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedStaffType, staffWithAccess.length]);

  const totalPages = Math.max(1, Math.ceil(staffWithAccess.length / PAGE_SIZE));
  const paginatedStaff = useMemo(
    () => staffWithAccess.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [staffWithAccess, page],
  );

  const hasActiveFilters = searchQuery || selectedStaffType;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStaffType('');
  };

  const handleEdit = (staffMember: Teacher) => {
    setEditingStaff(staffMember);
  };

  const handleCloseModal = () => {
    setEditingStaff(null);
  };

  const handleSave = async (
    username: string,
    password: string,
    isActive: boolean,
  ) => {
    if (!editingStaff) return;

    try {
      await apiClient(`/staff/${editingStaff.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: username || undefined,
          password: password || undefined,
          isActive,
        }),
      });

      // Optimistically update local state so the table refreshes immediately
      setStaff((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id ? { ...s, username, isActive } : s,
        ),
      );

      showSuccess('App access saved successfully');
      handleCloseModal();
    } catch (error) {
      console.error('Error saving app access:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save app access. Please try again.';
      showError(message);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resettingStaff) return;
    try {
      await apiClient(`/staff/${resettingStaff.id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });
      showSuccess(`Password reset successfully for ${resettingStaff.name}`);
      setResettingStaff(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again.';
      showError(message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to remove app access for "${name}"? This will prevent them from logging into the app.`,
      'Remove App Access',
      'Remove',
      'Cancel',
      'destructive',
    );

    if (!confirmed) return;

    setDeletingId(id);
    try {
      // Clear the username on the backend — no username means no app login
      await apiClient(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ username: '' }),
      });

      // Optimistically clear username in local state
      setStaff((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, username: undefined } : s,
        ),
      );

      showSuccess('App access removed successfully');
    } catch (error) {
      console.error('Error removing app access:', error);
      showError('Failed to remove app access. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const staffTypes = useMemo(() => {
    const types = new Set(
      schoolStaff.map((s) => s.staffType).filter(Boolean),
    ) as Set<StaffType>;
    return Array.from(types);
  }, [schoolStaff]);

  if (staffLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff App Access</h1>
            <p className="text-slate-700 mt-1">
              Manage staff app access credentials
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Key className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-700">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff App Access</h1>
            <p className="text-slate-700 mt-1">
              Manage username and password for staff app access
            </p>
          </div>
        </div>

        <StaffFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStaffType={selectedStaffType}
          onStaffTypeChange={setSelectedStaffType}
          hasActiveFilters={!!hasActiveFilters}
          onClearFilters={clearFilters}
          staffTypes={staffTypes}
        />

        <PaginatedDataTable
          title={
            hasActiveFilters
              ? `Showing ${staffWithAccess.length} of ${schoolStaff.length} staff members`
              : `All Staff Members (${schoolStaff.length})`
          }
          columns={STAFF_COLUMNS}
          loading={false}
          isEmpty={staffWithAccess.length === 0}
          emptyContent={
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-700">No staff members found</p>
              <p className="text-sm text-slate-800 mt-1">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'No active staff members in the system'}
              </p>
            </div>
          }
          totalCount={staffWithAccess.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        >
          {paginatedStaff.map(({ staff: member, access }) => (
            <StaffAccessRow
              key={member.id}
              staff={member}
              access={access}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onResetPassword={setResettingStaff}
              deletingId={deletingId}
            />
          ))}
        </PaginatedDataTable>
      </div>

      {editingStaff && (
        <StaffEditAccessModal
          staff={editingStaff}
          access={
            editingStaff.username
              ? {
                username: editingStaff.username,
                isActive: editingStaff.isActive,
                id: editingStaff.id,
              }
              : null
          }
          onClose={handleCloseModal}
          onSave={handleSave}
          isEditing={!!editingStaff.username}
        />
      )}

      {resettingStaff && (
        <ResetPasswordModal
          name={resettingStaff.name}
          identifier={resettingStaff.email}
          onClose={() => setResettingStaff(null)}
          onReset={handleResetPassword}
        />
      )}

      <AlertComponent />
      <ConfirmComponent />
    </>
  );
}
