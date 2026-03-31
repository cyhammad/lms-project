'use client';

import { useMemo, useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Edit, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import type { StudentFeePayment } from '@/types';

const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const HISTORY_COLUMNS: DataTableColumn[] = [
  { id: 'period', label: 'Period' },
  { id: 'feeType', label: 'Fee Type' },
  { id: 'standard', label: 'Standard Fee', align: 'right' },
  { id: 'discounted', label: 'Discounted Fee', align: 'right' },
  { id: 'due', label: 'Due Date' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions' },
];

interface Props {
  payments: StudentFeePayment[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  onDownloadChallan: (payment: StudentFeePayment) => void;
  onDownloadInvoice: (payment: StudentFeePayment) => void;
  onMarkUnpaid: (id: string) => void;
  onOpenEdit: (payment: StudentFeePayment) => void;
  onOpenPayment: (id: string) => void;
}

export function StudentFeeHistoryCard({
  payments,
  formatCurrency,
  formatDate,
  onDownloadChallan,
  onDownloadInvoice,
  onMarkUnpaid,
  onOpenEdit,
  onOpenPayment,
}: Props) {
  const sortedPayments = useMemo(
    () =>
      [...payments].sort((a, b) => {
        if (a.year && b.year) {
          if (a.year !== b.year) return b.year - a.year;
          if (a.month && b.month && a.month !== b.month) return b.month - a.month;
        }
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }),
    [payments],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalCount = sortedPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedPayments.slice(start, start + pageSize);
  }, [sortedPayments, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  return (
    <PaginatedDataTable
      title="Fee History"
      columns={HISTORY_COLUMNS}
      loading={false}
      isEmpty={payments.length === 0}
      emptyContent={
        <div className="text-center py-6 text-gray-400">
          <p className="text-xs">No fees found</p>
        </div>
      }
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
    >
      {paginated.map((payment) => {
        const period =
          payment.month && payment.year
            ? `${MONTH_NAMES_FULL[payment.month - 1]} ${payment.year}`
            : payment.feeType === 'Admission'
              ? 'Admission'
              : '-';

        return (
          <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
            <td className="py-4 px-4 text-sm text-gray-900">{period}</td>
            <td className="py-4 px-4 text-sm text-gray-900">{payment.feeType}</td>
            <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">
              {formatCurrency(payment.amount)}
            </td>
            <td className="py-4 px-4 text-right text-sm font-medium text-gray-900">
              <div className="flex flex-col items-end">
                <span>{formatCurrency(payment.finalAmount)}</span>
                {payment.discountAmount > 0 && (
                  <span className="text-gray-500 text-xs">(-{formatCurrency(payment.discountAmount)})</span>
                )}
              </div>
            </td>
            <td className="py-4 px-4 text-sm text-gray-600">{formatDate(payment.dueDate)}</td>
            <td className="py-4 px-4 text-center">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'Paid'
                    ? 'bg-green-100 text-green-700'
                    : payment.status === 'Partial'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {payment.status === 'Paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                {payment.status === 'Partial' && <AlertCircle className="w-3 h-3 mr-1" />}
                {payment.status === 'Unpaid' && <XCircle className="w-3 h-3 mr-1" />}
                {payment.status}
              </span>
              {(payment.status === 'Paid' || payment.status === 'Partial') && payment.paymentDate && (
                <div className="text-xs text-gray-500 mt-1">Paid: {formatDate(payment.paymentDate)}</div>
              )}
              {payment.status === 'Partial' && (
                <div className="text-xs text-red-600 mt-0.5">
                  Outstanding: {formatCurrency(payment.finalAmount - (payment.paidAmount || 0))}
                </div>
              )}
            </td>
            <td className="py-4 px-4">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {payment.status === 'Paid' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadInvoice(payment)}
                      className="text-xs px-3 py-1.5 h-auto"
                      title="Download Invoice"
                    >
                      <Receipt className="w-3 h-3 mr-1" />
                      Invoice
                    </Button>
                    <button
                      type="button"
                      onClick={() => onMarkUnpaid(payment.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline"
                    >
                      Mark Unpaid
                    </button>
                  </>
                ) : payment.status === 'Partial' ? (
                  <>
                    <button type="button" onClick={() => onOpenEdit(payment)} className="text-gray-500 hover:text-gray-700 p-0.5" title="Edit fee">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadChallan(payment)}
                      className="text-xs px-3 py-1.5 h-auto"
                      title="Download Challan"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Challan
                    </Button>
                    <button type="button" onClick={() => onMarkUnpaid(payment.id)} className="text-xs text-red-600 hover:text-red-700 hover:underline">
                      Mark Unpaid
                    </button>
                    <button type="button" onClick={() => onOpenPayment(payment.id)} className="text-xs text-green-600 hover:text-green-700 hover:underline">
                      Add Payment
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => onOpenEdit(payment)} className="text-gray-500 hover:text-gray-700 p-0.5" title="Edit fee">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadChallan(payment)}
                      className="text-xs px-3 py-1.5 h-auto"
                      title="Download Challan"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Challan
                    </Button>
                    <button type="button" onClick={() => onOpenPayment(payment.id)} className="text-xs text-green-600 hover:text-green-700 hover:underline">
                      Mark Paid
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </PaginatedDataTable>
  );
}

