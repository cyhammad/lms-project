'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarX,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { TeacherLeaveType, LeaveAllocationType, LeaveMonthlyBehavior } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const LEAVE_TYPES_COLUMNS: DataTableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'paid', label: 'Paid' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'days', label: 'Days' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

export default function LeaveTypesClient() {
  const { showSuccess, showError, showConfirm, AlertComponent, ConfirmComponent } = useAlert();
  const [leaveTypes, setLeaveTypes] = useState<TeacherLeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    name: '',
    isPaid: true,
    allocationType: 'ANNUAL' as LeaveAllocationType,
    allocationCount: 12,
    monthlyBehavior: null as LeaveMonthlyBehavior | null,
    maxCarryForward: null as number | null,
    description: '',
    isActive: true,
  });

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const data = await apiClient<{ leaveTypes: TeacherLeaveType[] }>('/staff/leaves/types');
      setLeaveTypes(data?.leaveTypes ?? []);
    } catch (e: any) {
      showError(e?.message || 'Failed to load leave types');
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      isPaid: true,
      allocationType: 'ANNUAL',
      allocationCount: 12,
      monthlyBehavior: null,
      maxCarryForward: null,
      description: '',
      isActive: true,
    });
    setShowForm(true);
  };

  const openEdit = (lt: TeacherLeaveType) => {
    setEditingId(lt.id);
    setForm({
      name: lt.name,
      isPaid: lt.isPaid,
      allocationType: lt.allocationType,
      allocationCount: lt.allocationCount,
      monthlyBehavior: lt.monthlyBehavior ?? null,
      maxCarryForward: lt.maxCarryForward ?? null,
      description: lt.description ?? '',
      isActive: lt.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showError('Name is required');
      return;
    }
    if (form.allocationType === 'MONTHLY' && form.monthlyBehavior === 'CARRY_FORWARD') {
      if (form.maxCarryForward == null || form.maxCarryForward < 0) {
        showError('Carry forward days is required when carry forward is Yes');
        return;
      }
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient(`/staff/leaves/types/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name,
            isPaid: form.isPaid,
            allocationType: form.allocationType,
            allocationCount: form.allocationCount,
            monthlyBehavior: form.monthlyBehavior,
            maxCarryForward: form.allocationType === 'MONTHLY' && form.monthlyBehavior === 'CARRY_FORWARD' ? form.maxCarryForward : null,
            description: form.description || null,
            isActive: form.isActive,
          }),
        });
        showSuccess('Leave type updated');
      } else {
        await apiClient('/staff/leaves/types', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            isPaid: form.isPaid,
            allocationType: form.allocationType,
            allocationCount: form.allocationCount,
            monthlyBehavior: form.monthlyBehavior,
            maxCarryForward: form.allocationType === 'MONTHLY' && form.monthlyBehavior === 'CARRY_FORWARD' ? form.maxCarryForward : null,
            description: form.description || null,
          }),
        });
        showSuccess('Leave type created');
      }
      setShowForm(false);
      fetchTypes();
    } catch (e: any) {
      showError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const paginatedLeaveTypes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return leaveTypes.slice(start, start + pageSize);
  }, [leaveTypes, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [leaveTypes.length]);

  const handleDelete = async (id: string, name: string) => {
    const ok = await showConfirm(
      `Delete leave type "${name}"? This will fail if it has existing requests. Consider deactivating instead.`,
      'Delete Leave Type',
      'Delete',
      'Cancel',
      'destructive'
    );
    if (!ok) return;
    try {
      await apiClient(`/staff/leaves/types/${id}`, { method: 'DELETE' });
      showSuccess('Leave type deleted');
      fetchTypes();
    } catch (e: any) {
      showError(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.STAFF}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leave Types</h1>
            <p className="text-slate-700 text-sm">Define leave policies (annual/monthly, paid/unpaid)</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-slate-800 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Leave Type
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Edit Leave Type' : 'New Leave Type'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="e.g. Sick Leave"
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={form.isPaid}
                  onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <label htmlFor="isPaid" className="text-sm text-slate-700">Paid leave</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allocation</label>
                <select
                  value={form.allocationType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      allocationType: e.target.value as LeaveAllocationType,
                      monthlyBehavior: e.target.value === 'MONTHLY' ? 'RESET' : null,
                      maxCarryForward: e.target.value === 'MONTHLY' ? f.maxCarryForward : null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="ANNUAL">Annual</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Days per period</label>
                <input
                  type="number"
                  min={0}
                  value={form.allocationCount}
                  onChange={(e) => setForm((f) => ({ ...f, allocationCount: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              {form.allocationType === 'MONTHLY' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Carry forward</label>
                    <select
                      value={form.monthlyBehavior === 'CARRY_FORWARD' ? 'YES' : 'NO'}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          monthlyBehavior: e.target.value === 'YES' ? 'CARRY_FORWARD' : 'RESET',
                          maxCarryForward: e.target.value === 'YES' ? (f.maxCarryForward ?? 0) : null,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>
                  {form.monthlyBehavior === 'CARRY_FORWARD' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Carry forward days</label>
                      <input
                        type="number"
                        min={0}
                        value={form.maxCarryForward ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            maxCarryForward: e.target.value === '' ? null : Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="e.g. 5"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Optional"
                />
              </div>
              {editingId && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-slate-800 hover:bg-slate-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <PaginatedDataTable
        title="Leave types"
        columns={LEAVE_TYPES_COLUMNS}
        loading={loading}
        loadingContent={<p className="text-slate-800">Loading leave types…</p>}
        loadingIcon={<Loader2 className="w-8 h-8 animate-spin text-slate-800" />}
        isEmpty={!loading && leaveTypes.length === 0}
        emptyContent={
          <div className="py-12 text-center text-slate-700">
            <CalendarX className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No leave types yet. Add one to get started.</p>
          </div>
        }
        totalCount={leaveTypes.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedLeaveTypes.map((lt) => (
          <tr key={lt.id} className="hover:bg-slate-50/50">
            <td className="py-3 px-4 font-medium text-slate-900">{lt.name}</td>
            <td className="py-3 px-4">{lt.isPaid ? 'Yes' : 'No'}</td>
            <td className="py-3 px-4">{lt.allocationType}</td>
            <td className="py-3 px-4">{lt.allocationCount}</td>
            <td className="py-3 px-4">
              <span
                className={`inline-flex px-2 py-1 rounded text-xs font-medium ${lt.isActive ? 'bg-slate-50 text-slate-700' : 'bg-slate-100 text-slate-800'
                  }`}
              >
                {lt.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <Button variant="ghost" size="sm" onClick={() => openEdit(lt)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => handleDelete(lt.id, lt.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      <AlertComponent />
      <ConfirmComponent />
    </div>
  );
}
