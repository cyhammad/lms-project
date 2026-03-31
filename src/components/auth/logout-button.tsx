'use client';

import { useState } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { logout as logoutAction } from '@/actions/auth';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function LogoutConfirmDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleLogout = async () => {
    onOpenChange(false);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('edflo_session');
    }

    await logoutAction();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 py-2">
            <div className="p-2 rounded-xl bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Confirm Logout</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base text-slate-800">
          Are you sure you want to logout? You will be logged out of your account and redirected to the login page.
        </DialogDescription>
        <DialogFooter className="mt-4 gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="px-6 bg-red-600 hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LogoutButtonProps {
  collapsed?: boolean;
  className?: string;
  variant?: 'admin' | 'super-admin' | 'menu';
  user?: any;
  /** Called when the user clicks the logout trigger (e.g. close a parent menu first) */
  onTriggerClick?: () => void;
}

export function LogoutButton({ collapsed, className, variant = 'admin', user, onTriggerClick }: LogoutButtonProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const defaultStyles =
    variant === 'admin'
      ? 'text-slate-800 hover:text-red-400 hover:bg-red-500/10'
      : variant === 'menu'
        ? 'text-slate-700 hover:bg-slate-50 hover:text-red-600'
        : 'text-[#94a3b8] hover:bg-white/10 hover:text-white';

  return (
    <>
      <motion.div whileTap={{ scale: 0.98 }}>
        <button
          type="button"
          onClick={() => {
            onTriggerClick?.();
            setShowLogoutDialog(true);
          }}
          className={cn(
            'group flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
            variant === 'menu' ? 'rounded-lg' : 'rounded-xl',
            defaultStyles,
            className
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="whitespace-nowrap"
            >
              Logout
            </motion.span>
          )}
        </button>
      </motion.div>

      <LogoutConfirmDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} />
    </>
  );
}
