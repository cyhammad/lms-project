'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FeeType } from '@/types';

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

interface Props {
  visible: boolean;
  feeType: FeeType;
  standardFee: string;
  discountedFee: string;
  dueDate: string;
  month: string;
  year: string;
  onChangeFeeType: (value: FeeType) => void;
  onChangeStandardFee: (value: string) => void;
  onChangeDiscountedFee: (value: string) => void;
  onChangeDueDate: (value: string) => void;
  onChangeMonth: (value: string) => void;
  onChangeYear: (value: string) => void;
  formatCurrency: (amount: number) => string;
  getStandardFee: () => number;
  onSave: () => void;
  onClose: () => void;
}

export function StudentFeeAddModal({
  visible,
  feeType,
  standardFee,
  discountedFee,
  dueDate,
  month,
  year,
  onChangeFeeType,
  onChangeStandardFee,
  onChangeDiscountedFee,
  onChangeDueDate,
  onChangeMonth,
  onChangeYear,
  formatCurrency,
  getStandardFee,
  onSave,
  onClose,
}: Props) {
  if (!visible) return null;

  const showMonthYear =
    feeType === 'MonthlyTuition' ||
    feeType === 'Fine' ||
    feeType === 'Transport' ||
    feeType === 'Library' ||
    feeType === 'Sports' ||
    feeType === 'Lab' ||
    feeType === 'Other';

  const discount =
    standardFee && discountedFee
      ? formatCurrency(parseFloat(standardFee || '0') - parseFloat(discountedFee || '0'))
      : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="pt-4 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Fee</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Fee Type</label>
              <select
                value={feeType}
                onChange={(e) => onChangeFeeType(e.target.value as FeeType)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="Fine">Fine</option>
                <option value="Transport">Transport</option>
                <option value="Library">Library</option>
                <option value="Sports">Sports</option>
                <option value="Lab">Lab</option>
                <option value="Other">Other</option>
                <option value="MonthlyTuition">Monthly Tuition</option>
                <option value="Admission">Admission</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Standard Fee {feeType === 'MonthlyTuition' && '(from class)'}
              </label>
              <input
                type="number"
                value={standardFee}
                onChange={(e) => onChangeStandardFee(e.target.value)}
                placeholder="Enter standard fee"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                step="0.01"
              />
              {feeType === 'MonthlyTuition' && (
                <p className="text-xs text-gray-500 mt-1">
                  Class standard fee: {formatCurrency(getStandardFee())}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Discounted Fee
              </label>
              <input
                type="number"
                value={discountedFee}
                onChange={(e) => onChangeDiscountedFee(e.target.value)}
                placeholder="Enter discounted fee"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                step="0.01"
              />
              {discount && (
                <p className="text-xs text-gray-500 mt-1">Discount: {discount}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => onChangeDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            {showMonthYear && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Month (Optional)
                  </label>
                  <select
                    value={month}
                    onChange={(e) => onChangeMonth(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Month</option>
                    {MONTH_NAMES_FULL.map((m, index) => (
                      <option key={index} value={index + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Year (Optional)
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => onChangeYear(e.target.value)}
                    placeholder="YYYY"
                    min="2020"
                    max="2100"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={onSave}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
              >
                Add
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

