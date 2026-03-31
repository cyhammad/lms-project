'use client';

import { useState } from 'react';
import { Lock, Edit, Trash2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Teacher } from '@/types';

export interface StaffAccessRowProps {
  staff: Teacher;
  access: { username: string; isActive?: boolean; id: string } | null;
  onEdit: (staff: Teacher) => void;
  onDelete: (id: string, name: string) => void;
  onResetPassword: (staff: Teacher) => void;
  deletingId: string | null;
}

export const StaffAccessRow = ({
  staff,
  access,
  onEdit,
  onDelete,
  onResetPassword,
  deletingId,
}: StaffAccessRowProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {staff.photo && !imageError ? (
            <img
              src={staff.photo}
              alt={staff.name}
              className="w-9 h-9 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20">
              {staff.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">{staff.name}</p>
            <p className="text-xs text-slate-700">{staff.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        {staff.staffType ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
            {staff.staffType}
          </span>
        ) : (
          <span className="text-slate-800 text-sm">N/A</span>
        )}
      </td>
      <td className="py-3 px-4">
        {access ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{access.username}</p>
            <div className="flex items-center gap-1.5" title="Password is stored securely and cannot be displayed">
              <span className="text-xs text-slate-700 font-mono">••••••••</span>
              <Lock className="w-3 h-3 text-slate-800 shrink-0" />
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-800">No access configured</span>
        )}
      </td>
      <td className="py-3 px-4">
        {access ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${access.isActive
              ? 'bg-slate-50 text-slate-700'
              : 'bg-red-50 text-red-700'
              }`}
          >
            {access.isActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Inactive
              </>
            )}
          </span>
        ) : (
          <span className="text-sm text-slate-800">-</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-2">
          {access && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResetPassword(staff)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              title="Reset password"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(staff)}
            title={access ? 'Edit access' : 'Create access'}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {access && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(access.id, staff.name)}
              disabled={deletingId === access.id}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};
