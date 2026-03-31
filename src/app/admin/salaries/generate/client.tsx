'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { CreditCard, Loader2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStaffSalaryPayments } from '@/hooks/use-staff-salary-payments';
import { useAlert } from '@/hooks/use-alert';
import { getSecurityDeductionByMonthYear } from '@/lib/security-deduction-storage';
import { getAttendanceByStaff } from '@/lib/attendance-storage';
import { getActiveSecurityDeductionPolicy } from '@/lib/policy-storage';
import { apiClient } from '@/lib/api-client';
import type { Teacher, StaffType, User } from '@/types';
import { SessionPayload } from '@/lib/session';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const GENERATE_STAFF_COLUMNS: DataTableColumn[] = [
    { id: 'staff', label: 'Staff' },
    { id: 'monthly', label: 'Monthly Salary' },
    { id: 'deductions', label: 'Deductions Breakdown' },
    { id: 'final', label: 'Final Amount' },
    { id: 'status', label: 'Status' },
];

interface StaffAvatarProps {
    staff: Teacher;
}

const StaffAvatar = ({ staff }: StaffAvatarProps) => {
    const [imageError, setImageError] = useState(false);

    if (staff.photo && !imageError) {
        return (
            <img
                src={staff.photo}
                alt={staff.name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <div className="w-10 h-10 min-w-10 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/20 shrink-0">
            {staff.name?.charAt(0).toUpperCase() || 'S'}
        </div>
    );
};

const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface PageHeaderProps {
    staffCount: number;
}

const PageHeader = ({ staffCount }: PageHeaderProps) => (
    <div className="flex items-start justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Generate Salaries</h1>
            <p className="text-slate-700 mt-1">Create and manage salary records for staff members</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">{staffCount} Staff Members</span>
        </div>
    </div>
);

interface GlobalFiltersProps {
    selectedStaffType: StaffType | '';
    onStaffTypeChange: (value: StaffType | '') => void;
    globalMonth: string;
    onMonthChange: (value: string) => void;
    globalYear: string;
    onYearChange: (value: string) => void;
    globalDueDate: string;
    onDueDateChange: (value: string) => void;
    generating: boolean;
    canGenerate: boolean;
    onGenerateForAll: () => void;
}

const GlobalFilters = ({
    selectedStaffType,
    onStaffTypeChange,
    globalMonth,
    onMonthChange,
    globalYear,
    onYearChange,
    globalDueDate,
    onDueDateChange,
    generating,
    canGenerate,
    onGenerateForAll,
}: GlobalFiltersProps) => (
    <Card>
        <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                        Staff Type
                    </label>
                    <select
                        value={selectedStaffType}
                        onChange={(e) => onStaffTypeChange(e.target.value as StaffType | '')}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                    >
                        <option value="">All Types</option>
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
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                        Month
                    </label>
                    <select
                        value={globalMonth}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                    >
                        <option value="">Select Month</option>
                        {MONTH_NAMES.map((name, index) => (
                            <option key={index + 1} value={index + 1}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                        Year
                    </label>
                    <select
                        value={globalYear}
                        onChange={(e) => onYearChange(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                    >
                        <option value="">Select Year</option>
                        {Array.from({ length: 5 }, (_, i) => {
                            const y = new Date().getFullYear() + i;
                            return (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                        Due Date
                    </label>
                    <input
                        type="date"
                        value={globalDueDate}
                        onChange={(e) => onDueDateChange(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                    />
                </div>

                <div>
                    <Button
                        onClick={onGenerateForAll}
                        disabled={!canGenerate}
                        className="w-full h-[42px]"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Generate All
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
);

type GetStaffPayments = ReturnType<typeof useStaffSalaryPayments>['getStaffPayments'];

interface StaffTableProps {
    staff: Teacher[];
    user: SessionPayload | null | undefined;
    globalMonth: string;
    globalYear: string;
    getStaffPayments: GetStaffPayments;
}

const StaffTable = ({
    staff,
    user,
    globalMonth,
    globalYear,
    getStaffPayments,
}: StaffTableProps) => {
    const getStaffName = (s: Teacher) => s.name || 'Unknown';
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setPage(1);
    }, [staff.length, globalMonth, globalYear]);

    const paginatedStaff = useMemo(() => {
        const start = (page - 1) * pageSize;
        return staff.slice(start, start + pageSize);
    }, [staff, page, pageSize]);

    return (
        <PaginatedDataTable
            title={
                <span className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-slate-800" />
                    Staff Members
                    {globalMonth && globalYear && (
                        <span className="text-sm font-normal text-slate-700">
                            ({MONTH_NAMES[parseInt(globalMonth, 10) - 1]} {globalYear})
                        </span>
                    )}
                </span>
            }
            columns={GENERATE_STAFF_COLUMNS}
            isEmpty={staff.length === 0}
            emptyContent={
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-800" />
                    </div>
                    <p className="text-slate-700 font-medium">No staff members found</p>
                    <p className="text-sm text-slate-800 mt-1">Try adjusting your filters</p>
                </div>
            }
            totalCount={staff.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        >
            {paginatedStaff.map((member) => {
                const staffPayments = getStaffPayments(member.id);
                const monthNum = globalMonth ? parseInt(globalMonth, 10) : null;
                const yearNum = globalYear ? parseInt(globalYear, 10) : null;

                const currentPayment =
                    monthNum && yearNum
                        ? staffPayments.find((p) => p.month === monthNum && p.year === yearNum)
                        : null;

                // Security deduction for the selected month
                const securityDeduction =
                    monthNum && yearNum
                        ? getSecurityDeductionByMonthYear(member.id, monthNum, yearNum)
                        : null;

                const securityAmount = securityDeduction?.amount || 0;
                const totalDeductions = currentPayment?.deductions || 0;
                const leaveAmount = totalDeductions - securityAmount;

                // Remaining months for security deduction
                let remainingMonths = 0;
                if (user?.schoolId && monthNum && yearNum) {
                    const activePolicy = getActiveSecurityDeductionPolicy(user.schoolId);
                    if (activePolicy) {
                        const joinDate = new Date(member.createdAt);
                        const salaryDate = new Date(yearNum, monthNum - 1, 1);
                        const monthsSinceJoin =
                            (salaryDate.getFullYear() - joinDate.getFullYear()) * 12 +
                            (salaryDate.getMonth() - joinDate.getMonth());

                        if (monthsSinceJoin >= 0 && monthsSinceJoin < activePolicy.durationMonths) {
                            remainingMonths = activePolicy.durationMonths - monthsSinceJoin - 1;
                            if (remainingMonths < 0) remainingMonths = 0;
                        }
                    }
                }

                // Leave days count for the month
                let leaveDays = 0;
                if (monthNum && yearNum && currentPayment) {
                    const allAttendances = getAttendanceByStaff(member.id);
                    const monthStart = new Date(yearNum, monthNum - 1, 1);
                    const monthEnd = new Date(yearNum, monthNum, 0);
                    leaveDays = allAttendances.filter((att) => {
                        const attDate = new Date(att.date);
                        return (
                            attDate >= monthStart &&
                            attDate <= monthEnd &&
                            att.status === 'Absent'
                        );
                    }).length;
                }

                return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                                <StaffAvatar staff={member} />
                                <div>
                                    <p className="font-semibold text-slate-900">{getStaffName(member)}</p>
                                    <span className="text-xs text-slate-700">
                                        {member.staffType || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td className="py-3 px-4">
                            {member.monthlySalary ? (
                                <p className="font-semibold text-slate-900">
                                    {formatCurrency(member.monthlySalary)}
                                </p>
                            ) : (
                                <span className="text-xs text-slate-800">Not set</span>
                            )}
                        </td>
                        <td className="py-3 px-4">
                            {currentPayment ? (
                                <div className="space-y-1.5">
                                    {/* Security Deduction */}
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-slate-700">Security:</span>
                                            <span className="font-medium text-orange-600">
                                                {formatCurrency(securityAmount)}
                                            </span>
                                        </div>
                                        {remainingMonths > 0 && (
                                            <div className="flex items-center gap-2 text-xs ml-4">
                                                <span className="text-slate-800 text-[10px]">
                                                    {remainingMonths} month
                                                    {remainingMonths !== 1 ? 's' : ''} remaining
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Leave Deduction */}
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-slate-700">Leave:</span>
                                            <span className="font-medium text-red-600">
                                                {formatCurrency(leaveAmount)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs ml-4">
                                            <span className="text-slate-800 text-[10px]">
                                                {leaveDays} day{leaveDays !== 1 ? 's' : ''} • Total:{' '}
                                                {formatCurrency(leaveAmount)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Total Deductions */}
                                    <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100 mt-1">
                                        <span className="text-slate-800 font-semibold">Total:</span>
                                        <span className="font-bold text-slate-900">
                                            {formatCurrency(totalDeductions)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs text-slate-800">No salary record</span>
                            )}
                        </td>
                        <td className="py-3 px-4">
                            {currentPayment ? (
                                <p className="font-semibold text-slate-900">
                                    {formatCurrency(currentPayment.finalAmount)}
                                </p>
                            ) : (
                                <span className="text-xs text-slate-800">-</span>
                            )}
                        </td>
                        <td className="py-3 px-4">
                            {currentPayment ? (
                                <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${currentPayment.status === 'Paid'
                                        ? 'bg-slate-50 text-slate-700'
                                        : currentPayment.status === 'Partial'
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                >
                                    {currentPayment.status}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-800">-</span>
                            )}
                        </td>
                    </tr>
                );
            })}
        </PaginatedDataTable>
    );
};

interface GenerateSalaryClientProps {
    user: SessionPayload | null;
}

export default function GenerateSalaryClient({ user }: GenerateSalaryClientProps) {
    const { getStaffPayments } = useStaffSalaryPayments();
    const {
        showError,
        showSuccess,
        showWarning,
        showConfirm,
        AlertComponent,
        ConfirmComponent,
    } = useAlert();

    const [selectedStaffType, setSelectedStaffType] = useState<StaffType | ''>('');
    const [generating, setGenerating] = useState(false);

    // Staff loaded from backend
    const [staff, setStaff] = useState<Teacher[]>([]);
    const [staffLoading, setStaffLoading] = useState(false);

    // Global settings (applies to all staff)
    const [globalMonth, setGlobalMonth] = useState('');
    const [globalYear, setGlobalYear] = useState('');
    const [globalDueDate, setGlobalDueDate] = useState('');

    const loadStaff = useCallback(
        async (type: StaffType | '') => {
            try {
                setStaffLoading(true);

                const params = new URLSearchParams();
                // Fetch a large page so we effectively get all relevant staff
                params.append('limit', '1000');
                params.append('isActive', 'true');
                if (type) {
                    params.append('staffType', type);
                }

                const result = await apiClient<{
                    staff: Teacher[];
                    pagination: { page: number; limit: number; total: number; totalPages: number };
                }>(`/staff?${params.toString()}`);

                setStaff(result.staff);
            } catch (error) {
                console.error('Failed to load staff from backend:', error);
                const message =
                    error instanceof Error ? error.message : 'Failed to load staff from server';
                showError(message);
                setStaff([]);
            } finally {
                setStaffLoading(false);
            }
        },
        [showError],
    );

    // Load staff when page mounts and whenever staff type filter changes
    useEffect(() => {
        void loadStaff(selectedStaffType);
    }, [selectedStaffType, loadStaff]);

    // Staff to display in table (already filtered by type on the backend)
    const filteredStaff = useMemo(() => {
        if (!staff) return [];
        return staff;
    }, [staff]);

    const handleGenerateForAll = async () => {
        if (!globalMonth || !globalYear || !globalDueDate) {
            showError('Please set default month, year, and due date first');
            return;
        }

        if (filteredStaff.length === 0) {
            showError('No staff members found to generate salaries for');
            return;
        }

        const monthNum = parseInt(globalMonth, 10);
        const yearNum = parseInt(globalYear, 10);

        const confirmed = await showConfirm(
            `Generate salaries for ${filteredStaff.length} staff member(s) for ${MONTH_NAMES[monthNum - 1]
            } ${yearNum}?`,
            'Generate Salaries',
            'Generate',
            'Cancel',
        );

        if (!confirmed) {
            return;
        }

        setGenerating(true);

        try {
            // Count staff with a valid monthly salary for messaging
            const staffWithSalary = filteredStaff.filter((staff) => staff.monthlySalary && staff.monthlySalary > 0);

            const response = await apiClient<{
                count: number;
                message: string;
            }>('/salaries/generate', {
                method: 'POST',
                body: JSON.stringify({
                    month: monthNum,
                    year: yearNum,
                    dueDate: globalDueDate,
                }),
            });

            const { count, message } = response;
            const successCount = count;
            const skippedCount =
                staffWithSalary.length > 0 ? Math.max(staffWithSalary.length - count, 0) : 0;

            if (successCount === 0) {
                showWarning(message || 'No eligible staff found for salary generation');
            } else {
                showSuccess(
                    message ||
                    `Salaries generated: ${successCount} successful${skippedCount > 0 ? `, ${skippedCount} skipped (already exist or no salary)` : ''
                    }`,
                );
            }
        } catch (error: unknown) {
            console.error('Error generating salaries:', error);
            showError('Failed to generate salaries. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        if (!globalMonth) {
            const today = new Date();
            setGlobalMonth(String(today.getMonth() + 1));
        }
        if (!globalYear) {
            const today = new Date();
            setGlobalYear(String(today.getFullYear()));
        }
        if (!globalDueDate) {
            const today = new Date();
            const eleventhDay = new Date(today.getFullYear(), today.getMonth(), 11);
            setGlobalDueDate(eleventhDay.toISOString().split('T')[0]);
        }
    }, [globalMonth, globalYear, globalDueDate]);

    const canGenerate =
        !generating &&
        !staffLoading &&
        !!globalMonth &&
        !!globalYear &&
        !!globalDueDate &&
        filteredStaff.length > 0;

    return (
        <div className="space-y-6">
            <PageHeader staffCount={filteredStaff.length} />

            <GlobalFilters
                selectedStaffType={selectedStaffType}
                onStaffTypeChange={setSelectedStaffType}
                globalMonth={globalMonth}
                onMonthChange={setGlobalMonth}
                globalYear={globalYear}
                onYearChange={setGlobalYear}
                globalDueDate={globalDueDate}
                onDueDateChange={setGlobalDueDate}
                generating={generating}
                canGenerate={canGenerate}
                onGenerateForAll={handleGenerateForAll}
            />

            <StaffTable
                staff={filteredStaff}
                user={user}
                globalMonth={globalMonth}
                globalYear={globalYear}
                getStaffPayments={getStaffPayments}
            />

            <AlertComponent />
            <ConfirmComponent />
        </div>
    );
}
