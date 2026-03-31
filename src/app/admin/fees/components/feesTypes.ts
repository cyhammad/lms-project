import type { PaymentStatus, FeeType } from '@/types';

export type BackendPaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export type BackendFeeType =
  | 'ADMISSION'
  | 'MONTHLY_TUITION'
  | 'FINE'
  | 'TRANSPORT'
  | 'LIBRARY'
  | 'SPORTS'
  | 'LAB'
  | 'OTHER';

export interface BackendStudentFeePayment {
  id: string;
  studentId: string;
  feeType: BackendFeeType;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  dueDate: string;
  status: BackendPaymentStatus;
  paidAmount?: number | null;
  paymentDate?: string | null;
  month?: number | null;
  year?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendFeesListResponse {
  fees: BackendStudentFeePayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const mapBackendStatusToFrontend = (
  status: BackendPaymentStatus,
): PaymentStatus => {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'UNPAID':
      return 'Unpaid';
    case 'PARTIAL':
    default:
      return 'Partial';
  }
};

export const mapBackendFeeTypeToFrontend = (type: BackendFeeType): FeeType => {
  switch (type) {
    case 'ADMISSION':
      return 'Admission';
    case 'MONTHLY_TUITION':
      return 'MonthlyTuition';
    case 'FINE':
      return 'Fine';
    case 'TRANSPORT':
      return 'Transport';
    case 'LIBRARY':
      return 'Library';
    case 'SPORTS':
      return 'Sports';
    case 'LAB':
      return 'Lab';
    case 'OTHER':
    default:
      return 'Other';
  }
};

