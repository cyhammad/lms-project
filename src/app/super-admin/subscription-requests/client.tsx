'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Check, Inbox, X } from 'lucide-react';
import {
  approveSubscriptionUpgradeRequestAction,
  rejectSubscriptionUpgradeRequestAction,
} from '@/actions/subscription-upgrade-requests';
import { ROUTES } from '@/constants/routes';
import type { SubscriptionUpgradeRequestRow } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Props = {
  initialRequests: SubscriptionUpgradeRequestRow[];
};

const REQ_COLUMNS: DataTableColumn[] = [
  { id: 'school', label: 'School' },
  { id: 'plan', label: 'Requested plan' },
  { id: 'by', label: 'Requested by' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

export default function SubscriptionRequestsClient({ initialRequests }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rejectFor, setRejectFor] = useState<SubscriptionUpgradeRequestRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  async function approve(id: string) {
    setBusyId(id);
    const result = await approveSubscriptionUpgradeRequestAction(id);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Plan upgraded for this school.');
    setRequests((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  async function confirmReject() {
    if (!rejectFor) return;
    setBusyId(rejectFor.id);
    const result = await rejectSubscriptionUpgradeRequestAction(rejectFor.id, rejectReason || null);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Request rejected.');
    setRequests((prev) => prev.filter((r) => r.id !== rejectFor.id));
    setRejectFor(null);
    setRejectReason('');
    router.refresh();
  }

  const totalCount = requests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return requests.slice(start, start + pageSize);
  }, [requests, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription upgrade requests</h1>
        <p className="mt-1 text-gray-600">
          Schools request higher plans from their admin panel. Approve to assign the tier, or reject to close the
          request without changing their plan.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          You can still assign tiers directly from{' '}
          <Link href={ROUTES.SUPER_ADMIN.SCHOOLS} className="font-medium text-slate-700 underline">
            Schools
          </Link>{' '}
          or{' '}
          <Link href={ROUTES.SUPER_ADMIN.SUBSCRIPTIONS} className="font-medium text-slate-700 underline">
            Subscriptions
          </Link>
          .
        </p>
      </div>

      <PaginatedDataTable
        title={
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-lg">
              <Inbox className="h-5 w-5 text-slate-800" />
              Pending ({requests.length})
            </span>
            <p className="text-sm text-gray-600 font-normal">
              Only open requests are listed. Approved and rejected requests are removed from this queue.
            </p>
          </div>
        }
        columns={REQ_COLUMNS}
        loading={false}
        isEmpty={requests.length === 0}
        emptyContent={<p className="py-8 text-center text-sm text-gray-500">No pending upgrade requests.</p>}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        tableWrapperClassName="min-w-[640px] text-left text-sm"
      >
        {paginatedRequests.map((r) => (
          <tr key={r.id} className="align-top border-b border-gray-100">
            <td className="py-3 px-4 font-medium text-gray-900">
              <Link href={ROUTES.SUPER_ADMIN.SCHOOLS_VIEW(r.school.id)} className="text-slate-700 hover:underline">
                {r.school.name}
              </Link>
            </td>
            <td className="py-3 px-4 text-gray-700">
              <span className="font-medium">{r.requestedTier.name}</span>
              <span className="ml-2 font-mono text-xs text-gray-400">{r.requestedTier.slug}</span>
              {!r.requestedTier.isActive && (
                <span className="ml-2 text-xs font-medium text-amber-700">(inactive tier)</span>
              )}
            </td>
            <td className="py-3 px-4 text-gray-600">
              {r.createdByUser ? (
                <>
                  {r.createdByUser.name}
                  <br />
                  <span className="text-xs text-gray-400">{r.createdByUser.email}</span>
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </td>
            <td className="py-3 px-4 whitespace-nowrap text-gray-600">
              {format(new Date(r.createdAt), 'MMM d, yyyy HH:mm')}
            </td>
            <td className="py-3 px-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1 bg-slate-800 hover:bg-slate-700"
                  disabled={busyId !== null || !r.requestedTier.isActive}
                  onClick={() => approve(r.id)}
                  title={!r.requestedTier.isActive ? 'Activate the tier or reject this request' : undefined}
                >
                  {busyId === r.id ? (
                    '…'
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1 border-red-200 text-red-700 hover:bg-red-50"
                  disabled={busyId !== null}
                  onClick={() => {
                    setRejectFor(r);
                    setRejectReason('');
                  }}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>

      <Dialog open={rejectFor !== null} onOpenChange={(open) => !open && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject upgrade request?</DialogTitle>
            <DialogDescription>
              {rejectFor ? (
                <>
                  {rejectFor.school.name} will stay on their current plan. Optionally add a short note (visible only in
                  the database for your team).
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <textarea
            className={cn(
              'min-h-[88px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700'
            )}
            placeholder="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRejectFor(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busyId !== null}
              onClick={() => confirmReject()}
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
