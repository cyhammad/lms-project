'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StudentFeePayment } from '@/types';

interface Props {
  visible: boolean;
  amount: string;
  onChangeAmount: (value: string) => void;
  currentPayment: StudentFeePayment | undefined | null;
  onRecord: (paymentId: string, finalAmount: number) => void;
  onClose: () => void;
}

export function StudentFeePaymentModal({
  visible,
  amount,
  onChangeAmount,
  currentPayment,
  onRecord,
  onClose,
}: Props) {
  if (!visible || !currentPayment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="pt-4 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Record Payment</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Payment Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => onChangeAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty for full payment</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onRecord(currentPayment.id, currentPayment.finalAmount)}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
              >
                Record
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

