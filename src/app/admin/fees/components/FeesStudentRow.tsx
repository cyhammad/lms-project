import type { PaymentStatus, Student, StudentFeePayment } from '@/types';
import { Button } from '@/components/ui/button';
import { Save, XCircle, FileText, Receipt, Edit } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';

interface FeesStudentRowProps {
  student: Student;
  displayName: string;
  standardFee: number;
  discountedFee: number;
  isEditing: boolean;
  editingFeeValue: string;
  onChangeEditingFeeValue: (value: string) => void;
  onStartEditFee: (student: Student) => void;
  onCancelEditFee: () => void;
  onSaveEditFee: (student: Student) => void;
  paymentStatus: PaymentStatus;
  allPayments: StudentFeePayment[];
  selectedMonth: string;
  selectedYear: string;
  getClassName: (studentId: string) => string;
  getSectionName: (studentId: string) => string;
  onDownloadChallan: (student: Student) => void;
  onDownloadInvoice: (student: Student) => void;
  formatCurrency: (amount: number) => string;
}

export function FeesStudentRow({
  student,
  displayName,
  standardFee,
  discountedFee,
  isEditing,
  editingFeeValue,
  onChangeEditingFeeValue,
  onStartEditFee,
  onCancelEditFee,
  onSaveEditFee,
  paymentStatus,
  allPayments,
  selectedMonth,
  selectedYear,
  getClassName,
  getSectionName,
  onDownloadChallan,
  onDownloadInvoice,
  formatCurrency,
}: FeesStudentRowProps) {
  const addOnFees = allPayments
    .filter((payment) => {
      if (selectedMonth && selectedYear) {
        const monthNum = parseInt(selectedMonth, 10);
        const yearNum = parseInt(selectedYear, 10);
        if (payment.month && payment.year) {
          return payment.month === monthNum && payment.year === yearNum;
        }
        return false;
      }
      return true;
    })
    .filter(
      (payment) =>
        payment.feeType !== 'MonthlyTuition' && payment.feeType !== 'Admission',
    );

  const addOnFeesTotal = addOnFees.reduce(
    (sum, payment) => sum + payment.finalAmount,
    0,
  );

  const hasPaidFees = allPayments.some(
    (p) => p.status === 'Paid' || (p.status === 'Partial' && (p.paidAmount || 0) > 0),
  );

  const addOnsByType = addOnFees.reduce(
    (acc, payment) => {
      if (!acc[payment.feeType]) {
        acc[payment.feeType] = {
          total: 0,
          count: 0,
          statuses: new Set<string>(),
        };
      }
      acc[payment.feeType].total += payment.finalAmount;
      acc[payment.feeType].count += 1;
      acc[payment.feeType].statuses.add(payment.status);
      return acc;
    },
    {} as Record<string, { total: number; count: number; statuses: Set<string> }>,
  );

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <StudentAvatar student={student} displayName={displayName} />
          <div>
            <div className="font-medium text-sm text-gray-900">{displayName}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {getClassName(student.id)} • {getSectionName(student.id)}
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(standardFee)}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <input
              type="number"
              value={editingFeeValue}
              onChange={(e) => onChangeEditingFeeValue(e.target.value)}
              min="0"
              max={standardFee}
              step="0.01"
              className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveEditFee(student);
                } else if (e.key === 'Escape') {
                  onCancelEditFee();
                }
              }}
            />
            <button
              onClick={() => onSaveEditFee(student)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEditFee}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
              title="Cancel"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(discountedFee)}
            </span>
            <button
              onClick={() => onStartEditFee(student)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Edit fee"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        {addOnFees.length > 0 ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="text-sm font-medium text-gray-900">
              {formatCurrency(addOnFeesTotal)}
            </div>
            <div className="flex flex-col gap-1 items-end">
              {Object.entries(addOnsByType).map(([feeType, data]) => {
                const statusArray = Array.from(data.statuses);
                const hasMultipleStatuses = statusArray.length > 1;
                const primaryStatus = statusArray.includes('Unpaid')
                  ? 'Unpaid'
                  : statusArray.includes('Partial')
                  ? 'Partial'
                  : 'Paid';

                return (
                  <div
                    key={feeType}
                    className="flex items-center gap-1.5 text-xs"
                    title={`${feeType}: ${data.count} item(s), Total: ${formatCurrency(
                      data.total,
                    )}`}
                  >
                    <span className="text-gray-600 font-medium">{feeType}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-700">
                      {formatCurrency(data.total)}
                    </span>
                    {data.count > 1 && (
                      <span className="text-gray-400">({data.count})</span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        primaryStatus === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : primaryStatus === 'Partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {hasMultipleStatuses ? 'Mixed' : primaryStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No add-ons</span>
        )}
      </td>
      <td className="py-4 px-4 text-center">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            paymentStatus === 'Paid'
              ? 'bg-green-100 text-green-700'
              : paymentStatus === 'Partial'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {paymentStatus}
        </span>
      </td>
      <td className="py-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownloadChallan(student)}
            className="text-xs px-3 py-1.5 h-auto cursor-pointer hover:bg-slate-50 transition-colors"
            title="Download Challan"
          >
            <FileText className="w-3 h-3 mr-1" />
            Challan
          </Button>
          {hasPaidFees && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownloadInvoice(student)}
              className="text-xs px-3 py-1.5 h-auto cursor-pointer hover:bg-slate-50 transition-colors"
              title="Download Invoice"
            >
              <Receipt className="w-3 h-3 mr-1" />
              Invoice
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

