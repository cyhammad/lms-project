'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Building2, Plus, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/constants/routes';
import { getCampusesBySchoolId, deleteCampus } from '@/lib/campus-storage';
import { downloadCSV } from '@/lib/csv-export';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const CAMPUS_COLUMNS: DataTableColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'address', label: 'Address' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'principal', label: 'Principal' },
    { id: 'status', label: 'Status' },
    { id: 'created', label: 'Created' },
    { id: 'actions', label: 'Actions', align: 'right' },
];

interface CampusesClientProps {
    user: any;
}

export default function CampusesClient({ user }: CampusesClientProps) {
    const [campuses, setCampuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [campusToDelete, setCampusToDelete] = useState<{ id: string; name: string } | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (user?.schoolId) {
            const schoolCampuses = getCampusesBySchoolId(user.schoolId);
            setCampuses(schoolCampuses);
        }
        setLoading(false);
    }, [user]);

    const totalCount = campuses.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const paginatedCampuses = useMemo(() => {
        const start = (page - 1) * pageSize;
        return campuses.slice(start, start + pageSize);
    }, [campuses, page, pageSize]);

    useEffect(() => {
        if (totalCount > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [totalCount, totalPages, page]);

    const handleDelete = (id: string, name: string) => {
        setCampusToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!campusToDelete) return;
        setDeletingId(campusToDelete.id);
        try {
            deleteCampus(campusToDelete.id);
            setCampuses(prev => prev.filter(c => c.id !== campusToDelete.id));
        } catch (error) {
            console.error('Error deleting campus:', error);
            alert('Failed to delete campus. Please try again.');
        } finally {
            setDeletingId(null);
            setDeleteDialogOpen(false);
            setCampusToDelete(null);
        }
    };

    const handleDownloadCSV = () => {
        const csvData = campuses.map((campus) => ({
            Name: campus.name,
            Address: campus.address || 'N/A',
            Phone: campus.phone || 'N/A',
            Email: campus.email || 'N/A',
            Principal: campus.principalName || 'N/A',
            Status: campus.isActive ? 'Active' : 'Inactive',
            'Created Date': formatDate(campus.createdAt),
        }));

        downloadCSV(csvData, 'campuses');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campuses</h1>
                    <p className="text-gray-600 mt-1">Manage all campuses in your school</p>
                </div>
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-gray-500">Loading campuses...</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campuses</h1>
                    <p className="text-gray-600 mt-1">Manage all campuses in your school</p>
                </div>
                <Link href={ROUTES.ADMIN.ADMINISTRATION.CAMPUSES_CREATE}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Campus
                    </Button>
                </Link>
            </div>

            <PaginatedDataTable
                title={
                    <span>
                        All Campuses
                        <span className="block text-sm font-normal text-slate-700 mt-0.5 normal-case">
                            List of all campuses in your school
                        </span>
                    </span>
                }
                headerActions={
                    campuses.length > 0 ? (
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            Download CSV
                        </Button>
                    ) : null
                }
                columns={CAMPUS_COLUMNS}
                isEmpty={campuses.length === 0}
                emptyContent={
                    <div className="text-center py-12 text-gray-500">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">No campuses found</p>
                        <p className="text-sm mb-4">Get started by adding your first campus</p>
                        <Link href={ROUTES.ADMIN.ADMINISTRATION.CAMPUSES_CREATE}>
                            <Button>Add New Campus</Button>
                        </Link>
                    </div>
                }
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            >
                {paginatedCampuses.map((campus) => (
                    <tr key={campus.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{campus.name}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{campus.address}</td>
                        <td className="py-3 px-4 text-gray-600">{campus.phone || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{campus.email || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{campus.principalName || '-'}</td>
                        <td className="py-3 px-4">
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campus.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {campus.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(campus.createdAt)}</td>
                        <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                                <Link href={ROUTES.ADMIN.ADMINISTRATION.CAMPUSES_EDIT(campus.id)}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        title="Edit campus"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(campus.id, campus.name)}
                                    disabled={deletingId === campus.id}
                                    title="Delete campus"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </PaginatedDataTable>

            <ConfirmDialog
                open={deleteDialogOpen}
                onConfirm={confirmDelete}
                onCancel={() => { setDeleteDialogOpen(false); setCampusToDelete(null); }}
                title="Delete campus"
                message={campusToDelete ? `Are you sure you want to delete campus "${campusToDelete.name}"? This action cannot be undone.` : ''}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
