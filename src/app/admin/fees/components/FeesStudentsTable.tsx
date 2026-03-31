'use client';

import { useState, useMemo, useEffect } from 'react';
import type { PaymentStatus, Student, StudentFeePayment } from '@/types';
import { Button } from '@/components/ui/button';
import { Wallet, Download } from 'lucide-react';
import { FeesStudentRow } from './FeesStudentRow';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const COLUMNS: DataTableColumn[] = [
  { id: 'details', label: 'Student Details' },
  { id: 'standard', label: 'Standard Fee', align: 'right' },
  { id: 'discounted', label: 'Discounted Fee', align: 'right' },
  { id: 'addon', label: 'Add-On Fees', align: 'right' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions' },
];

interface GroupedStudent {
  student: Student;
}

interface FeesStudentsTableProps {
  groupedStudents: GroupedStudent[];
  filteredPaymentsCount: number;
  selectedMonth: string;
  selectedYear: string;
  getStudentPayments: (studentId: string) => StudentFeePayment[];
  getStudentName: (studentId: string) => string;
  getClassName: (studentId: string) => string;
  getSectionName: (studentId: string) => string;
  getStandardFee: (student: Student) => number;
  getStudentPaymentStatus: (student: Student) => PaymentStatus;
  editingStudentId: string | null;
  editingFeeValue: string;
  onChangeEditingFeeValue: (value: string) => void;
  onStartEditFee: (student: Student) => void;
  onCancelEditFee: () => void;
  onSaveEditFee: (student: Student) => void;
  onDownloadChallan: (student: Student) => void;
  onDownloadInvoice: (student: Student) => void;
  formatCurrency: (amount: number) => string;
  onDownloadCsv: () => void;
}

export function FeesStudentsTable({
  groupedStudents,
  filteredPaymentsCount,
  selectedMonth,
  selectedYear,
  getStudentPayments,
  getStudentName,
  getClassName,
  getSectionName,
  getStandardFee,
  getStudentPaymentStatus,
  editingStudentId,
  editingFeeValue,
  onChangeEditingFeeValue,
  onStartEditFee,
  onCancelEditFee,
  onSaveEditFee,
  onDownloadChallan,
  onDownloadInvoice,
  formatCurrency,
  onDownloadCsv,
}: FeesStudentsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalCount = groupedStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return groupedStudents.slice(start, start + pageSize);
  }, [groupedStudents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (totalCount > 0 && page > totalPages) setPage(totalPages);
  }, [totalCount, page, totalPages]);

  return (
    <PaginatedDataTable
      title={`Students (${groupedStudents.length})`}
      headerActions={
        filteredPaymentsCount > 0 ? (
          <Button variant="outline" size="sm" onClick={onDownloadCsv}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        ) : null
      }
      columns={COLUMNS}
      loading={false}
      isEmpty={groupedStudents.length === 0}
      emptyContent={
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-slate-800" />
          </div>
          <p className="text-slate-900 font-medium">No challans found</p>
          <p className="text-sm text-slate-700 mt-1">Try adjusting your filters or generate new challans</p>
        </div>
      }
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
    >
      {paginated.map(({ student }) => {
        const standardFee = getStandardFee(student);
        const discountedFee = student.discountedFee || standardFee;
        const isEditing = editingStudentId === student.id;
        const displayName = getStudentName(student.id);
        const allPayments = getStudentPayments(student.id);
        const paymentStatus = getStudentPaymentStatus(student);

        return (
          <FeesStudentRow
            key={student.id}
            student={student}
            displayName={displayName}
            standardFee={standardFee}
            discountedFee={discountedFee}
            isEditing={isEditing}
            editingFeeValue={editingFeeValue}
            onChangeEditingFeeValue={onChangeEditingFeeValue}
            onStartEditFee={onStartEditFee}
            onCancelEditFee={onCancelEditFee}
            onSaveEditFee={onSaveEditFee}
            paymentStatus={paymentStatus}
            allPayments={allPayments}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            getClassName={getClassName}
            getSectionName={getSectionName}
            onDownloadChallan={onDownloadChallan}
            onDownloadInvoice={onDownloadInvoice}
            formatCurrency={formatCurrency}
          />
        );
      })}
    </PaginatedDataTable>
  );
}
