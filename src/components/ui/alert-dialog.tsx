'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
}

const AlertDialog = ({
  open,
  onClose,
  type,
  title,
  message,
  confirmText = 'OK',
}: AlertDialogProps) => {
  const iconConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-slate-800',
      iconBg: 'bg-slate-50',
      titleColor: 'text-slate-800',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      titleColor: 'text-red-600',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      titleColor: 'text-amber-600',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      titleColor: 'text-blue-600',
    },
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 py-2">
            <div className={cn('p-2 rounded-xl flex-shrink-0', config.iconBg)}>
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <DialogTitle className={cn('text-xl', config.titleColor)}>
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base text-slate-800">
          {message}
        </DialogDescription>
        <DialogFooter className="mt-4 sm:justify-end">
          <Button
            onClick={onClose}
            variant={type === 'error' || type === 'warning' ? 'destructive' : 'default'}
            className={cn('px-8', (type === 'error' || type === 'warning') && 'bg-red-600 hover:bg-red-700')}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { AlertDialog };
