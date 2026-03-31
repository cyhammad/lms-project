import Link from 'next/link';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

interface FeesHeaderProps {
  paymentsCount: number;
  deleting: boolean;
  onDeleteAll: () => void;
}

export function FeesHeader({ paymentsCount, deleting, onDeleteAll }: FeesHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">View Challans</h1>
        <p className="text-slate-700 mt-1">View and manage all generated challans</p>
      </div>
      <div className="flex items-center gap-3">
        {paymentsCount > 0 && (
          <Button
            variant="outline"
            onClick={onDeleteAll}
            disabled={deleting}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete All'}
          </Button>
        )}
        <Link href={ROUTES.ADMIN.FEES.GENERATE}>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Generate Fees
          </Button>
        </Link>
      </div>
    </div>
  );
}

