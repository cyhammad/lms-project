'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Calendar, CheckCircle2, XCircle, Clock, TrendingUp, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTeacherById } from '@/lib/teacher-storage';
import { useAttendance } from '@/hooks/use-attendance';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import type { Teacher, AttendanceStatus } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const STAFF_HISTORY_COLUMNS: DataTableColumn[] = [
  { id: 'date', label: 'Date' },
  { id: 'day', label: 'Day' },
  { id: 'status', label: 'Status' },
  { id: 'remarks', label: 'Remarks' },
  { id: 'actions', label: 'Actions' },
];

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function StaffAttendanceHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params?.id as string;
  const { getPersonAttendance, getPersonAttendanceStats, updateAttendance } = useAttendance();
  const { showSuccess, showError, AlertComponent } = useAlert();

  const [staff, setStaff] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const staffAttendances = useMemo(() => {
    if (!staffId) return [];
    return getPersonAttendance(staffId, 'staff');
  }, [staffId, getPersonAttendance]);

  const stats = useMemo(() => {
    if (!staffId) {
      return { total: 0, present: 0, absent: 0, late: 0, presentPercentage: 0 };
    }
    return getPersonAttendanceStats(staffId, 'staff');
  }, [staffId, staffAttendances]);

  // Filter attendances by selected month/year
  const filteredAttendances = useMemo(() => {
    return staffAttendances.filter(attendance => {
      const date = new Date(attendance.date);
      return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [staffAttendances, selectedMonth, selectedYear]);

  const paginatedAttendances = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAttendances.slice(start, start + pageSize);
  }, [filteredAttendances, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (staffId) {
      const staffData = getTeacherById(staffId);
      if (staffData) {
        setStaff(staffData);
      } else {
        router.push(ROUTES.ADMIN.ATTENDANCE.STAFF);
      }
      setLoading(false);
    }
  }, [staffId, router]);

  const handleStatusChange = (attendanceId: string, newStatus: AttendanceStatus) => {
    try {
      updateAttendance(attendanceId, { status: newStatus });
      showSuccess('Attendance updated successfully');
    } catch (error) {
      console.error('Error updating attendance:', error);
      showError('Failed to update attendance. Please try again.');
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-slate-700">Loading attendance history...</div>
      </div>
    );
  }

  if (!staff) {
    return null;
  }

  // Generate month and year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={ROUTES.ADMIN.ATTENDANCE.STAFF}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Attendance
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance History</h1>
            <p className="text-slate-800 mt-1">{staff.name}</p>
          </div>
        </div>
      </div>

      {/* Staff Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            {staff.photo ? (
              <img
                src={staff.photo}
                alt={staff.name}
                className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                {staff.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{staff.name}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{staff.email}</span>
                </div>
                {staff.staffType && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{staff.staffType}</span>
                  </div>
                )}
                {staff.phone && (
                  <div className="flex items-center gap-2">
                    <span>{staff.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Total Days</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm text-slate-700">Attendance %</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.presentPercentage}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Filter by:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setSelectedMonth(today.getMonth() + 1);
                setSelectedYear(today.getFullYear());
              }}
            >
              Current Month
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={`Attendance History — ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`}
        headerActions={
          <span className="text-sm font-normal text-slate-700">
            {filteredAttendances.length} record(s)
          </span>
        }
        columns={STAFF_HISTORY_COLUMNS}
        isEmpty={filteredAttendances.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">No attendance records found</p>
            <p className="text-sm text-slate-700 mt-1">
              No attendance has been marked for {months.find((m) => m.value === selectedMonth)?.label}{' '}
              {selectedYear}
            </p>
          </div>
        }
        totalCount={filteredAttendances.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedAttendances.map((attendance) => {
          const date = new Date(attendance.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const isPastDate = date < new Date();
          const isToday = date.toDateString() === new Date().toDateString();
          const canEdit = isPastDate || isToday;

          return (
            <tr key={attendance.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4">
                <p className="text-sm font-medium text-slate-900">{formatDate(attendance.date)}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-slate-800">{dayName}</p>
              </td>
              <td className="py-3 px-4">
                {editingId === attendance.id ? (
                  <select
                    value={attendance.status}
                    onChange={(e) => {
                      handleStatusChange(attendance.id, e.target.value as AttendanceStatus);
                      setEditingId(null);
                    }}
                    onBlur={() => setEditingId(null)}
                    autoFocus
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                ) : (
                  getStatusBadge(attendance.status)
                )}
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-slate-800">{attendance.remarks || '-'}</p>
              </td>
              <td className="py-3 px-4">
                {canEdit && editingId !== attendance.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(attendance.id)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </PaginatedDataTable>

      <AlertComponent />
    </div>
  );
}
