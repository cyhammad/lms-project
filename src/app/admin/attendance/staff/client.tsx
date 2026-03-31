'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Search, X, Eye, Calendar, CheckCircle2, XCircle, Clock, Users, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAttendance } from '@/hooks/use-attendance';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { apiClient } from '@/lib/api-client';
import type { Teacher, StaffType, AttendanceStatus } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const STAFF_ATTENDANCE_COLUMNS: DataTableColumn[] = [
    { id: 'member', label: 'Staff Member' },
    { id: 'type', label: 'Type' },
    { id: 'status', label: 'Status' },
    { id: 'actions', label: 'Actions', align: 'right' },
];

interface StaffAttendanceRowProps {
    staff: Teacher;
    attendanceStatus?: AttendanceStatus;
    onStatusChange: (staffId: string, status: AttendanceStatus) => void;
    selectedDate: Date;
}

const StaffAttendanceRow = ({
    staff,
    attendanceStatus,
    onStatusChange,
    selectedDate,
}: StaffAttendanceRowProps) => {
    const [imageError, setImageError] = useState(false);
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    const getStatusBadge = (status?: AttendanceStatus) => {
        if (!status) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium">
                    Not Marked
                </span>
            );
        }

        const statusConfig = {
            Present: { bg: 'bg-slate-50', text: 'text-slate-700', icon: CheckCircle2 },
            Absent: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
            Late: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
        };

        const config = statusConfig[status];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bg} ${config.text} text-xs font-medium`}>
                <Icon className="w-3.5 h-3.5" />
                {status}
            </span>
        );
    };

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
                        <p className="text-xs text-slate-700">{staff.email}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 px-4">
                {staff.staffType ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                        {staff.staffType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                ) : (
                    <span className="text-slate-800 text-sm">N/A</span>
                )}
            </td>
            <td className="py-3 px-4">
                {isToday ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { value: undefined, label: 'Not Marked', icon: Calendar, active: 'bg-slate-100 border-slate-300 text-slate-700', inactive: 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50' },
                            { value: 'Present' as AttendanceStatus, label: 'Present', icon: CheckCircle2, active: 'bg-slate-50 border-slate-300 text-slate-700 shadow-sm', inactive: 'bg-white border-slate-200 text-slate-700 hover:border-slate-200 hover:bg-slate-50/50' },
                            { value: 'Absent' as AttendanceStatus, label: 'Absent', icon: XCircle, active: 'bg-red-50 border-red-300 text-red-700 shadow-sm', inactive: 'bg-white border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50/50' },
                            { value: 'Late' as AttendanceStatus, label: 'Late', icon: Clock, active: 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm', inactive: 'bg-white border-slate-200 text-slate-700 hover:border-amber-200 hover:bg-amber-50/50' },
                        ].map(({ value, label, icon: Icon, active, inactive }) => {
                            const isSelected = value === undefined ? !attendanceStatus : attendanceStatus === value;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => {
                                        if (value !== undefined) {
                                            onStatusChange(staff.id, value);
                                        }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${isSelected ? active : inactive}`}
                                    title={label}
                                >
                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    getStatusBadge(attendanceStatus)
                )}
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                    <Link href={ROUTES.ADMIN.ATTENDANCE.STAFF_HISTORY(staff.id)}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View History">
                            <Eye className="w-4 h-4 text-slate-700" />
                        </Button>
                    </Link>
                </div>
            </td>
        </tr>
    );
};

interface StaffAttendanceClientProps {
    user: any;
}

export default function StaffAttendanceClient({ user }: StaffAttendanceClientProps) {
    const { attendances, loading: attendanceLoading, markAttendance, getAttendanceForDate, getPersonAttendanceForDate, refresh } = useAttendance();
    const { showSuccess, showError, AlertComponent } = useAlert();

    const [staff, setStaff] = useState<Teacher[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaffType, setSelectedStaffType] = useState<StaffType | ''>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const loadStaff = async () => {
            if (!user?.schoolId) {
                setStaff([]);
                setLoadingStaff(false);
                return;
            }
            try {
                setLoadingStaff(true);
                const response = await apiClient<{ staff: Teacher[]; pagination?: unknown }>('/staff?limit=1000&isActive=true');
                setStaff(response.staff || []);
            } catch (error) {
                console.error('Error loading staff:', error);
                setStaff([]);
            } finally {
                setLoadingStaff(false);
            }
        };
        loadStaff();
    }, [user?.schoolId]);

    const loading = loadingStaff || attendanceLoading;

    const schoolStaff = useMemo(() => {
        return user?.schoolId
            ? staff.filter(t => t.schoolId === user.schoolId && t.isActive !== false)
            : staff.filter(t => t.isActive !== false);
    }, [staff, user?.schoolId]);

    // Get attendance for selected date
    const dateAttendances = useMemo(() => {
        return getAttendanceForDate(selectedDate, user?.schoolId);
    }, [selectedDate, attendances, user?.schoolId]);

    // Calculate stats for selected date
    const stats = useMemo(() => {
        const staffIds = schoolStaff.map(s => s.id);
        const dateAttendancesForStats = dateAttendances.filter(a =>
            a.staffId && staffIds.includes(a.staffId)
        );

        const present = dateAttendancesForStats.filter(a => a.status === 'Present').length;
        const absent = dateAttendancesForStats.filter(a => a.status === 'Absent').length;
        const late = dateAttendancesForStats.filter(a => a.status === 'Late').length;
        const total = dateAttendancesForStats.length;

        return {
            total: schoolStaff.length,
            present,
            absent,
            late,
            notMarked: schoolStaff.length - total,
        };
    }, [schoolStaff, dateAttendances, selectedDate]);

    // Filtered staff
    const filteredStaff = useMemo(() => {
        let filtered = [...schoolStaff];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query) ||
                s.staffType?.toLowerCase().includes(query)
            );
        }

        if (selectedStaffType) {
            filtered = filtered.filter(s => s.staffType === selectedStaffType);
        }

        if (selectedStatus) {
            filtered = filtered.filter(s => {
                const attendance = getPersonAttendanceForDate(selectedDate, undefined, s.id);
                if (selectedStatus === 'Not Marked') {
                    return !attendance;
                }
                return attendance?.status === selectedStatus;
            });
        }

        return filtered;
    }, [schoolStaff, searchQuery, selectedStaffType, selectedStatus, selectedDate, dateAttendances]);

    const totalFiltered = filteredStaff.length;
    const paginatedStaff = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStaff.slice(start, start + pageSize);
    }, [filteredStaff, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedStaffType, selectedStatus, selectedDate]);

    const hasActiveFilters = selectedStaffType || selectedStatus || searchQuery;

    const clearFilters = () => {
        setSelectedStaffType('');
        setSelectedStatus('');
        setSearchQuery('');
    };

    const handleDownloadCSV = () => {
        const csvData = filteredStaff.map((staff) => {
            const attendance = getPersonAttendanceForDate(selectedDate, undefined, staff.id);
            return {
                Staff: staff.name,
                Email: staff.email,
                'Staff Type': staff.staffType || 'N/A',
                Date: selectedDate.toLocaleDateString(),
                Status: attendance?.status || 'Not Marked',
            };
        });

        downloadCSV(csvData, `staff-attendance-${selectedDate.toISOString().split('T')[0]}`);
    };

    const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
        if (!user?.schoolId || !user?.userId) {
            showError('Unable to mark attendance. Please refresh the page.');
            return;
        }

        try {
            const dateToUse = new Date(selectedDate);
            dateToUse.setHours(0, 0, 0, 0);

            markAttendance({
                staffId,
                date: dateToUse,
                status,
                markedBy: user.userId,
                schoolId: user.schoolId,
            });

            refresh();
            const staffMember = schoolStaff.find(s => s.id === staffId);
            showSuccess(`Attendance marked as ${status} for ${staffMember?.name || 'staff member'}`);
        } catch (error) {
            console.error('Error marking attendance:', error);
            showError('Failed to mark attendance. Please try again.');
        }
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Get unique staff types from API data (sorted for consistent dropdown order)
    const staffTypes = useMemo(() => {
        const types = new Set(schoolStaff.map(s => s.staffType).filter(Boolean)) as Set<StaffType>;
        return Array.from(types).sort();
    }, [schoolStaff]);

    const formatStaffTypeLabel = (type: StaffType) => {
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Staff Attendance</h1>
                        <p className="text-slate-700 mt-1">Manage staff attendance</p>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Briefcase className="w-8 h-8 text-slate-800" />
                            </div>
                            <p className="text-slate-700">Loading attendance data...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Staff Attendance</h1>
                    <p className="text-slate-700 mt-1">Manage and track staff attendance</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-semibold text-slate-700">{formatDate(selectedDate)}</span>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-700">Total Staff</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-700">Present</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.present}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-slate-800" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-700">Absent</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-700">Late</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.late}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-700">Not Marked</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.notMarked}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-slate-800" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Date Picker */}
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Date:</label>
                            <input
                                type="date"
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                max={new Date().toISOString().split('T')[0]}
                                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                            />
                            {!isToday && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedDate(new Date())}
                                >
                                    Today
                                </Button>
                            )}
                        </div>

                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or staff type..."
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
                                {staffTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {formatStaffTypeLabel(type)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                            >
                                <option value="">All Status</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Not Marked">Not Marked</option>
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
                title={
                    hasActiveFilters
                        ? `Showing ${totalFiltered} of ${schoolStaff.length} staff members`
                        : `All Staff Members (${schoolStaff.length})`
                }
                headerActions={
                    totalFiltered > 0 ? (
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            Download CSV
                        </Button>
                    ) : null
                }
                columns={STAFF_ATTENDANCE_COLUMNS}
                isEmpty={totalFiltered === 0}
                emptyContent={
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-slate-800" />
                        </div>
                        <p className="text-slate-900 font-medium">
                            {hasActiveFilters ? 'No staff members match your filters' : 'No staff members found'}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                            {hasActiveFilters
                                ? 'Try adjusting your search or filters'
                                : 'No active staff members in the system'}
                        </p>
                    </div>
                }
                totalCount={totalFiltered}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            >
                {paginatedStaff.map((staffMember) => {
                    const attendance = getPersonAttendanceForDate(selectedDate, undefined, staffMember.id);
                    return (
                        <StaffAttendanceRow
                            key={staffMember.id}
                            staff={staffMember}
                            attendanceStatus={attendance?.status}
                            onStatusChange={handleStatusChange}
                            selectedDate={selectedDate}
                        />
                    );
                })}
            </PaginatedDataTable>

            <AlertComponent />
        </div>
    );
}
