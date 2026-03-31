import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

interface FeesStatsProps {
  total: number;
  paid: number;
  unpaid: number;
  partial: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  formatCurrency: (amount: number) => string;
}

export function FeesStats({
  total,
  paid,
  unpaid,
  partial,
  totalAmount,
  paidAmount,
  outstandingAmount,
  formatCurrency,
}: FeesStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700">Total Fees</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
              <p className="text-xs text-slate-700 mt-1">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700">Collected</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{paid}</p>
              <p className="text-xs text-slate-700 mt-1">{formatCurrency(paidAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-slate-800" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700">Unpaid</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{unpaid}</p>
              <p className="text-xs text-slate-700 mt-1">{partial} partial</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(outstandingAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

