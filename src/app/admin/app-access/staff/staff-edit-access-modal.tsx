'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Teacher } from '@/types';

export interface StaffEditAccessModalProps {
  staff: Teacher | null;
  access: { username: string; isActive?: boolean; id: string } | null;
  onClose: () => void;
  onSave: (username: string, password: string, isActive: boolean) => void;
  isEditing: boolean;
}

export const StaffEditAccessModal = ({
  staff,
  access,
  onClose,
  onSave,
  isEditing,
}: StaffEditAccessModalProps) => {
  const [username, setUsername] = useState(access?.username || '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(access?.isActive ?? true);
  const [showPassword, setShowPassword] = useState(false);

  if (!staff) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    // When editing, password is optional (blank = keep the existing password unchanged)
    if (!isEditing && !password.trim()) return;
    onSave(username.trim(), password, isActive);
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit App Access' : 'Create App Access'}
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            {staff.name} — {staff.email}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password {isEditing ? <span className="text-slate-800 font-normal">(leave blank to keep current)</span> : '*'}
            </label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
                required={!isEditing}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
                title="Generate random password"
              >
                <Key className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="staff-isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-700"
            />
            <label htmlFor="staff-isActive" className="text-sm text-slate-700">
              Active (allow login)
            </label>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Update Access' : 'Create Access'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
