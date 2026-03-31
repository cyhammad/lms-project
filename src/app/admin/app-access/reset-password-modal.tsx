'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Key, RotateCcw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResetPasswordModalProps {
  name: string;
  identifier: string;
  onClose: () => void;
  onReset: (newPassword: string) => Promise<void>;
}

export const ResetPasswordModal = ({
  name,
  identifier,
  onClose,
  onReset,
}: ResetPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) return;
    setSaving(true);
    try {
      await onReset(password);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 min-w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reset Password</h2>
              <p className="text-sm text-slate-700">{name}</p>
            </div>
          </div>
          {identifier && (
            <p className="text-xs text-slate-800 mt-2">{identifier}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800">
              This will immediately change the password. The user will need to use the new
              password on their next login. No email notification will be sent.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white pr-10"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-800 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!password}
                title="Copy to clipboard"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-slate-700" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
                title="Generate random password"
                className="shrink-0"
              >
                <Key className="w-4 h-4" />
              </Button>
            </div>
            {password && password.length < 6 && (
              <p className="text-xs text-red-500 mt-1.5">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              disabled={saving || !password.trim() || password.length < 6}
            >
              {saving ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
