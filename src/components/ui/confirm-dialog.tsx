'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
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

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

const ConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) => {
  const isDestructive = variant === 'destructive';

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 py-2">
            <div className={cn('p-2 rounded-xl flex-shrink-0', isDestructive ? 'bg-red-50' : 'bg-amber-50')}>
              <AlertTriangle className={cn('w-5 h-5', isDestructive ? 'text-red-600' : 'text-amber-600')} />
            </div>
            <DialogTitle className={cn('text-xl', isDestructive ? 'text-red-600' : 'text-amber-600')}>
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base text-slate-800">
          {message}
          {isDestructive && (
            <span className="block mt-2 text-xs font-medium text-red-500 uppercase tracking-wider">
              This action cannot be undone
            </span>
          )}
        </DialogDescription>
        <DialogFooter className="mt-4 gap-2 sm:justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="px-6"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={isDestructive ? 'destructive' : 'default'}
            className={cn('px-6', isDestructive && 'bg-red-600 hover:bg-red-700')}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ConfirmDialog };
