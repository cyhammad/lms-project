'use client';

import { useState } from 'react';
import { Eye, EyeOff, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types';
import { getStorageUrl } from '@/lib/storage-url';

export interface ParentAccessRowProps {
  student: Student;
  access: { username: string; password: string; isActive: boolean; id: string } | null;
  onEdit: (
    student: Student,
    access: { username: string; password: string; isActive: boolean; id: string } | null,
  ) => void;
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
}

export const ParentAccessRow = ({
  student,
  access,
  onEdit,
  onDelete,
  deletingId,
}: ParentAccessRowProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [imageError, setImageError] = useState(false);

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
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {student.studentPhoto && !imageError ? (
            <img
              src={getStorageUrl(student.studentPhoto) || undefined}
              alt={studentName}
              className="w-9 h-9 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-slate-800 to-slate-800 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-slate-700/20">
              {studentName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">{studentName}</p>
            <p className="text-xs text-slate-700">
              {student.studentId || student.bFormCrc || 'N/A'}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${primaryContact === 'Father'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-pink-50 text-pink-700'
                }`}
            >
              {primaryContact === 'Father' ? 'Father' : 'Mother'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{parentName}</p>
            <p className="text-xs text-slate-700 mt-0.5">{parentMobile}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        {access ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {access.username}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-800 font-mono">
                {showPassword ? access.password : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-800 hover:text-slate-800 transition-colors"
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
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
          <Button variant="outline" size="sm" onClick={() => onEdit(student, access)}>
            <Edit className="w-4 h-4 mr-1.5" />
            {access ? 'Edit' : 'Create'}
          </Button>
          {access && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(access.id, studentName)}
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

