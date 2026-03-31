'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, FolderTree, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { ExpenseCategory } from '@/types';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/use-alert';

const CATEGORY_COLUMNS: DataTableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'description', label: 'Description' },
  { id: 'expenses', label: 'Expenses', align: 'right' },
  { id: 'actions', label: 'Actions', align: 'right', className: 'w-28' },
];

export default function ExpenseCategoriesClient() {
  const router = useRouter();
  const { showError, AlertComponent } = useAlert();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ categories: ExpenseCategory[] }>('/expense-categories');
      setCategories(res.categories || []);
    } catch {
      showError('Failed to load categories.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: ExpenseCategory) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? '' });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      showError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient(`/expense-categories/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            description: form.description.trim() || null,
          }),
        });
      } else {
        await apiClient('/expense-categories', {
          method: 'POST',
          body: JSON.stringify({
            name,
            description: form.description.trim() || null,
          }),
        });
      }
      setDialogOpen(false);
      await fetchCategories();
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: ExpenseCategory) => {
    if (!confirm(`Delete category “${c.name}”? Expenses using it will have no category.`)) return;
    setDeletingId(c.id);
    try {
      await apiClient(`/expense-categories/${c.id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
    } catch {
      showError('Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalCount = categories.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  return (
    <div className="space-y-6">
      <AlertComponent />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={ROUTES.ADMIN.EXPENSES}
            className="inline-flex items-center text-sm text-slate-800 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to expenses
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Expense Categories</h1>
          <p className="text-slate-800 mt-1">Create categories to organize school expenses (optional on each expense)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add category
        </Button>
      </div>

      <PaginatedDataTable
        title={
          <span className="flex items-center gap-2 text-lg">
            <FolderTree className="h-5 w-5" />
            Categories
          </span>
        }
        columns={CATEGORY_COLUMNS}
        loading={loading}
        loadingContent={<p className="text-slate-800">Loading…</p>}
        isEmpty={!loading && categories.length === 0}
        emptyContent={
          <div className="py-12 text-center text-slate-700">
            No categories yet.{' '}
            <button type="button" onClick={openCreate} className="text-slate-800 hover:underline font-medium">
              Add one
            </button>
          </div>
        }
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedCategories.map((c) => (
          <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
            <td className="py-3 px-4 font-medium text-slate-900">{c.name}</td>
            <td className="py-3 px-4 text-sm text-slate-800 max-w-[280px] truncate">{c.description || '—'}</td>
            <td className="py-3 px-4 text-sm text-right text-slate-700">{c._count?.expenses ?? 0}</td>
            <td className="py-3 px-4 w-28">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Edit"
                  onClick={() => openEdit(c)}
                >
                  <Pencil className="h-4 w-4 text-slate-700" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Delete"
                  onClick={() => handleDelete(c)}
                  disabled={deletingId === c.id}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-lg text-slate-900">
              {editing ? 'Edit category' : 'New category'}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="cat-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                  placeholder="e.g. Utilities, Transport"
                />
              </div>
              <div>
                <label htmlFor="cat-desc" className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
