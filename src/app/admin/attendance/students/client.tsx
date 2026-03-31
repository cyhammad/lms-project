'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, Search, X, Eye, Calendar, CheckCircle2, XCircle, Clock, Users, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAttendance } from '@/hooks/use-attendance';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { apiClient } from '@/lib/api-client';
import type { Student, AttendanceStatus, AcademicSession, Class, Section } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const STUDENT_ATTENDANCE_COLUMNS: DataTableColumn[] = [
    { id: 'student', label: 'Student' },
    { id: 'class', label: 'Class' },
    { id: 'section', label: 'Section' },
    { id: 'status', label: 'Status' },
    { id: 'actions', label: 'Actions', align: 'right' },
];
import { useAdminSession } from '@/contexts/AdminSessionContext';
import { getStorageUrl } from '@/lib/storage-url';

interface StudentAttendanceRowProps {
    student: Student;
    displayName: string;
    displayStudentId: string;
    displayClass: string;
    displaySection: string;
    attendanceStatus?: AttendanceStatus;
    onStatusChange: (studentId: string, status: AttendanceStatus) => void;
    selectedDate: Date;
}

const StudentAttendanceRow = ({
    student,
    displayName,
    displayStudentId,
    displayClass,
    displaySection,
    attendanceStatus,
    onStatusChange,
    selectedDate,
}: StudentAttendanceRowProps) => {
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
                    {student.studentPhoto && !imageError ? (
                        <img
                            src={getStorageUrl(student.studentPhoto) || undefined}
                            alt={displayName}
                            className="w-9 h-9 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-slate-700/20">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-slate-900">{displayName}</p>
                        <p className="text-xs text-slate-700">{displayStudentId}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-slate-700">{displayClass}</td>
            <td className="py-3 px-4 text-sm text-slate-700">{displaySection}</td>
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
                                            onStatusChange(student.id, value);
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
                    <Link href={ROUTES.ADMIN.ATTENDANCE.STUDENT_HISTORY(student.id)}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View History">
                            <Eye className="w-4 h-4 text-slate-700" />
                        </Button>
                    </Link>
                </div>
            </td>
        </tr>
    );
};

interface StudentsAttendanceClientProps {
    user: any;
}

export default function StudentsAttendanceClient({ user }: StudentsAttendanceClientProps) {
    const { attendances, loading: attendanceLoading, markAttendance, getAttendanceForDate, getPersonAttendanceForDate, refresh } = useAttendance();
    const { showSuccess, showError, AlertComponent } = useAlert();

    // Global session from header; API-driven classes → sections → students
    const { sessionId: globalSessionId, sessions } = useAdminSession();
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const loading = attendanceLoading;

    // Load classes when global session is set
    useEffect(() => {
        const loadClasses = async () => {
            if (!globalSessionId) {
                setClasses([]);
                setSections([]);
                setStudents([]);
                setSelectedClass('');
                setSelectedSection('');
                return;
            }
            try {
                setLoadingClasses(true);
                const response = await apiClient<{ classes: Class[] }>(`/classes?sessionId=${globalSessionId}`);
                setClasses(response.classes || []);
                setSections([]);
                setStudents([]);
                setSelectedClass('');
                setSelectedSection('');
            } catch (error) {
                console.error('Error loading classes:', error);
                setClasses([]);
            } finally {
                setLoadingClasses(false);
            }
        };
        loadClasses();
    }, [globalSessionId]);

    // Load sections when class is selected
    useEffect(() => {
        const loadSections = async () => {
            if (!selectedClass) {
                setSections([]);
                setStudents([]);
                setSelectedSection('');
                return;
            }
            try {
                setLoadingSections(true);
                const response = await apiClient<{ sections: Section[] }>(`/sections?classId=${selectedClass}`);
                setSections(response.sections || []);
                setStudents([]);
                setSelectedSection('');
            } catch (error) {
                console.error('Error loading sections:', error);
                setSections([]);
            } finally {
                setLoadingSections(false);
            }
        };
        loadSections();
    }, [selectedClass]);

    // Load students when class is selected (all sections); section filter applied client-side
    useEffect(() => {
        const loadStudents = async () => {
            if (!selectedClass || !globalSessionId) {
                setStudents([]);
                return;
            }
            try {
                setLoadingStudents(true);
                const params = new URLSearchParams();
                params.append('classId', selectedClass);
                params.append('isActive', 'true');
                params.append('limit', '1000');
                params.append('sessionId', globalSessionId);
                if (selectedSection) {
                    params.append('sectionId', selectedSection);
                }
                const response = await apiClient<{ students: Student[]; pagination?: unknown }>(`/students?${params.toString()}`);
                setStudents(response.students || []);
            } catch (error) {
                console.error('Error loading students:', error);
                setStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };
        loadStudents();
    }, [selectedClass, selectedSection, globalSessionId]);

    // Filter by school when user has schoolId
    const schoolSessions = useMemo(() => {
        return user?.schoolId
            ? sessions.filter(s => s.schoolId === user.schoolId)
            : sessions;
    }, [sessions, user?.schoolId]);

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

    const schoolStudents = useMemo(() => {
        return user?.schoolId
            ? students.filter(s => s.schoolId === user.schoolId && s.isActive)
            : students.filter(s => s.isActive);
    }, [students, user?.schoolId]);

    // Get attendance for selected date
    const dateAttendances = useMemo(() => {
        return getAttendanceForDate(selectedDate, user?.schoolId);
    }, [selectedDate, attendances, user?.schoolId]);

    // Calculate stats for selected date
    const stats = useMemo(() => {
        const studentIds = schoolStudents.map(s => s.id);
        const dateAttendancesForStats = dateAttendances.filter(a =>
            a.studentId && studentIds.includes(a.studentId)
        );

        const present = dateAttendancesForStats.filter(a => a.status === 'Present').length;
        const absent = dateAttendancesForStats.filter(a => a.status === 'Absent').length;
        const late = dateAttendancesForStats.filter(a => a.status === 'Late').length;
        const total = dateAttendancesForStats.length;

        return {
            total: schoolStudents.length,
            present,
            absent,
            late,
            notMarked: schoolStudents.length - total,
        };
    }, [schoolStudents, dateAttendances, selectedDate]);

    // Filtered students (search + status only; class/section already applied by API)
    const filteredStudents = useMemo(() => {
        let filtered = [...schoolStudents];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => {
                const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
                const studentId = s.studentId || s.bFormCrc || '';
                const className = getClassName(s);
                const sectionName = getSectionName(s);
                return (
                    name.toLowerCase().includes(query) ||
                    studentId.toLowerCase().includes(query) ||
                    className.toLowerCase().includes(query) ||
                    sectionName.toLowerCase().includes(query)
                );
            });
        }

        return filtered;
    }, [schoolStudents, searchQuery]);

    const totalFiltered = filteredStudents.length;
    const paginatedStudents = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedClass, selectedSection, selectedDate]);

    const getClassName = (student: Student): string => {
        const classId = student.classId || student.classApplyingFor;
        if (!classId) return 'N/A';
        const cls = classes.find(c => c.id === classId);
        return cls ? cls.name : 'Unknown';
    };

    const getSectionName = (student: Student): string => {
        if (!student.sectionId) return 'N/A';
        const section = sections.find(s => s.id === student.sectionId);
        return section ? section.name : 'Unknown';
    };

    const displayName = (student: Student): string => {
        return student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';
    };

    const displayStudentId = (student: Student): string => {
        return student.studentId || student.bFormCrc || 'N/A';
    };


    const hasActiveFilters = selectedClass || selectedSection || searchQuery;

    const clearFilters = () => {
        setSelectedClass('');
        setSelectedSection('');
        setSearchQuery('');
    };

    const handleDownloadCSV = () => {
        const csvData = filteredStudents.map((student) => {
            const attendance = getPersonAttendanceForDate(selectedDate, student.id);
            return {
                Student: displayName(student),
                'Student ID': displayStudentId(student),
                Class: getClassName(student),
                Section: getSectionName(student),
                Date: selectedDate.toLocaleDateString(),
                Status: attendance?.status || 'Not Marked',
            };
        });

        downloadCSV(csvData, `student-attendance-${selectedDate.toISOString().split('T')[0]}`);
    };

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        if (!user?.schoolId || !user?.userId) {
            showError('Unable to mark attendance. Please refresh the page.');
            return;
        }

        try {
            const dateToUse = new Date(selectedDate);
            dateToUse.setHours(0, 0, 0, 0);

            markAttendance({
                studentId,
                date: dateToUse,
                status,
                markedBy: user.userId,
                schoolId: user.schoolId,
            });

            refresh();
            showSuccess(`Attendance marked as ${status} for ${displayName(schoolStudents.find(s => s.id === studentId) || {} as Student)}`);
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

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Student Attendance</h1>
                        <p className="text-slate-700 mt-1">Manage student attendance</p>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <GraduationCap className="w-8 h-8 text-slate-800" />
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
                    <h1 className="text-2xl font-bold text-slate-900">Student Attendance</h1>
                    <p className="text-slate-700 mt-1">Manage and track student attendance</p>
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
                                <p className="text-sm text-slate-700">Total Students</p>
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
                                    placeholder="Search by name, ID, class, or section..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Filter dropdowns (session is set globally in header) */}
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                disabled={!globalSessionId || loadingClasses}
                                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Class</option>
                                {loadingClasses ? (
                                    <option value="" disabled>Loading...</option>
                                ) : (
                                    schoolClasses.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))
                                )}
                            </select>

                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass || loadingSections}
                                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">All Sections</option>
                                {loadingSections ? (
                                    <option value="" disabled>Loading...</option>
                                ) : (
                                    schoolSections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.name}
                                        </option>
                                    ))
                                )}
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

            {loadingStudents ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <GraduationCap className="w-8 h-8 text-slate-800" />
                        </div>
                        <p className="text-slate-900 font-medium">Loading students...</p>
                    </CardContent>
                </Card>
            ) : !globalSessionId ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-slate-800" />
                        </div>
                        <p className="text-slate-900 font-medium">Select a session in the header</p>
                        <p className="text-sm text-slate-700 mt-1">
                            Use the session dropdown in the top bar to choose an academic session
                        </p>
                    </CardContent>
                </Card>
            ) : !selectedClass ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-slate-800" />
                        </div>
                        <p className="text-slate-900 font-medium">Select class to view students</p>
                        <p className="text-sm text-slate-700 mt-1">
                            Use the filter above to choose a class (and optionally a section)
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <PaginatedDataTable
                    title={
                        hasActiveFilters
                            ? `Showing ${totalFiltered} of ${schoolStudents.length} students`
                            : `All Students (${schoolStudents.length})`
                    }
                    headerActions={
                        totalFiltered > 0 ? (
                            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                                <Download className="w-4 h-4 mr-2" />
                                Download CSV
                            </Button>
                        ) : null
                    }
                    columns={STUDENT_ATTENDANCE_COLUMNS}
                    isEmpty={totalFiltered === 0}
                    emptyContent={
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <GraduationCap className="w-8 h-8 text-slate-800" />
                            </div>
                            <p className="text-slate-900 font-medium">
                                {hasActiveFilters ? 'No students match your filters' : 'No students found'}
                            </p>
                            <p className="text-sm text-slate-700 mt-1">
                                {hasActiveFilters
                                    ? 'Try adjusting your search or filters'
                                    : 'No active students in the system'}
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
                    {paginatedStudents.map((student) => {
                        const attendance = getPersonAttendanceForDate(selectedDate, student.id);
                        return (
                            <StudentAttendanceRow
                                key={student.id}
                                student={student}
                                displayName={displayName(student)}
                                displayStudentId={displayStudentId(student)}
                                displayClass={getClassName(student)}
                                displaySection={getSectionName(student)}
                                attendanceStatus={attendance?.status}
                                onStatusChange={handleStatusChange}
                                selectedDate={selectedDate}
                            />
                        );
                    })}
                </PaginatedDataTable>
            )}

            <AlertComponent />
        </div>
    );
}
