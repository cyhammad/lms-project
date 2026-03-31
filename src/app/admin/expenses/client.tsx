'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, X, Trash2, Edit, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import { deleteExpense } from '@/actions/expenses';
import type { Expense, ExpenseCategory } from '@/types';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/use-alert';

const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const formatAmount = (n: number) => `PKR ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

const EXPENSE_COLUMNS: DataTableColumn[] = [
  { id: 'date', label: 'Date' },
  { id: 'title', label: 'Title' },
  { id: 'category', label: 'Category' },
  { id: 'amount', label: 'Amount', align: 'right' },
  { id: 'description', label: 'Description' },
  { id: 'actions', label: 'Actions', align: 'right', className: 'w-24' },
];

export default function ExpensesClient() {
  const router = useRouter();
  const { showError, AlertComponent } = useAlert();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const res = await apiClient<{ expenses: Expense[]; pagination: { total: number } }>(
        `/expenses?${params.toString()}`
      );
      setExpenses(res.expenses || []);
      setTotalCount(res.pagination?.total ?? res.expenses?.length ?? 0);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
      setTotalCount(0);
      showError('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter, showError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient<{ categories: ExpenseCategory[] }>('/expense-categories');
        if (!cancelled) setCategories(res.categories || []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const hasFilters = !!search || !!categoryFilter;

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setPage(1);
  };

  const handleDelete = (id: string, title: string) => {
    setExpenseToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setDeletingId(expenseToDelete.id);
    try {
      const result = await deleteExpense(expenseToDelete.id);
      if (result.error) showError(result.error);
      else {
        setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
        setTotalCount((c) => Math.max(0, c - 1));
        router.refresh();
      }
    } catch (e) {
      showError('Failed to delete expense.');
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <AlertComponent />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Management</h1>
          <p className="text-slate-800 mt-1">Track and manage school expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.ADMIN.EXPENSES_CATEGORIES}>
            <Button variant="outline">Categories</Button>
          </Link>
          <Link href={ROUTES.ADMIN.EXPENSES_CREATE}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            All Expenses
          </CardTitle>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-800" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="min-w-[160px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 bg-white"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <PaginatedDataTable
        title={
          <span className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            All Expenses
          </span>
        }
        columns={EXPENSE_COLUMNS}
        loading={loading}
        loadingContent={<p className="text-slate-800">Loading expenses...</p>}
        isEmpty={!loading && expenses.length === 0}
        emptyContent={
          <div className="py-12 text-center text-slate-700">
            No expenses found.{' '}
            <Link href={ROUTES.ADMIN.EXPENSES_CREATE} className="text-slate-800 hover:underline">
              Add one
            </Link>
            .
          </div>
        }
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {expenses.map((exp) => (
          <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50/50">
            <td className="py-3 px-4 text-sm text-slate-700">{formatDate(exp.createdAt)}</td>
            <td className="py-3 px-4 font-medium text-slate-900">{exp.title}</td>
            <td className="py-3 px-4 text-sm text-slate-800">{exp.category?.name ?? '—'}</td>
            <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">{formatAmount(exp.amount)}</td>
            <td className="py-3 px-4 text-sm text-slate-800 max-w-[200px] truncate">{exp.description || '—'}</td>
            <td className="py-3 px-4 w-24">
              <div className="flex items-center gap-1">
                <Link href={ROUTES.ADMIN.EXPENSES_EDIT(exp.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                    <Edit className="h-4 w-4 text-slate-700" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDelete(exp.id, exp.title)}
                  disabled={deletingId === exp.id}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      {deleteDialogOpen && expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-slate-900">Delete expense?</h3>
            <p className="text-slate-800 mt-2">“{expenseToDelete.title}” will be permanently removed.</p>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setExpenseToDelete(null); }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={!!deletingId}>
                {deletingId ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
