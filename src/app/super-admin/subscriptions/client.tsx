'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { SubscriptionModule, SubscriptionTierSummary } from '@/types/subscription';
import { deleteSubscriptionTier } from '@/lib/subscription-api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  initialTiers: SubscriptionTierSummary[];
  moduleCount: number;
};

const TIER_COLUMNS: DataTableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'slug', label: 'Slug' },
  { id: 'schools', label: 'Schools' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

export default function SubscriptionsClient({ initialTiers, moduleCount }: Props) {
  const router = useRouter();
  const [tiers, setTiers] = useState(initialTiers);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubscriptionTierSummary | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setTiers(initialTiers);
  }, [initialTiers]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      await deleteSubscriptionTier(confirmDelete.id);
      setTiers((prev) => prev.filter((t) => t.id !== confirmDelete.id));
      toast.success(`Tier "${confirmDelete.name}" deleted`);
      setConfirmDelete(null);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not delete tier');
    } finally {
      setDeleting(null);
    }
  };

  const totalCount = tiers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedTiers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tiers.slice(start, start + pageSize);
  }, [tiers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">
            Manage subscription tiers and permissions across school admin, teacher, and parent apps. The
            permission list is fixed to <strong>{moduleCount}</strong> modules defined in the system.
          </p>
          <Link
            href={ROUTES.SUPER_ADMIN.SUBSCRIPTION_REQUESTS}
            className="mt-2 inline-block text-sm font-medium text-slate-700 hover:underline"
          >
            Review school upgrade requests →
          </Link>
        </div>
        <Link
          href={ROUTES.SUPER_ADMIN.SUBSCRIPTIONS_CREATE}
          className={cn(
            'inline-flex items-center justify-center rounded-lg font-medium h-10 px-4 text-sm',
            'bg-slate-800 text-white hover:bg-slate-700 shadow-sm transition-colors',
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add tier
        </Link>
      </div>

      <PaginatedDataTable
        title={
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-slate-800" />
              Tiers
            </span>
            <p className="text-sm text-gray-600 font-normal">
              Built-in tiers (Free, Starter, Pro, Enterprise) cannot be deleted; you can deactivate them or adjust
              permissions.
            </p>
          </div>
        }
        columns={TIER_COLUMNS}
        loading={false}
        isEmpty={tiers.length === 0}
        emptyContent={
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No tiers found. Run the backend seed or create a tier.
          </div>
        }
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        tableWrapperClassName="text-sm"
      >
        {paginatedTiers.map((tier) => (
          <tr key={tier.id} className="border-b border-gray-100 hover:bg-gray-50/80">
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{tier.name}</span>
                {tier.isSystem && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-800">
                    <Shield className="h-3 w-3" />
                    System
                  </span>
                )}
              </div>
            </td>
            <td className="py-3 px-4 font-mono text-xs text-gray-600">{tier.slug}</td>
            <td className="py-3 px-4 text-gray-700">{tier._count.schools}</td>
            <td className="py-3 px-4">
              <span
                className={
                  tier.isActive
                    ? 'rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-800'
                    : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                }
              >
                {tier.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <div className="flex justify-end gap-2">
                <Link
                  href={ROUTES.SUPER_ADMIN.SUBSCRIPTIONS_EDIT(tier.id)}
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium h-8 px-3 text-sm',
                    'border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
                {!tier.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setConfirmDelete(tier)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tier?</DialogTitle>
            <DialogDescription>
              This will permanently remove &quot;{confirmDelete?.name}&quot; only if no schools use it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!!deleting} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
