'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  visible: boolean;
  standardFee: string;
  discountedFee: string;
  dueDate: string;
  onChangeStandardFee: (value: string) => void;
  onChangeDiscountedFee: (value: string) => void;
  onChangeDueDate: (value: string) => void;
  formatCurrency: (amount: number) => string;
  onSave: () => void;
  onClose: () => void;
}

export function StudentFeeEditModal({
  visible,
  standardFee,
  discountedFee,
  dueDate,
  onChangeStandardFee,
  onChangeDiscountedFee,
  onChangeDueDate,
  formatCurrency,
  onSave,
  onClose,
}: Props) {
  if (!visible) return null;

  const discount =
    standardFee && discountedFee
      ? formatCurrency(parseFloat(standardFee || '0') - parseFloat(discountedFee || '0'))
      : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="pt-4 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Fee</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Standard Fee
              </label>
              <input
                type="number"
                value={standardFee}
                onChange={(e) => onChangeStandardFee(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Discounted Fee
              </label>
              <input
                type="number"
                value={discountedFee}
                onChange={(e) => onChangeDiscountedFee(e.target.value)}
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
            <div className="flex gap-2 pt-2">
              <Button
                onClick={onSave}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
              >
                Save
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

