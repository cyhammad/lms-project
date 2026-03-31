'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Trash2, UserCog, Plus, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { deleteUser } from '@/actions/users';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { SchoolAdminSeatCappedPlan } from '@/constants/subscription-limits';

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    schoolId?: string;
    createdAt: string;
}

const ADMIN_TABLE_COLUMNS: DataTableColumn[] = [
    { id: 'admin', label: 'Admin' },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Role' },
    { id: 'created', label: 'Created' },
    { id: 'actions', label: 'Actions', align: 'right' },
];

interface AdminsClientProps {
    initialAdmins: User[];
    currentUserId?: string;
    /** When set, block adding admins once this count is reached (Starter / Pro caps). */
    maxSchoolAdmins?: number | null;
    adminSeatPlan?: SchoolAdminSeatCappedPlan | null;
}

export default function AdminsClient({
    initialAdmins,
    currentUserId,
    maxSchoolAdmins = null,
    adminSeatPlan = null,
}: AdminsClientProps) {
    const [admins, setAdmins] = useState<User[]>(initialAdmins);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [adminToDelete, setAdminToDelete] = useState<{ id: string, name: string } | null>(null);

    const totalCount = admins.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const paginatedAdmins = useMemo(() => {
        const start = (page - 1) * pageSize;
        return admins.slice(start, start + pageSize);
    }, [admins, page, pageSize]);

    useEffect(() => {
        if (totalCount > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [totalCount, totalPages, page]);

    const handleDeleteClick = (id: string, name: string) => {
        if (id === currentUserId) {
            toast.error("You cannot delete your own account.");
            return;
        }
        setAdminToDelete({ id, name });
    };

    const handleConfirmDelete = async () => {
        if (!adminToDelete) return;

        const { id } = adminToDelete;
        setAdminToDelete(null);
        setDeletingId(id);

        try {
            const result = await deleteUser(id);

            if (result.success) {
                setAdmins(prev => prev.filter(a => a.id !== id));
                toast.success('Administrator deleted successfully');
            } else {
                toast.error(result.error || 'Failed to delete admin');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            toast.error('Failed to delete admin. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const atAdminLimit = maxSchoolAdmins != null && admins.length >= maxSchoolAdmins;
    const planTitle = adminSeatPlan === 'pro' ? 'Pro' : adminSeatPlan === 'starter' ? 'Starter' : 'plan';

    const handleDownloadCSV = () => {
        const csvData = admins.map((admin) => ({
            Name: admin.name,
            Email: admin.email,
            Role: 'Admin',
            'Created Date': formatDate(admin.createdAt),
        }));

        downloadCSV(csvData, 'admins');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admins</h1>
                    <p className="text-slate-700 mt-1">Manage all admins in your school</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-slate-700">
                            {admins.length} Admin{admins.length !== 1 ? 's' : ''}
                            {maxSchoolAdmins != null && adminSeatPlan ? ` / ${maxSchoolAdmins} (${planTitle})` : ''}
                        </span>
                    </div>
                    {atAdminLimit ? (
                        <Button type="button" disabled title="Upgrade your plan to add more administrators">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Admin
                        </Button>
                    ) : (
                        <Link href={ROUTES.ADMIN.ADMINISTRATION.ADMINS_CREATE}>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Admin
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {atAdminLimit && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    Your {planTitle} plan includes up to {maxSchoolAdmins} school administrators. Remove an admin or
                    upgrade your subscription to invite more.
                </p>
            )}

            <PaginatedDataTable
                title={`All Admins (${totalCount})`}
                headerActions={
                    admins.length > 0 ? (
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            Download CSV
                        </Button>
                    ) : null
                }
                columns={ADMIN_TABLE_COLUMNS}
                isEmpty={admins.length === 0}
                emptyContent={
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UserCog className="w-8 h-8 text-slate-800" />
                        </div>
                        <p className="text-slate-900 font-medium">No admins found</p>
                        <p className="text-sm text-slate-700 mt-1 mb-4">Get started by adding your first admin</p>
                        {atAdminLimit ? (
                            <Button type="button" disabled>
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Admin
                            </Button>
                        ) : (
                            <Link href={ROUTES.ADMIN.ADMINISTRATION.ADMINS_CREATE}>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Admin
                                </Button>
                            </Link>
                        )}
                    </div>
                }
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            >
                {paginatedAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20">
                                    {admin.name.charAt(0).toUpperCase()}
                                </div>
                                <p className="font-medium text-slate-900">{admin.name}</p>
                            </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-800">{admin.email}</td>
                        <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                                <Shield className="w-3 h-3 mr-1" />
                                {admin.role.charAt(0).toUpperCase() + admin.role.slice(1).toLowerCase()}
                            </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">{formatDate(admin.createdAt)}</td>
                        <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                                <Link href={ROUTES.ADMIN.ADMINISTRATION.ADMINS_EDIT(admin.id)}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit admin">
                                        <Edit className="w-4 h-4 text-slate-700" />
                                    </Button>
                                </Link>
                                {admin.id !== currentUserId && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleDeleteClick(admin.id, admin.name)}
                                        disabled={deletingId === admin.id}
                                        title="Delete admin"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </PaginatedDataTable>

            <ConfirmDialog
                open={!!adminToDelete}
                onConfirm={handleConfirmDelete}
                onCancel={() => setAdminToDelete(null)}
                title="Delete Administrator"
                message={`Are you sure you want to delete admin "${adminToDelete?.name}"? This action will remove their access to the system.`}
                confirmText="Delete Admin"
                variant="destructive"
            />
        </div>
    );
}
