'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types';

export interface EditParentAccessModalProps {
  student: Student | null;
  access: { username: string; password: string; isActive: boolean; id: string } | null;
  onClose: () => void;
  onSave: (username: string, password: string, isActive: boolean) => void;
  isEditing: boolean;
}

export const EditParentAccessModal = ({
  student,
  access,
  onClose,
  onSave,
  isEditing,
}: EditParentAccessModalProps) => {
  const [username, setUsername] = useState(access?.username || '');
  const [password, setPassword] = useState(access?.password || '');
  const [isActive, setIsActive] = useState(access?.isActive ?? true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return;
    }
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
  };

  if (!student) return null;

  const studentName =
    student.name ||
    `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
    'Unknown';
  const primaryContact = student.primaryContact || 'Father';
  const parentName =
    primaryContact === 'Father'
      ? student.fatherName
      : student.motherName || student.fatherName || 'N/A';
  const parentMobile =
    primaryContact === 'Father'
      ? student.fatherMobile
      : student.motherMobile || student.fatherMobile || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit App Access' : 'Create App Access'}
          </h2>
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium text-slate-900">{studentName}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${primaryContact === 'Father'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-pink-50 text-pink-700'
                  }`}
              >
                {primaryContact === 'Father' ? 'Father' : 'Mother'}
              </span>
              <span className="text-sm text-slate-800">{parentName}</span>
              {parentMobile && parentMobile !== 'N/A' && (
                <span className="text-xs text-slate-700">• {parentMobile}</span>
              )}
            </div>
          </div>
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
              Password *
            </label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                placeholder="Enter password"
                required
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
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-700"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
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

