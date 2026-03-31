'use client';

import { StudentFeesHeader } from './StudentFeesHeader';
import { StudentFeesSummary } from './StudentFeesSummary';
import { StudentAdmissionFeeCard } from './StudentAdmissionFeeCard';
import { StudentFeeHistoryCard } from './StudentFeeHistoryCard';
import { StudentFeePaymentModal } from './StudentFeePaymentModal';
import { StudentFeeEditModal } from './StudentFeeEditModal';
import { StudentFeeAddModal } from './StudentFeeAddModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useStudentFeesPage } from './useStudentFeesPage';

interface Props {
  studentId: string;
  user: any;
}

export function StudentFeesClientPage({ studentId, user }: Props) {
  const state = useStudentFeesPage(studentId, user);

  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-500">Loading student fees...</div>
      </div>
    );
  }

  if (!state.student) return null;

  return (
    <div className="space-y-4">
      <StudentFeesHeader
        student={state.student}
        displayName={state.displayName || ''}
        onOpenAddFee={state.openAddModal}
      />

      <StudentFeesSummary
        totalFees={state.feeSummary.totalFees}
        totalPaid={state.feeSummary.totalPaid}
        totalOutstanding={state.feeSummary.totalOutstanding}
        formatCurrency={state.formatCurrency}
      />

      <StudentAdmissionFeeCard
        admissionFee={state.admissionFee}
        formatCurrency={state.formatCurrency}
        formatDate={state.formatDate}
        getStudentName={state.getStudentName}
        getClassName={state.getClassName}
        getSectionName={state.getSectionName}
        onMarkUnpaid={state.handleMarkAsUnpaid}
        onOpenEdit={state.openEditModal}
        onOpenPayment={state.setShowPaymentModal}
      />

      <StudentFeeHistoryCard
        payments={state.studentPayments}
        formatCurrency={state.formatCurrency}
        formatDate={state.formatDate}
        onDownloadChallan={state.handleDownloadChallan}
        onDownloadInvoice={state.handleDownloadInvoice}
        onMarkUnpaid={state.handleMarkAsUnpaid}
        onOpenEdit={state.openEditModal}
        onOpenPayment={state.setShowPaymentModal}
      />

      <StudentFeePaymentModal
        visible={!!state.showPaymentModal}
        amount={state.paymentAmount}
        onChangeAmount={state.setPaymentAmount}
        currentPayment={state.currentPayment}
        onRecord={state.handleMarkAsPaid}
        onClose={() => {
          state.setShowPaymentModal(null);
          state.setPaymentAmount('');
        }}
      />

      <StudentFeeEditModal
        visible={!!state.showEditModal}
        standardFee={state.editStandardFee}
        discountedFee={state.editDiscountedFee}
        dueDate={state.editDueDate}
        onChangeStandardFee={state.setEditStandardFee}
        onChangeDiscountedFee={state.setEditDiscountedFee}
        onChangeDueDate={state.setEditDueDate}
        formatCurrency={state.formatCurrency}
        onSave={state.handleSaveEdit}
        onClose={state.closeEditModal}
      />

      <StudentFeeAddModal
        visible={state.showAddModal}
        feeType={state.addFeeType}
        standardFee={state.addStandardFee}
        discountedFee={state.addDiscountedFee}
        dueDate={state.addDueDate}
        month={state.addMonth}
        year={state.addYear}
        onChangeFeeType={state.setAddFeeType}
        onChangeStandardFee={state.setAddStandardFee}
        onChangeDiscountedFee={state.setAddDiscountedFee}
        onChangeDueDate={state.setAddDueDate}
        onChangeMonth={state.setAddMonth}
        onChangeYear={state.setAddYear}
        formatCurrency={state.formatCurrency}
        getStandardFee={state.getStandardFee}
        onSave={state.handleSaveAdd}
        onClose={state.closeAddModal}
      />

      <ConfirmDialog
        open={!!state.unpaidConfirmPaymentId}
        onConfirm={state.confirmMarkAsUnpaid}
        onCancel={state.cancelUnpaidConfirm}
        title="Mark fee as unpaid"
        message="Are you sure you want to mark this fee as unpaid?"
        confirmText="Mark as unpaid"
        variant="destructive"
      />
    </div>
  );
}
