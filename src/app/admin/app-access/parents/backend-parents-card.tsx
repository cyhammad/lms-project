'use client';

import { Users, Edit, Lock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn } from '@/components/data-table/paginated-data-table';
import type { Parent } from '@/types';
import type { StudentParentAccessRow } from './group-parents-by-student';

const COLUMNS: DataTableColumn[] = [
  { id: 'student', label: 'Student' },
  { id: 'mother', label: 'Mother' },
  { id: 'father', label: 'Father' },
  { id: 'access', label: 'App access' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

function ParentCell({ parent }: { parent: Parent | null }) {
  if (!parent) {
    return <span className="text-sm text-slate-800">—</span>;
  }
  return (
    <div className="space-y-0.5">
      <p className="text-sm font-medium text-slate-900">{parent.name}</p>
      {parent.phone && <p className="text-xs text-slate-700">{parent.phone}</p>}
    </div>
  );
}

interface BackendParentsCardProps {
  /** Current page of rows (pre-sliced by parent) */
  rows: StudentParentAccessRow[];
  totalCount: number;
  loading: boolean;
  onManageAccount: (parent: Parent, studentLabel: string) => void;
  onResetPassword: (parent: Parent, studentLabel: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const BackendParentsCard = ({
  rows,
  totalCount,
  loading,
  onManageAccount,
  onResetPassword,
  page,
  pageSize,
  onPageChange,
}: BackendParentsCardProps) => {
  return (
    <PaginatedDataTable
      title={
        <div className="space-y-1">
          <span>
            Students & parent access {loading ? '' : `(${totalCount})`}
          </span>
          <p className="text-sm text-slate-700 font-normal">
            One login per student family. Mother and father appear together; username and password are stored on the
            parent account used for access (father is preferred when creating new access if none exists).
          </p>
        </div>
      }
      columns={COLUMNS}
      loading={loading}
      loadingIcon={<Users className="w-8 h-8 text-slate-800" />}
      loadingContent={<p className="text-slate-700">Loading...</p>}
      isEmpty={!loading && totalCount === 0}
      emptyContent={
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-700">No students with parent records</p>
          <p className="text-sm text-slate-800 mt-1">Parents are created when students are enrolled.</p>
        </div>
      }
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
    >
      {rows.map((row) => {
        const studentLabel = `${row.student.firstName} ${row.student.lastName}`.trim();
        const cp = row.credentialParent;
        const typeLabel = String(cp.parentType).toLowerCase();

        return (
          <tr key={row.student.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="py-3 px-4 align-top">
              <p className="text-sm font-semibold text-slate-900">{studentLabel}</p>
            </td>
            <td className="py-3 px-4 align-top">
              {row.mother ? (
                <ParentCell parent={row.mother} />
              ) : row.guardianInMotherSlot ? (
                <div className="space-y-0.5">
                  <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                    Guardian
                  </span>
                  <ParentCell parent={row.guardianInMotherSlot} />
                </div>
              ) : (
                <ParentCell parent={null} />
              )}
            </td>
            <td className="py-3 px-4 align-top">
              <ParentCell parent={row.father} />
            </td>
            <td className="py-3 px-4 align-top">
              {cp.username ? (
                <div className="space-y-1">
                  <p className="text-xs text-slate-700">
                    Linked account: <span className="text-slate-700 font-medium capitalize">{typeLabel}</span>
                  </p>
                  <p className="text-sm font-medium text-slate-900">{cp.username}</p>
                  <div className="flex items-center gap-1.5" title="Password is stored securely and cannot be displayed">
                    <span className="text-xs text-slate-700 font-mono">••••••••</span>
                    <Lock className="w-3 h-3 text-slate-800 shrink-0" />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-slate-800">No access configured</span>
              )}
            </td>
            <td className="py-3 px-4 align-top">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cp.isActive ? 'bg-slate-50 text-slate-700' : 'bg-red-50 text-red-700'
                  }`}
              >
                {cp.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3 px-4 text-right align-top">
              <div className="flex items-center justify-end gap-2">
                {cp.username && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResetPassword(cp, studentLabel)}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    title="Reset password"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageAccount(cp, studentLabel)}
                  title={cp.username ? 'Edit access' : 'Create access'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </PaginatedDataTable>
  );
};
