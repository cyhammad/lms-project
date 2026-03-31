'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createSchoolFeePayment, updateSchoolFeePayment, deleteSchoolFeePayment } from '@/actions/schools';
import type { SchoolMonthlyFeePayment } from '@/types';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const PAYMENT_COLUMNS: DataTableColumn[] = [
  { id: 'period', label: 'Month / Year' },
  { id: 'amount', label: 'Amount (PKR)' },
  { id: 'paidAt', label: 'Paid at' },
  { id: 'notes', label: 'Notes' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format date for display - use fixed locale to avoid hydration mismatch between server and client */
function formatPaymentDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
}

/** Format number for display - use fixed locale to avoid hydration mismatch */
function formatAmount(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function SchoolFeePaymentsSection({
  schoolId,
  initialPayments,
}: {
  schoolId: string;
  initialPayments: SchoolMonthlyFeePayment[];
}) {
  const [payments, setPayments] = useState<SchoolMonthlyFeePayment[]>(initialPayments);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    notes: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', notes: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const hasDuplicate = payments.some(
    (p) => p.month === form.month && p.year === form.year
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDuplicate) {
      toast.error('A payment record already exists for this month and year.');
      return;
    }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const result = await createSchoolFeePayment(schoolId, {
        month: form.month,
        year: form.year,
        amount,
        notes: form.notes.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Payment recorded');
        const newPayment = result.payment;
        setPayments(prev =>
          newPayment
            ? [{ ...newPayment, paidAt: newPayment.paidAt ?? new Date() }, ...prev]
            : [{
              id: '',
              schoolId,
              month: form.month,
              year: form.year,
              amount,
              paidAt: new Date(),
              notes: form.notes.trim() || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }, ...prev]
        );
        setForm(prev => ({ ...prev, amount: '', notes: '' }));
      }
    } catch (e) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (p: SchoolMonthlyFeePayment) => {
    setEditingId(p.id);
    setEditForm({ amount: String(p.amount), notes: p.notes ?? '' });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    const amount = parseFloat(editForm.amount);
    if (editForm.amount === '' || isNaN(amount) || amount < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const result = await updateSchoolFeePayment(schoolId, editingId, {
        amount,
        notes: editForm.notes.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Payment updated');
        setPayments(prev =>
          prev.map((p) =>
            p.id === editingId
              ? { ...p, amount, notes: editForm.notes.trim() || null }
              : p
          )
        );
        setEditingId(null);
      }
    } catch (e) {
      toast.error('Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      const result = await deleteSchoolFeePayment(schoolId, deleteConfirmId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Payment record deleted');
        setPayments(prev => prev.filter((p) => p.id !== deleteConfirmId));
        setDeleteConfirmId(null);
      }
    } catch (e) {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const totalCount = payments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return payments.slice(start, start + pageSize);
  }, [payments, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Monthly fee payments</CardTitle>
          <CardDescription>Record monthly fees submitted by this school. One record per month per school.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <select
                value={form.month}
                onChange={(e) => setForm(f => ({ ...f, month: parseInt(e.target.value, 10) }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                onChange={(e) => setForm(f => ({ ...f, year: parseInt(e.target.value, 10) }))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Optional"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={loading || hasDuplicate}
              title={hasDuplicate ? 'A payment for this month already exists' : ''}
            >
              {loading ? 'Saving...' : 'Add payment'}
            </Button>
            {hasDuplicate && (
              <span className="text-xs text-amber-600">Already exists for this month/year</span>
            )}
          </form>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title="Payment history"
        columns={PAYMENT_COLUMNS}
        loading={false}
        isEmpty={payments.length === 0}
        emptyContent={
          <div className="py-6 text-center text-sm text-gray-500">No payments recorded yet</div>
        }
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        tableWrapperClassName="text-sm"
      >
        {paginatedPayments.map((p) => (
          <tr key={p.id || `${p.schoolId}-${p.year}-${p.month}`} className="border-b border-gray-100">
            <td className="py-3 px-4">
              {MONTHS[p.month - 1]} {p.year}
            </td>
            <td className="py-3 px-4 font-medium">{formatAmount(p.amount)}</td>
            <td className="py-3 px-4 text-gray-600">{formatPaymentDate(p.paidAt)}</td>
            <td className="py-3 px-4 text-gray-600">{p.notes || '—'}</td>
            <td className="py-3 px-4 text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => openEdit(p)}
                  disabled={!p.id}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-slate-700" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setDeleteConfirmId(p.id)}
                  disabled={!p.id || deletingId === p.id}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      {/* Edit modal */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit payment</DialogTitle>
            <DialogDescription>Update amount and notes. Month and year cannot be changed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={editForm.amount}
                onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={editForm.notes}
                onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete payment record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment record? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={!!deletingId}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={!!deletingId}>
              {deletingId ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
