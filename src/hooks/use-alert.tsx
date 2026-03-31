'use client';

import { useState, useCallback, useRef } from 'react';
import { AlertDialog, AlertType } from '@/components/ui/alert-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface AlertState {
  open: boolean;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

type ConfirmResolver = (value: boolean) => void;

export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    type: 'info',
    title: '',
    message: '',
  });

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
  });

  const confirmResolverRef = useRef<ConfirmResolver | null>(null);

  const showAlert = useCallback((
    type: AlertType,
    title: string,
    message: string,
    confirmText?: string
  ) => {
    setAlertState({
      open: true,
      type,
      title,
      message,
      confirmText,
    });
  }, []);

  const showSuccess = useCallback((message: string, title: string = 'Success') => {
    showAlert('success', title, message);
  }, [showAlert]);

  const showError = useCallback((message: string, title: string = 'Error') => {
    showAlert('error', title, message);
  }, [showAlert]);

  const showWarning = useCallback((message: string, title: string = 'Warning') => {
    showAlert('warning', title, message);
  }, [showAlert]);

  const showInfo = useCallback((message: string, title: string = 'Information') => {
    showAlert('info', title, message);
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, open: false }));
  }, []);

  const showConfirm = useCallback((
    message: string,
    title: string = 'Confirm Action',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    variant: 'default' | 'destructive' = 'default'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(true);
      confirmResolverRef.current = null;
    }
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
      confirmResolverRef.current = null;
    }
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  const AlertComponent = () => (
    <AlertDialog
      open={alertState.open}
      onClose={closeAlert}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      confirmText={alertState.confirmText}
    />
  );

  const ConfirmComponent = () => (
    <ConfirmDialog
      open={confirmState.open}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title={confirmState.title}
      message={confirmState.message}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      variant={confirmState.variant}
    />
  );

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    closeAlert,
    AlertComponent,
    ConfirmComponent,
  };
}
