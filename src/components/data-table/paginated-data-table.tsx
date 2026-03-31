'use client';

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export interface DataTableColumn {
  id: string;
  label: ReactNode;
  /** Cell/header alignment */
  align?: 'left' | 'right';
  className?: string;
}

export interface PaginatedDataTableProps {
  /** Card header title (left) */
  title?: React.ReactNode;
  /** Right side of header row */
  headerActions?: React.ReactNode;
  columns: DataTableColumn[];
  children: React.ReactNode;
  loading?: boolean;
  /** When true and not loading, shows emptyContent instead of the table */
  isEmpty: boolean;
  emptyContent: React.ReactNode;
  loadingContent?: React.ReactNode;
  /** Total items (e.g. from API) — drives pagination text */
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the page-size selector */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  /** Icon + message area while loading */
  loadingIcon?: ReactNode;
  className?: string;
  tableWrapperClassName?: string;
}

function paginationDerived(totalCount: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalCount);
  return { totalPages, safePage, startIndex, endIndex };
}

export function PaginatedDataTable({
  title,
  headerActions,
  columns,
  children,
  loading = false,
  isEmpty,
  emptyContent,
  loadingContent,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  loadingIcon,
  className,
  tableWrapperClassName,
}: PaginatedDataTableProps) {
  const { totalPages, safePage, startIndex, endIndex } = paginationDerived(totalCount, page, pageSize);
  const showPagination = !loading && totalCount > 0;

  return (
    <Card className={className}>
      {(title != null || headerActions != null) && (
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            {title != null && <CardTitle className="text-lg">{title}</CardTitle>}
            {headerActions != null ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              {loadingIcon ?? null}
            </div>
            {loadingContent ?? <p className="text-slate-800">Loading...</p>}
          </div>
        ) : isEmpty ? (
          emptyContent
        ) : (
          <div className={cn('overflow-x-auto', tableWrapperClassName)}>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className={cn(
                        'py-3 px-4 text-xs font-semibold text-slate-800 uppercase tracking-wider',
                        col.align === 'right' ? 'text-right' : 'text-left',
                        col.className
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">{children}</tbody>
            </table>
          </div>
        )}

        {showPagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-800">
                Showing {totalCount === 0 ? 0 : startIndex}–{endIndex} of {totalCount}
              </p>
              {onPageSizeChange != null && (
                <select
                  value={pageSize}
                  onChange={(e) => {
                    onPageSizeChange(Number(e.target.value));
                    onPageChange(1);
                  }}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n} per page
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={safePage <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-800 px-2 min-w-[4rem] text-center">
                Page {safePage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={safePage >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
