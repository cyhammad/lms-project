'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, Save, CheckCircle, XCircle, Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { bulkMarkStudentAttendance } from '@/actions/attendance';
import type { Class, Section, Student, Attendance, AttendanceStatus } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const ATTENDANCE_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'student', label: 'Student' },
  { id: 'status', label: 'Status', className: 'text-center' },
  { id: 'remarks', label: 'Remarks' },
];

interface AttendanceClientProps {
  initialClasses: Class[];
  initialSections: Section[];
  students: Student[];
  initialAttendance: Attendance[];
  selectedDate: string;
  selectedSectionId: string;
}

type StudentAttendanceState = {
  status: AttendanceStatus;
  remarks: string;
};

export default function AttendanceClient({
  initialClasses,
  initialSections,
  students,
  initialAttendance,
  selectedDate,
  selectedSectionId,
}: AttendanceClientProps) {
  const router = useRouter();
  const { showError, showSuccess, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [classId, setClassId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>(selectedSectionId);
  const [date, setDate] = useState<string>(selectedDate);

  const [attendanceState, setAttendanceState] = useState<Record<string, StudentAttendanceState>>({});
  const [filterName, setFilterName] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Update filtered sections when class changes
  const availableSections = useMemo(() => {
    if (!classId) return [];
    return initialSections.filter(s => s.classId === classId);
  }, [classId, initialSections]);

  // Set initial class based on selected section
  useEffect(() => {
    if (selectedSectionId) {
      const section = initialSections.find(s => s.id === selectedSectionId);
      if (section) {
        setClassId(section.classId);
        setSectionId(selectedSectionId);
      }
    }
  }, [selectedSectionId, initialSections]);

  // Initialize attendance state when data changes
  useEffect(() => {
    const newState: Record<string, StudentAttendanceState> = {};

    // Default to 'Present' for all students if no record exists
    students.forEach(student => {
      const existingRecord = initialAttendance.find(a => a.studentId === student.id);
      if (existingRecord) {
        newState[student.id] = {
          status: existingRecord.status,
          remarks: existingRecord.remarks || '',
        };
      } else {
        newState[student.id] = {
          status: 'Present',
          remarks: '',
        };
      }
    });

    setAttendanceState(newState);
  }, [students, initialAttendance]);

  const handleFetch = () => {
    if (!sectionId || !date) {
      showError('Please select a section and date');
      return;
    }
    setLoading(true);
    router.push(`/admin/attendance?sectionId=${sectionId}&date=${date}`);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendanceState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(studentId => {
        newState[studentId].status = status;
      });
      return newState;
    });
  };

  const handleSave = async () => {
    if (!sectionId || !date) return;

    setSaving(true);

    // Prepare data
    const records = Object.entries(attendanceState).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks || undefined,
    }));

    const result = await bulkMarkStudentAttendance({
      date,
      sectionId,
      students: records,
    });

    setSaving(false);

    if (result.success) {
      showSuccess('Attendance saved successfully');
      router.refresh();
    } else {
      showError(result.error as string);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!filterName) return students;
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(filterName.toLowerCase()) ||
      student.id.toLowerCase().includes(filterName.toLowerCase())
    );
  }, [students, filterName]);

  const totalFiltered = filteredStudents.length;
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filterName]);

  const stats = useMemo(() => {
    const total = students.length;
    let present = 0, absent = 0, late = 0;

    Object.values(attendanceState).forEach(s => {
      if (s.status === 'Present') present++;
      if (s.status === 'Absent') absent++;
      if (s.status === 'Late') late++;
    });

    return { total, present, absent, late };
  }, [students.length, attendanceState]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Student Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage daily attendance for classes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Summary Stats */}
          {students.length > 0 && (
            <div className="flex gap-3 text-sm font-medium mr-4">
              <span className="text-slate-800">Present: {stats.present}</span>
              <span className="text-red-600">Absent: {stats.absent}</span>
              <span className="text-amber-600">Late: {stats.late}</span>
              <span className="text-gray-600">Total: {stats.total}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Class</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId('');
              }}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select Class</option>
              {initialClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={!classId}
            >
              <option value="">Select Section</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Date</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <Button
            onClick={handleFetch}
            disabled={!sectionId || !date || loading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Fetch Data
          </Button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => markAll('Present')} className="text-slate-800 border-slate-200 hover:bg-slate-50">
                All Present
              </Button>
              <Button size="sm" variant="outline" onClick={() => markAll('Absent')} className="text-red-600 border-red-200 hover:bg-red-50">
                All Absent
              </Button>
            </div>
          </div>

          <PaginatedDataTable
            className="border-0 shadow-none rounded-none"
            columns={ATTENDANCE_TABLE_COLUMNS}
            loading={false}
            isEmpty={totalFiltered === 0}
            emptyContent={
              <div className="py-12 text-center text-gray-500">No students match your search.</div>
            }
            totalCount={totalFiltered}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
          >
            {paginatedStudents.map((student) => {
              const state = attendanceState[student.id] || { status: 'Present', remarks: '' };
              return (
                <tr key={student.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium mr-3">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-gray-500">ID: {student.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex justify-center gap-1 bg-gray-100/50 p-1 rounded-lg w-fit mx-auto">
                      {['Present', 'Absent', 'Late'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(student.id, status as AttendanceStatus)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${state.status === status
                            ? status === 'Present'
                              ? 'bg-slate-100 text-slate-700 shadow-sm'
                              : status === 'Absent'
                                ? 'bg-red-100 text-red-700 shadow-sm'
                                : 'bg-amber-100 text-amber-700 shadow-sm'
                            : 'text-gray-500 hover:bg-white/50'
                            }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={state.remarks}
                      onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                      placeholder="Add remark..."
                      className="w-full text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                </tr>
              );
            })}
          </PaginatedDataTable>

          <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!loading && sectionId && students.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No students found for this section.</p>
        </div>
      )}

      <AlertComponent />
    </div>
  );
}
