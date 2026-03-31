'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Calendar, X, Loader2, Trash2, Save, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudentFeePayments } from '@/hooks/use-student-fee-payments';
import { useAlert } from '@/hooks/use-alert';
import { apiClient } from '@/lib/api-client';
import type { Class, Section, Student, StudentFeePayment, FeeType } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const GENERATE_FEES_STUDENT_COLUMNS: DataTableColumn[] = [
  { id: 'student', label: 'Student Details' },
  { id: 'standard', label: 'Standard Fee', align: 'right' },
  { id: 'discounted', label: 'Discounted Fee', align: 'right' },
  { id: 'addon', label: 'Add-On Fees', align: 'right' },
  { id: 'actions', label: 'Actions', className: 'text-center' },
];

const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface FeeModalData {
    studentId: string;
    studentName: string;
    payment?: StudentFeePayment;
}

interface PendingAddOnFee {
    id: string;
    studentId: string;
    feeType: FeeType;
    amount: number;
    discountAmount: number;
    finalAmount: number;
    dueDate: string;
    month?: number;
    year?: number;
}

interface GenerateFeeClientProps {
    user: any;
}

export default function GenerateFeeClient({ user }: GenerateFeeClientProps) {
    // Backend-loaded core data
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const { createPayment, updatePayment, deletePayment, getStudentPayments, refresh } = useStudentFeePayments();
    const { showError, showWarning, showSuccess, showConfirm, AlertComponent, ConfirmComponent } = useAlert();

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [showFeeModal, setShowFeeModal] = useState<FeeModalData | null>(null);
    const [generating, setGenerating] = useState(false);

    // Global settings (applies to all students)
    const [globalMonth, setGlobalMonth] = useState('');
    const [globalYear, setGlobalYear] = useState('');
    const [globalDueDate, setGlobalDueDate] = useState('');

    // Fee form state
    const [feeType, setFeeType] = useState<FeeType>('MonthlyTuition');
    const [amount, setAmount] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Inline editing state for discounted fee
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingFeeValue, setEditingFeeValue] = useState<string>('');

    // Pending add-on fees (not yet generated as payments)
    const [pendingAddOnFees, setPendingAddOnFees] = useState<PendingAddOnFee[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Load classes on page load (from backend)
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const data = await apiClient<{ classes: Class[] }>('/classes');
                setClasses(data.classes);
            } catch (error: unknown) {
                console.error('Failed to load classes:', error);
                showError('Failed to load classes. Please try again.');
            }
        };

        loadClasses();
    }, [showError]);

    // Load sections when class changes (from backend)
    useEffect(() => {
        if (!selectedClassId) {
            setSections([]);
            setStudents([]);
            return;
        }

        const loadSections = async () => {
            try {
                const data = await apiClient<{ sections: Section[] }>(`/sections?classId=${selectedClassId}`);
                setSections(data.sections);
            } catch (error: unknown) {
                console.error('Failed to load sections:', error);
                showError('Failed to load sections. Please try again.');
            }
        };

        loadSections();
    }, [selectedClassId, showError]);

    // Load students when class or section changes (from backend)
    useEffect(() => {
        const loadStudents = async () => {
            if (!selectedClassId && !selectedSectionId) {
                setStudents([]);
                return;
            }

            try {
                const params = new URLSearchParams();
                if (selectedClassId) params.append('classId', selectedClassId);
                if (selectedSectionId) params.append('sectionId', selectedSectionId);
                params.append('isActive', 'true');
                params.append('limit', '1000');

                const data = await apiClient<{
                    students: Student[];
                    pagination: { page: number; limit: number; total: number; totalPages: number };
                }>(`/students?${params.toString()}`);
                setStudents(data.students);
            } catch (error: unknown) {
                console.error('Failed to load students:', error);
                showError('Failed to load students. Please try again.');
            }
        };

        loadStudents();
    }, [selectedClassId, selectedSectionId, showError]);

    const schoolStudents = useMemo(() => {
        return user?.schoolId
            ? students.filter(s => s.schoolId === user.schoolId && s.isActive)
            : students.filter(s => s.isActive);
    }, [students, user?.schoolId]);

    const schoolClasses = useMemo(() => {
        return user?.schoolId
            ? classes.filter(c => c.schoolId === user.schoolId && c.isActive)
            : classes.filter(c => c.isActive);
    }, [classes, user?.schoolId]);

    const schoolSections = useMemo(() => {
        return user?.schoolId
            ? sections.filter(s => s.schoolId === user.schoolId && s.isActive)
            : sections.filter(s => s.isActive);
    }, [sections, user?.schoolId]);

    const filteredStudents = useMemo(() => {
        let filtered = [...schoolStudents];

        if (selectedClassId) {
            filtered = filtered.filter(s =>
                s.classId === selectedClassId || s.classApplyingFor === selectedClassId
            );
        }

        if (selectedSectionId) {
            filtered = filtered.filter(s => s.sectionId === selectedSectionId);
        }

        return filtered;
    }, [schoolStudents, selectedClassId, selectedSectionId]);

    const totalFilteredStudents = filteredStudents.length;
    const paginatedFilteredStudents = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [selectedClassId, selectedSectionId]);

    const getStudentName = (student: Student) => {
        return student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';
    };

    const getClassName = (classId?: string) => {
        if (!classId) return 'N/A';
        const cls = classes.find(c => c.id === classId);
        return cls ? cls.name : 'N/A';
    };

    const getSectionName = (sectionId?: string) => {
        if (!sectionId) return 'N/A';
        const section = sections.find(s => s.id === sectionId);
        return section ? section.name : 'N/A';
    };

    const getStandardFee = (student: Student) => {
        const classId = student.classId || student.classApplyingFor;
        if (!classId) return 0;
        const cls = classes.find(c => c.id === classId);
        return cls?.standardFee || 0;
    };

    const handleStartEditFee = (student: Student) => {
        setEditingStudentId(student.id);
        setEditingFeeValue(student.discountedFee?.toString() || getStandardFee(student).toString());
    };

    const handleCancelEditFee = () => {
        setEditingStudentId(null);
        setEditingFeeValue('');
    };

    const handleSaveEditFee = async (student: Student) => {
        const feeValue = parseFloat(editingFeeValue);
        if (isNaN(feeValue) || feeValue < 0) {
            showError('Please enter a valid fee amount');
            return;
        }

        const standardFee = getStandardFee(student);
        if (feeValue > standardFee) {
            showError(`Discounted fee cannot be greater than standard fee (PKR ${standardFee.toLocaleString()})`);
            return;
        }

        try {
            const updated = await apiClient<{ student: Student }>(`/students/${student.id}`, {
                method: 'PUT',
                body: JSON.stringify({ discountedFee: feeValue }),
            });

            setStudents(prev =>
                prev.map(s => (s.id === student.id ? updated.student : s))
            );
            setEditingStudentId(null);
            setEditingFeeValue('');
            showSuccess('Fee updated successfully');
        } catch (error: unknown) {
            console.error('Failed to update fee:', error);
            showError('Failed to update fee');
        }
    };

    const openAddFeeModal = (student: Student) => {
        setShowFeeModal({
            studentId: student.id,
            studentName: getStudentName(student),
        });
        setFeeType('Fine'); // Default to add-on fee type
        setAmount('');
        setDiscountAmount('0');
        // Use global settings if available, otherwise defaults
        setDueDate(globalDueDate || '');
        setMonth(globalMonth || '');
        setYear(globalYear || '');
    };

    const openEditFeeModal = (student: Student, payment: StudentFeePayment) => {
        setShowFeeModal({
            studentId: student.id,
            studentName: getStudentName(student),
            payment,
        });
        setFeeType(payment.feeType);
        setAmount(payment.amount.toString());
        setDiscountAmount(payment.discountAmount.toString());
        setDueDate(new Date(payment.dueDate).toISOString().split('T')[0]);
        setMonth(payment.month?.toString() || '');
        setYear(payment.year?.toString() || '');
    };

    const closeModal = () => {
        setShowFeeModal(null);
        setAmount('');
        setDiscountAmount('');
        setDueDate('');
        setMonth('');
        setYear('');
    };

    const handleSaveFee = () => {
        if (!showFeeModal) return;

        const amountNum = parseFloat(amount);
        const discountNum = parseFloat(discountAmount) || 0;

        if (!amountNum || amountNum <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        if (!dueDate) {
            showError('Please select a due date');
            return;
        }

        // Month and year are optional for most fee types, but required for MonthlyTuition
        if (feeType === 'MonthlyTuition' && (!month || !year)) {
            showError('Please select month and year for monthly tuition fee');
            return;
        }

        // Check for existing fee of the same type
        if (!showFeeModal.payment) {
            const existingPayments = getStudentPayments(showFeeModal.studentId);

            if (feeType === 'Admission') {
                const existingAdmission = existingPayments.find(p => p.feeType === 'Admission');
                if (existingAdmission) {
                    showWarning('This student already has an admission fee. Please edit the existing fee instead.');
                    return;
                }
            } else if (feeType === 'MonthlyTuition') {
                const monthNum = parseInt(month);
                const yearNum = parseInt(year);
                const existingMonthly = existingPayments.find(
                    p => p.feeType === 'MonthlyTuition' && p.month === monthNum && p.year === yearNum
                );
                if (existingMonthly) {
                    showWarning(`This student already has a monthly tuition fee for ${MONTH_NAMES[monthNum - 1]} ${yearNum}. Please edit the existing fee instead.`);
                    return;
                }
            }
            // Other fee types (Fine, Transport, Library, Sports, Lab, Other) can be added multiple times per month
        }

        const finalAmount = amountNum - discountNum;
        const dueDateObj = new Date(dueDate);

        if (showFeeModal.payment) {
            // Update existing fee
            updatePayment(showFeeModal.payment.id, {
                feeType,
                amount: amountNum,
                discountAmount: discountNum,
                finalAmount,
                dueDate: dueDateObj,
                month: (feeType === 'MonthlyTuition' || month) ? parseInt(month) : undefined,
                year: (feeType === 'MonthlyTuition' || year) ? parseInt(year) : undefined,
            });
        } else {
            // For add-on fees (not MonthlyTuition or Admission), store as pending
            // MonthlyTuition and Admission are created immediately
            if (feeType !== 'MonthlyTuition' && feeType !== 'Admission') {
                // Store as pending add-on fee
                const pendingFee: PendingAddOnFee = {
                    id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    studentId: showFeeModal.studentId,
                    feeType,
                    amount: amountNum,
                    discountAmount: discountNum,
                    finalAmount,
                    dueDate,
                    month: month ? parseInt(month) : undefined,
                    year: year ? parseInt(year) : undefined,
                };
                setPendingAddOnFees(prev => [...prev, pendingFee]);
            } else {
                // Create MonthlyTuition or Admission immediately
                createPayment({
                    studentId: showFeeModal.studentId,
                    feeType,
                    amount: amountNum,
                    discountAmount: discountNum,
                    finalAmount,
                    dueDate: dueDateObj,
                    status: 'Unpaid',
                    month: (feeType === 'MonthlyTuition' || month) ? parseInt(month) : undefined,
                    year: (feeType === 'MonthlyTuition' || year) ? parseInt(year) : undefined,
                });
                refresh();
            }
        }

        closeModal();
    };

    const handleDeleteFee = async (payment: StudentFeePayment, studentName: string) => {
        if (payment.feeType === 'MonthlyTuition') {
            showWarning('Monthly tuition fees cannot be deleted. Please edit them instead.');
            return;
        }

        const feeTypeName = payment.feeType === 'Admission' ? 'Admission Fee' : payment.feeType;
        const confirmed = await showConfirm(
            `Are you sure you want to delete this ${feeTypeName} for ${studentName}?`,
            'Delete Fee',
            'Delete',
            'Cancel',
            'destructive'
        );

        if (!confirmed) {
            return;
        }

        deletePayment(payment.id);
        refresh();
    };

    const handleDeletePendingFee = (pendingFeeId: string) => {
        setPendingAddOnFees(prev => prev.filter(f => f.id !== pendingFeeId));
    };


    const handleGenerateForAll = async () => {
        if (!globalMonth || !globalYear || !globalDueDate) {
            showError('Please set default month, year, and due date first');
            return;
        }

        if (!selectedClassId) {
            showError('Please select a class to generate fees for');
            return;
        }

        if (filteredStudents.length === 0) {
            showError('No students found to generate fees for');
            return;
        }

        const monthNum = parseInt(globalMonth, 10);
        const yearNum = parseInt(globalYear, 10);

        const selectedClass = classes.find(c => c.id === selectedClassId);
        const baseAmount = selectedClass?.standardFee || 0;

        if (!baseAmount || baseAmount <= 0) {
            showError('Selected class does not have a valid standard fee set');
            return;
        }

        const scopeLabel = selectedSectionId
            ? 'the selected section'
            : 'the selected class';

        const confirmed = await showConfirm(
            `Generate monthly tuition fees for all students in ${scopeLabel} for ${MONTH_NAMES[monthNum - 1]} ${yearNum}?`,
            'Generate Fees',
            'Generate',
            'Cancel'
        );

        if (!confirmed) {
            return;
        }

        setGenerating(true);

        try {
            const result = await apiClient<{ count: number; message: string }>('/fees/generate', {
                method: 'POST',
                body: JSON.stringify({
                    feeType: 'MONTHLY_TUITION',
                    amount: baseAmount,
                    month: monthNum,
                    year: yearNum,
                    dueDate: globalDueDate,
                    classId: selectedClassId,
                    sectionId: selectedSectionId || undefined,
                }),
            });

            if (result.count === 0) {
                showWarning('No active students found for fee generation');
            } else {
                showSuccess(result.message || `${result.count} fee record(s) generated`);
            }
        } catch (error: unknown) {
            console.error('Error generating fees:', error);
            const message = error instanceof Error ? error.message : 'Failed to generate fees. Please try again.';
            showError(message);
        } finally {
            setGenerating(false);
        }
    };

    // Set default global month and year (current month)
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
                <p className="text-gray-600 mt-1">Add and manage fees for students</p>
            </div>

            {/* Filters & Default Settings */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Class</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => {
                                    setSelectedClassId(e.target.value);
                                    setSelectedSectionId('');
                                }}
                                className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">All Classes</option>
                                {schoolClasses.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Section</label>
                            <select
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                disabled={!selectedClassId}
                                className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                            >
                                <option value="">All Sections</option>
                                {schoolSections
                                    .filter(s => !selectedClassId || s.classId === selectedClassId)
                                    .map(section => (
                                        <option key={section.id} value={section.id}>{section.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Month</label>
                            <select
                                value={globalMonth}
                                onChange={(e) => setGlobalMonth(e.target.value)}
                                className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select Month</option>
                                {MONTH_NAMES.map((name, index) => (
                                    <option key={index + 1} value={index + 1}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Year</label>
                            <select
                                value={globalYear}
                                onChange={(e) => setGlobalYear(e.target.value)}
                                className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select Year</option>
                                {Array.from({ length: 5 }, (_, i) => {
                                    const y = new Date().getFullYear() + i;
                                    return (
                                        <option key={y} value={y}>{y}</option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Due Date</label>
                            <input
                                type="date"
                                value={globalDueDate}
                                onChange={(e) => setGlobalDueDate(e.target.value)}
                                className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <Button
                                onClick={handleGenerateForAll}
                                disabled={generating || !globalMonth || !globalYear || !globalDueDate || (filteredStudents.length === 0 && pendingAddOnFees.length === 0)}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Generate Fees
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Fees Banner */}
            {pendingAddOnFees.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 min-w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-orange-900">
                                    {pendingAddOnFees.length} Pending Add-On Fee(s)
                                </p>
                                <p className="text-xs text-orange-700 mt-0.5">
                                    Click &quot;Generate Fees&quot; button above to create challans for these fees along with monthly fees
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <PaginatedDataTable
                title={`Students (${totalFilteredStudents})`}
                columns={GENERATE_FEES_STUDENT_COLUMNS}
                isEmpty={totalFilteredStudents === 0}
                emptyContent={
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <p>No students found</p>
                    </div>
                }
                totalCount={totalFilteredStudents}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            >
                {paginatedFilteredStudents.map((student) => {
                                        const standardFee = getStandardFee(student);
                                        const discountedFee = student.discountedFee || standardFee;
                                        const isEditing = editingStudentId === student.id;

                                        // Get add-on fees (exclude MonthlyTuition and Admission) - only generated ones
                                        const allPayments = getStudentPayments(student.id);
                                        const addOnFees = allPayments.filter((payment) => {
                                            // Filter by month/year if global filters are set
                                            if (globalMonth && globalYear) {
                                                const monthNum = parseInt(globalMonth);
                                                const yearNum = parseInt(globalYear);
                                                if (payment.month && payment.year) {
                                                    return payment.month === monthNum && payment.year === yearNum;
                                                }
                                                // For fees without month/year, show them if no filter is set
                                                return false;
                                            }
                                            return true;
                                        }).filter((payment) =>
                                            payment.feeType !== 'MonthlyTuition' && payment.feeType !== 'Admission'
                                        );

                                        // Get pending add-on fees for this student
                                        const studentPendingFees = pendingAddOnFees.filter(f => f.studentId === student.id);

                                        const addOnFeesTotal = addOnFees.reduce((sum, payment) => sum + payment.finalAmount, 0);
                                        const pendingFeesTotal = studentPendingFees.reduce((sum, fee) => sum + fee.finalAmount, 0);

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-900">{getStudentName(student)}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {getClassName(student.classId || student.classApplyingFor)} • {getSectionName(student.sectionId)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(standardFee)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="number"
                                                                value={editingFeeValue}
                                                                onChange={(e) => setEditingFeeValue(e.target.value)}
                                                                min="0"
                                                                max={standardFee}
                                                                step="0.01"
                                                                className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleSaveEditFee(student);
                                                                    } else if (e.key === 'Escape') {
                                                                        handleCancelEditFee();
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => handleSaveEditFee(student)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                title="Save"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEditFee}
                                                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {formatCurrency(discountedFee)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleStartEditFee(student)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                                                title="Edit fee"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {(addOnFees.length > 0 || studentPendingFees.length > 0) ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            {(addOnFeesTotal > 0 || pendingFeesTotal > 0) && (
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {formatCurrency(addOnFeesTotal + pendingFeesTotal)}
                                                                    {pendingFeesTotal > 0 && (
                                                                        <span className="text-xs text-orange-600 ml-1">(Pending: {formatCurrency(pendingFeesTotal)})</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                                                                {/* Generated fees */}
                                                                {addOnFees.map((payment) => (
                                                                    <div
                                                                        key={payment.id}
                                                                        className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded"
                                                                        title={`${payment.feeType}: ${formatCurrency(payment.finalAmount)} - ${payment.status}`}
                                                                    >
                                                                        <span className="text-gray-600">{payment.feeType}</span>
                                                                        <span className="text-gray-500">•</span>
                                                                        <span className="text-gray-700 font-medium">{formatCurrency(payment.finalAmount)}</span>
                                                                        <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${payment.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                                                payment.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                                                    'bg-red-100 text-red-700'
                                                                            }`}>
                                                                            {payment.status}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => openEditFeeModal(student, payment)}
                                                                            className="ml-1 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                                                                            title="Edit fee"
                                                                        >
                                                                            <Edit className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteFee(payment, getStudentName(student))}
                                                                            className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer"
                                                                            title="Delete fee"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {/* Pending fees */}
                                                                {studentPendingFees.map((pendingFee) => (
                                                                    <div
                                                                        key={pendingFee.id}
                                                                        className="flex items-center gap-1 text-xs bg-orange-100 border border-orange-200 px-2 py-0.5 rounded"
                                                                        title={`${pendingFee.feeType}: ${formatCurrency(pendingFee.finalAmount)} - Pending`}
                                                                    >
                                                                        <span className="text-orange-700 font-medium">{pendingFee.feeType}</span>
                                                                        <span className="text-orange-500">•</span>
                                                                        <span className="text-orange-800 font-medium">{formatCurrency(pendingFee.finalAmount)}</span>
                                                                        <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-orange-200 text-orange-800">
                                                                            Pending
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleDeletePendingFee(pendingFee.id)}
                                                                            className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer"
                                                                            title="Remove pending fee"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">No add-ons</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openAddFeeModal(student)}
                                                        className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1.5 h-auto"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add Fee
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
            </PaginatedDataTable>

            {/* Add/Edit Fee Modal */}
            {showFeeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>
                                {showFeeModal.payment ? 'Edit Fee' : 'Add Fee'} - {showFeeModal.studentName}
                            </CardTitle>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type</label>
                                <select
                                    value={feeType}
                                    onChange={(e) => {
                                        setFeeType(e.target.value as FeeType);
                                        if (e.target.value === 'Admission') {
                                            setMonth('');
                                            setYear('');
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="Admission">Admission Fee</option>
                                    <option value="MonthlyTuition">Monthly Tuition</option>
                                    <option value="Fine">Fine</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Library">Library</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Lab">Lab</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount</label>
                                <input
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            {(feeType === 'MonthlyTuition' || feeType === 'Fine' || feeType === 'Transport' || feeType === 'Library' || feeType === 'Sports' || feeType === 'Lab' || feeType === 'Other') && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Month {feeType === 'MonthlyTuition' && <span className="text-red-500">*</span>}
                                            </label>
                                            <select
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="">Select Month (Optional)</option>
                                                {MONTH_NAMES.map((name, index) => (
                                                    <option key={index + 1} value={index + 1}>{name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Year {feeType === 'MonthlyTuition' && <span className="text-red-500">*</span>}
                                            </label>
                                            <select
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="">Select Year (Optional)</option>
                                                {Array.from({ length: 5 }, (_, i) => {
                                                    const y = new Date().getFullYear() + i;
                                                    return (
                                                        <option key={y} value={y}>{y}</option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleSaveFee}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {showFeeModal.payment ? 'Update Fee' : 'Add Fee'}
                                </Button>
                                <Button
                                    onClick={closeModal}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <AlertComponent />
            <ConfirmComponent />
        </div>
    );
}
