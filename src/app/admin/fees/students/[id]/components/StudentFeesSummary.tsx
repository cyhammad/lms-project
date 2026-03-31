'use client';

interface Props {
  totalFees: number;
  totalPaid: number;
  totalOutstanding: number;
  formatCurrency: (amount: number) => string;
}

export function StudentFeesSummary({
  totalFees,
  totalPaid,
  totalOutstanding,
  formatCurrency,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Total Fees</p>
        <p className="text-base font-semibold text-gray-900">{formatCurrency(totalFees)}</p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Paid</p>
        <p className="text-base font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Outstanding</p>
        <p className="text-base font-semibold text-red-600">
          {formatCurrency(totalOutstanding)}
        </p>
      </div>
    </div>
  );
}

