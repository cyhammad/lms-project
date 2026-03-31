'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Calendar,
  Search,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  Loader2,
  Save,
  UserX,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { apiClient } from '@/lib/api-client';
import {
  getTeacherAttendanceSettings,
  updateTeacherAttendanceSettings,
  overrideTeacherAttendance,
} from '@/actions/attendance';
import type {
  TeacherAttendanceRecord,
  TeacherAttendanceSettings,
  TeacherAttendanceStatus,
  Teacher,
} from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TeachersAttendanceClient() {
  const { showSuccess, showError, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [attendance, setAttendance] = useState<TeacherAttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [settings, setSettings] = useState<TeacherAttendanceSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    attendanceStartTime: '09:00',
    graceMinutes: 15,
    absentCutoffTime: '11:00',
    allowManualOverride: true,
    geoFencingEnabled: false,
    schoolLatitude: null as number | null,
    schoolLongitude: null as number | null,
    allowedRadiusMeters: null as number | null,
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [attendanceRes, teachersRes] = await Promise.all([
        apiClient<{ attendance: TeacherAttendanceRecord[] }>(
          `/attendance/teachers?date=${selectedDate}`
        ),
        apiClient<{ staff: Teacher[] }>('/staff?limit=1000'),
      ]);
      setAttendance(attendanceRes?.attendance ?? []);
      const staff = teachersRes?.staff ?? [];
      setTeachers(staff.filter((s) => s.staffType === 'TEACHER' && s.isActive));
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to load attendance');
      setAttendance([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await getTeacherAttendanceSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        setSettingsForm({
          attendanceStartTime: res.data.attendanceStartTime,
          graceMinutes: res.data.graceMinutes,
          absentCutoffTime: res.data.absentCutoffTime,
          allowManualOverride: res.data.allowManualOverride,
          geoFencingEnabled: res.data.geoFencingEnabled ?? false,
          schoolLatitude: res.data.schoolLatitude ?? null,
          schoolLongitude: res.data.schoolLongitude ?? null,
          allowedRadiusMeters: res.data.allowedRadiusMeters ?? null,
        });
      }
    } catch {
      // ignore
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    const res = await updateTeacherAttendanceSettings(settingsForm);
    setSettingsLoading(false);
    if (res.success && res.data) {
      setSettings(res.data);
      setShowSettings(false);
      showSuccess('Settings saved');
    } else {
      showError((res as { error?: string }).error || 'Failed to save settings');
    }
  };

  const handleOverride = async (
    id: string,
    status: TeacherAttendanceStatus,
    remarks?: string
  ) => {
    setOverrideLoading(id);
    const res = await overrideTeacherAttendance(id, { status, remarks });
    setOverrideLoading(null);
    if (res.success && res.data) {
      setAttendance((prev) => prev.map((a) => (a.id === id ? res.data! : a)));
      showSuccess('Attendance updated');
    } else {
      showError((res as { error?: string }).error || 'Failed to update');
    }
  };

  const attendanceByTeacherId = useMemo(() => {
    const map = new Map<string, TeacherAttendanceRecord>();
    attendance.forEach((a) => map.set(a.teacherId, a));
    return map;
  }, [attendance]);

  /** All teachers for the day: each has teacher + attendance record or null (not checked in) */
  const rows = useMemo(() => {
    return teachers.map((teacher) => ({
      teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
      record: attendanceByTeacherId.get(teacher.id) ?? null,
    }));
  }, [teachers, attendanceByTeacherId]);

  const filteredAttendance = useMemo(() => {
    let list = rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.teacher.name?.toLowerCase().includes(q) ||
          r.teacher.email?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (b.record ? 1 : 0) - (a.record ? 1 : 0));
  }, [rows, searchQuery]);

  const tableColumns = useMemo((): DataTableColumn[] => {
    const cols: DataTableColumn[] = [
      { id: 'teacher', label: 'Teacher' },
      { id: 'checkin', label: 'Check-in' },
      { id: 'status', label: 'Status' },
      { id: 'method', label: 'Method' },
      { id: 'remarks', label: 'Remarks' },
    ];
    if (settings?.allowManualOverride) {
      cols.push({ id: 'override', label: 'Override', align: 'right' });
    }
    return cols;
  }, [settings?.allowManualOverride]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAttendance.slice(start, start + pageSize);
  }, [filteredAttendance, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedDate]);

  const stats = useMemo(() => {
    const present = attendance.filter((a) => a.status === 'PRESENT').length;
    const late = attendance.filter((a) => a.status === 'LATE').length;
    const absent = attendance.filter((a) => a.status === 'ABSENT').length;
    const leave = attendance.filter((a) => a.status === 'LEAVE').length;
    const notCheckedIn = Math.max(0, teachers.length - attendance.length);
    return {
      present,
      late,
      absent,
      leave,
      notCheckedIn,
      total: teachers.length,
    };
  }, [attendance, teachers.length]);

  const statusConfig: Record<
    TeacherAttendanceStatus,
    { bg: string; text: string; label: string; icon: typeof CheckCircle2 }
  > = {
    PRESENT: { bg: 'bg-slate-50', text: 'text-slate-700', label: 'Present', icon: CheckCircle2 },
    LATE: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Late', icon: Clock },
    ABSENT: { bg: 'bg-red-50', text: 'text-red-700', label: 'Absent', icon: XCircle },
    LEAVE: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Leave', icon: CalendarOff },
  };

  const notCheckedInConfig = {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    label: 'Not checked in',
    icon: UserX,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Attendance</h1>
          <p className="text-slate-700 mt-1">Daily check-ins and manual override</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 bg-white"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">Attendance rules</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Start time (e.g. 09:00)
                </label>
                <input
                  type="text"
                  value={settingsForm.attendanceStartTime}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, attendanceStartTime: e.target.value }))
                  }
                  placeholder="09:00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Grace minutes
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={settingsForm.graceMinutes}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, graceMinutes: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Absent cutoff (e.g. 11:00)
                </label>
                <input
                  type="text"
                  value={settingsForm.absentCutoffTime}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, absentCutoffTime: e.target.value }))
                  }
                  placeholder="11:00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.allowManualOverride}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, allowManualOverride: e.target.checked }))
                    }
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Allow manual override</span>
                </label>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Geo-fencing (optional)</h4>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={settingsForm.geoFencingEnabled}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, geoFencingEnabled: e.target.checked }))
                  }
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Enforce location-based check-in</span>
              </label>
              {settingsForm.geoFencingEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-800 mb-1">
                      School latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={settingsForm.schoolLatitude ?? ''}
                      onChange={(e) =>
                        setSettingsForm((s) => ({
                          ...s,
                          schoolLatitude: e.target.value === '' ? null : Number(e.target.value),
                        }))
                      }
                      placeholder="e.g. 31.5204"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-800 mb-1">
                      School longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={settingsForm.schoolLongitude ?? ''}
                      onChange={(e) =>
                        setSettingsForm((s) => ({
                          ...s,
                          schoolLongitude: e.target.value === '' ? null : Number(e.target.value),
                        }))
                      }
                      placeholder="e.g. 74.3587"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-800 mb-1">
                      Allowed radius (meters)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={settingsForm.allowedRadiusMeters ?? ''}
                      onChange={(e) =>
                        setSettingsForm((s) => ({
                          ...s,
                          allowedRadiusMeters:
                            e.target.value === '' ? null : Number(e.target.value),
                        }))
                      }
                      placeholder="e.g. 200"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="bg-slate-800 hover:bg-slate-700"
              >
                {settingsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Present</p>
                <p className="text-2xl font-bold text-slate-800">{stats.present}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-slate-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Late</p>
                <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Leave</p>
                <p className="text-2xl font-bold text-slate-800">{stats.leave}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <CalendarOff className="w-5 h-5 text-slate-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Not checked in</p>
                <p className="text-2xl font-bold text-slate-700">{stats.notCheckedIn}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <UserX className="w-5 h-5 text-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 min-w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-slate-800" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaginatedDataTable
        title="Teacher attendance"
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              />
            </div>
            <div className="flex items-center text-sm text-slate-700 whitespace-nowrap">
              <Calendar className="w-4 h-4 mr-1 shrink-0" />
              {formatDate(selectedDate)}
            </div>
          </div>
        }
        columns={tableColumns}
        loading={loading}
        loadingContent={<p className="text-slate-800">Loading attendance…</p>}
        loadingIcon={<Loader2 className="w-8 h-8 animate-spin text-slate-800" />}
        isEmpty={!loading && filteredAttendance.length === 0}
        emptyContent={
          <div className="py-12 text-center text-slate-700">
            <UserCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>
              {searchQuery
                ? 'No matching teachers'
                : 'No teachers found. Add active teachers to see them here.'}
            </p>
          </div>
        }
        totalCount={filteredAttendance.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedRows.map((row) => {
          if (row.record) {
            const record = row.record;
            const config = statusConfig[record.status];
            const Icon = config.icon;
            return (
              <tr key={record.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {record.teacher?.name ?? row.teacher.name ?? '—'}
                    </p>
                    <p className="text-xs text-slate-700">
                      {record.teacher?.email ?? row.teacher.email ?? ''}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-800">{formatTime(record.checkInTime)}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-800">
                  {record.method === 'MOBILE_GEO'
                    ? 'Mobile (Geo)'
                    : record.method === 'MOBILE'
                      ? 'Mobile'
                      : 'Manual'}
                  {record.geoVerified && (
                    <span className="ml-1 text-xs text-slate-800" title="Location verified">
                      ✓
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-slate-800 max-w-[160px] truncate">
                  {record.remarks || '—'}
                </td>
                {settings?.allowManualOverride && (
                  <td className="py-3 px-4 text-right">
                    <select
                      value={record.status}
                      onChange={(e) =>
                        handleOverride(record.id, e.target.value as TeacherAttendanceStatus)
                      }
                      disabled={overrideLoading === record.id}
                      className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-slate-700/20"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="LATE">Late</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LEAVE">Leave</option>
                    </select>
                    {overrideLoading === record.id && (
                      <Loader2 className="w-4 h-4 inline-block ml-1 animate-spin text-slate-800" />
                    )}
                  </td>
                )}
              </tr>
            );
          }
          const NotCheckedInIcon = notCheckedInConfig.icon;
          return (
            <tr key={`no-record-${row.teacher.id}`} className="hover:bg-slate-50/50 bg-slate-50/30">
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-slate-900">{row.teacher.name ?? '—'}</p>
                  <p className="text-xs text-slate-700">{row.teacher.email ?? ''}</p>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-slate-700">—</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${notCheckedInConfig.bg} ${notCheckedInConfig.text}`}
                >
                  <NotCheckedInIcon className="w-3.5 h-3.5" />
                  {notCheckedInConfig.label}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-slate-700">—</td>
              <td className="py-3 px-4 text-sm text-slate-700">—</td>
              {settings?.allowManualOverride && (
                <td className="py-3 px-4 text-right text-slate-800 text-xs">—</td>
              )}
            </tr>
          );
        })}
      </PaginatedDataTable>

      <AlertComponent />
    </div>
  );
}
