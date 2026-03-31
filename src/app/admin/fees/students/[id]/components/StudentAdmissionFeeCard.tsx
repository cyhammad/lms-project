'use client';

import { CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StudentFeePayment } from '@/types';

interface Props {
  admissionFee?: StudentFeePayment;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  getStudentName: (id: string) => string;
  getClassName: (id: string) => string;
  getSectionName: (id: string) => string;
  onMarkUnpaid: (id: string) => void;
  onOpenEdit: (payment: StudentFeePayment) => void;
  onOpenPayment: (id: string) => void;
}

export function StudentAdmissionFeeCard({
  admissionFee,
  formatCurrency,
  formatDate,
  onMarkUnpaid,
  onOpenEdit,
  onOpenPayment,
}: Props) {
  if (!admissionFee) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-gray-900">Admission Fee</span>
              {admissionFee.status === 'Paid' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Paid
                </span>
              )}
              {admissionFee.status === 'Partial' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  <AlertCircle className="w-3 h-3" />
                  Partial
                </span>
              )}
              {admissionFee.status === 'Unpaid' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                  <XCircle className="w-3 h-3" />
                  Unpaid
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>{formatCurrency(admissionFee.finalAmount)}</span>
              {admissionFee.discountAmount > 0 && (
                <span className="text-gray-500">
                  Discount: {formatCurrency(admissionFee.discountAmount)}
                </span>
              )}
              <span>Due: {formatDate(admissionFee.dueDate)}</span>
              {admissionFee.status === 'Paid' && admissionFee.paymentDate && (
                <span className="text-green-600">
                  Paid: {formatDate(admissionFee.paymentDate)}
                </span>
              )}
              {admissionFee.status === 'Partial' && (
                <>
                  <span className="text-yellow-600">
                    Paid: {formatCurrency(admissionFee.paidAmount || 0)}
                  </span>
                  <span className="text-red-600">
                    Outstanding:{' '}
                    {formatCurrency(
                      admissionFee.finalAmount - (admissionFee.paidAmount || 0),
                    )}
                  </span>
                  {admissionFee.paymentDate && (
                    <span className="text-gray-500">
                      Date: {formatDate(admissionFee.paymentDate)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {admissionFee.status === 'Paid' || admissionFee.status === 'Partial' ? (
              <>
                {admissionFee.status === 'Paid' && (
                  <button
                    onClick={() => onMarkUnpaid(admissionFee.id)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline"
                  >
                    Mark Unpaid
                  </button>
                )}
                {admissionFee.status === 'Partial' && (
                  <>
                    <button
                      onClick={() => onOpenEdit(admissionFee)}
                      className="text-xs text-gray-600 hover:text-gray-800 p-1"
                      title="Edit fee"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onMarkUnpaid(admissionFee.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline"
                    >
                      Mark Unpaid
                    </button>
                    <Button
                      onClick={() => onOpenPayment(admissionFee.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      Add Payment
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenEdit(admissionFee)}
                  className="text-xs text-gray-600 hover:text-gray-800 p-1"
                  title="Edit fee"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <Button
                  onClick={() => onOpenPayment(admissionFee.id)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  Mark Paid
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

