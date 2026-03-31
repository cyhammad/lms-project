'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Edit, Trash2, Users, UserPlus, Search, Shield, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import type { User, School, UserRole } from '@/types';
import { ROLES } from '@/constants/roles';
import { deleteUser } from '@/actions/users';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersClientProps {
  initialUsers: User[];
  initialSchools: School[];
  initialPagination: PaginationInfo;
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getRoleBadgeColor = (role: string) => {
  const normalizedRole = role.toLowerCase() as UserRole;
  const colors: Record<UserRole, string> = {
    super_admin: 'bg-purple-50 text-purple-700',
    admin: 'bg-blue-50 text-blue-700',
    manager: 'bg-indigo-50 text-indigo-700',
    teacher: 'bg-slate-50 text-slate-700',
    student: 'bg-amber-50 text-amber-700',
    parent: 'bg-pink-50 text-pink-700',
  };
  return colors[normalizedRole] || 'bg-slate-100 text-slate-700';
};

const USER_COLUMNS: DataTableColumn[] = [
  { id: 'user', label: 'User' },
  { id: 'role', label: 'Role' },
  { id: 'school', label: 'School' },
  { id: 'created', label: 'Created' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

export default function UsersClient({ initialUsers, initialSchools, initialPagination }: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
    setPagination(initialPagination);
  }, [initialUsers, initialPagination]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    router.push(`/super-admin/users${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const getSchoolName = (schoolId?: string) => {
    if (!schoolId) return 'N/A';
    const school = initialSchools.find(s => s.id === schoolId);
    return school?.name || 'Unknown School';
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete.id);
    try {
      const result = await deleteUser(userToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast.success(`User "${userToDelete.name}" deleted successfully`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredUsers.map((user) => ({
      Name: user.name,
      Email: user.email,
      Role: ROLES[(user.role as string).toLowerCase() as UserRole] || user.role,
      School: getSchoolName(user.schoolId),
      'Created Date': formatDate(user.createdAt),
    }));

    downloadCSV(csvData, 'admins');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admins</h1>
          <p className="text-slate-700 mt-1">Manage school admins</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-700">{pagination.total} Admins</span>
          </div>
          <Link href={ROUTES.SUPER_ADMIN.USERS_CREATE}>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
            <input
              type="text"
              placeholder="Search admins by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
            />
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={`Admins (page ${pagination.page} of ${pagination.totalPages || 1})`}
        headerActions={
          filteredUsers.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          ) : null
        }
        columns={USER_COLUMNS}
        loading={false}
        isEmpty={filteredUsers.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {searchQuery ? 'No admins match your search' : 'No admins found'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by adding your first admin'}
            </p>
            {!searchQuery && (
              <Link href={ROUTES.SUPER_ADMIN.USERS_CREATE}>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create First Admin
                </Button>
              </Link>
            )}
          </div>
        }
        totalCount={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={goToPage}
      >
        {filteredUsers.map((user) => (
          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-700">{user.email}</p>
                </div>
              </div>
            </td>
            <td className="py-3 px-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {(user.role as string).toLowerCase() === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                {ROLES[(user.role as string).toLowerCase() as UserRole] || user.role}
              </span>
            </td>
            <td className="py-3 px-4 text-sm text-slate-800">
              {user.schoolId ? getSchoolName(user.schoolId) : 'N/A'}
            </td>
            <td className="py-3 px-4 text-sm text-slate-700">{formatDate(user.createdAt)}</td>
            <td className="py-3 px-4">
              <div className="flex items-center justify-end gap-1">
                <Link href={ROUTES.SUPER_ADMIN.USERS_EDIT(user.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                    <Edit className="w-4 h-4 text-slate-700" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setUserToDelete({ id: user.id, name: user.name });
                    setShowDeleteDialog(true);
                  }}
                  disabled={deletingId === user.id}
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
              Are you sure you want to delete user "{userToDelete?.name}"?
              This action cannot be undone and will remove the user's access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
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
              {deletingId ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
