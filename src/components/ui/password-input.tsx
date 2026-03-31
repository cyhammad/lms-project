'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<'input'>, 'type'>
>(function PasswordInput({ className, autoComplete, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        spellCheck={false}
        className={cn('lms-password-field', className, 'pr-11')}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700/40"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
