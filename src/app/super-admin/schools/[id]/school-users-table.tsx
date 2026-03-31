'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import type { User } from '@/types';

const COLUMNS: DataTableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Role' },
  { id: 'details', label: 'Details' },
  { id: 'created', label: 'Created' },
];

function getRoleBadgeColor(role: string) {
  const normalizedRole = role.toLowerCase() as User['role'];
  const colors: Record<User['role'], string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-indigo-100 text-indigo-700',
    teacher: 'bg-green-100 text-green-700',
    student: 'bg-yellow-100 text-yellow-700',
    parent: 'bg-pink-100 text-pink-700',
  };
  return colors[normalizedRole] || 'bg-gray-100 text-gray-700';
}

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export function SchoolUsersTable({ schoolUsers, totalUsers }: { schoolUsers: User[]; totalUsers: number }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(schoolUsers.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return schoolUsers.slice(start, start + pageSize);
  }, [schoolUsers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [schoolUsers.length]);

  useEffect(() => {
    if (schoolUsers.length > 0 && page > totalPages) setPage(totalPages);
  }, [schoolUsers.length, page, totalPages]);

  if (schoolUsers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-sm mb-4">No users assigned to this school</p>
        <Link href={ROUTES.SUPER_ADMIN.USERS_CREATE}>
          <Button variant="outline" size="sm">
            Add First User
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <PaginatedDataTable
      title={
        <div className="space-y-3 w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="block">School Users ({totalUsers})</span>
              <p className="text-sm font-normal text-slate-700 mt-1">All users associated with this school</p>
            </div>
            <Link href={ROUTES.SUPER_ADMIN.USERS_CREATE} className="shrink-0">
              <Button size="sm" className="w-full sm:w-auto">
                Add User
              </Button>
            </Link>
          </div>
        </div>
      }
      columns={COLUMNS}
      loading={false}
      isEmpty={false}
      emptyContent={null}
      totalCount={schoolUsers.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
    >
      {paginated.map((user) => {
        const normalizedRole = (user.role as string).toLowerCase() as User['role'];
        return (
          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">
              <div className="font-medium text-gray-900">{user.name}</div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
            <td className="py-3 px-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
              >
                {ROLES[normalizedRole] || user.role}
              </span>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600">
              {normalizedRole === 'parent' ? (
                <div>
                  <span className="capitalize">{user.parentType || 'N/A'}</span>
                  {user.studentId && (
                    <span className="text-gray-400 ml-2">• Student ID: {user.studentId}</span>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
            <td className="py-3 px-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
          </tr>
        );
      })}
    </PaginatedDataTable>
  );
}
