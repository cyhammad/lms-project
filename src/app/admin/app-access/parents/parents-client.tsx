'use client';

import { useState, useMemo, useEffect } from 'react';
import { Key, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAlert } from '@/hooks/use-alert';
import { apiClient } from '@/lib/api-client';
import type { Parent } from '@/types';
import { BackendParentsCard } from './backend-parents-card';
import { BackendParentAccessModal } from './backend-parent-access-modal';
import { ResetPasswordModal } from '../reset-password-modal';
import { groupParentsByStudent, type StudentParentAccessRow } from './group-parents-by-student';

type CurrentUser = {
  schoolId?: string;
};

interface ParentsClientProps {
  user: CurrentUser | null;
}

export function ParentsClient({ user }: ParentsClientProps) {
  const { showError, showSuccess, AlertComponent } = useAlert();

  const [parents, setParents] = useState<Parent[]>([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [editingStudentLabel, setEditingStudentLabel] = useState<string | undefined>(undefined);
  const [resettingParent, setResettingParent] = useState<Parent | null>(null);
  const [resettingStudentLabel, setResettingStudentLabel] = useState<string | undefined>(undefined);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadParents = async () => {
      if (!user?.schoolId) return;
      try {
        setParentsLoading(true);
        const params = new URLSearchParams();
        params.append('limit', '1000');

        const result = await apiClient<{
          parents: Parent[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(`/parents?${params.toString()}`);

        setParents(result.parents);
      } catch (error) {
        console.error('Failed to load parents from backend:', error);
        const message =
          error instanceof Error ? error.message : 'Failed to load parents';
        showError(message);
      } finally {
        setParentsLoading(false);
      }
    };

    void loadParents();
  }, [user?.schoolId, showError]);

  const groupedRows = useMemo(() => groupParentsByStudent(parents), [parents]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return groupedRows;
    const query = searchQuery.toLowerCase();
    return groupedRows.filter((row: StudentParentAccessRow) => {
      const studentText =
        `${row.student.firstName} ${row.student.lastName}`.toLowerCase();
      if (studentText.includes(query)) return true;
      const cp = row.credentialParent;
      if (cp.username?.toLowerCase().includes(query)) return true;
      if (cp.phone?.toLowerCase().includes(query)) return true;
      if (cp.name.toLowerCase().includes(query)) return true;
      if (row.mother?.name.toLowerCase().includes(query)) return true;
      if (row.father?.name.toLowerCase().includes(query)) return true;
      if (row.mother?.phone?.toLowerCase().includes(query)) return true;
      if (row.father?.phone?.toLowerCase().includes(query)) return true;
      if (row.guardianInMotherSlot?.name.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [groupedRows, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filteredRows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  useEffect(() => {
    if (filteredRows.length > 0 && page > totalPages) setPage(totalPages);
  }, [filteredRows.length, totalPages, page]);

  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page],
  );

  const handleSaveAccess = async (
    username: string,
    password: string,
    isActive: boolean,
  ) => {
    if (!editingParent) return;

    if (!password && !editingParent.username) {
      showError('Password is required when creating new access.');
      return;
    }

    try {
      await apiClient(`/parents/${editingParent.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username,
          ...(password ? { password } : {}),
          isActive,
        }),
      });

      // Optimistically update local state
      setParents((prev) =>
        prev.map((p) =>
          p.id === editingParent.id ? { ...p, username, isActive } : p,
        ),
      );

      showSuccess(
        editingParent.username
          ? 'App access updated successfully.'
          : 'App access created successfully.',
      );
      setEditingParent(null);
    } catch (error) {
      console.error('Error saving parent app access:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save app access. Please try again.';
      showError(message);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resettingParent) return;
    try {
      await apiClient(`/parents/${resettingParent.id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });
      showSuccess(`Password reset successfully for ${resettingParent.name}`);
      setResettingParent(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again.';
      showError(message);
    }
  };

  if (parentsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parents App Access</h1>
          <p className="text-slate-700 mt-1">Manage parent app access credentials</p>
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parents App Access</h1>
          <p className="text-slate-700 mt-1">
            Manage username and password for parent app access
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
          <input
            type="text"
            placeholder="Search by student, parent name, username or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-800 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <BackendParentsCard
          rows={paginatedRows}
          totalCount={filteredRows.length}
          loading={false}
          onManageAccount={(parent, studentLabel) => {
            setEditingStudentLabel(studentLabel);
            setEditingParent(parent);
          }}
          onResetPassword={(parent, studentLabel) => {
            setResettingStudentLabel(studentLabel);
            setResettingParent(parent);
          }}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {editingParent && (
        <BackendParentAccessModal
          parent={editingParent}
          studentLabel={editingStudentLabel}
          isEditing={!!editingParent.username}
          onClose={() => {
            setEditingParent(null);
            setEditingStudentLabel(undefined);
          }}
          onSave={handleSaveAccess}
        />
      )}

      {resettingParent && (
        <ResetPasswordModal
          name={
            resettingStudentLabel
              ? `${resettingParent.name} (${resettingStudentLabel})`
              : resettingParent.name
          }
          identifier={resettingParent.username || resettingParent.email || ''}
          onClose={() => {
            setResettingParent(null);
            setResettingStudentLabel(undefined);
          }}
          onReset={handleResetPassword}
        />
      )}

      <AlertComponent />
    </>
  );
}
