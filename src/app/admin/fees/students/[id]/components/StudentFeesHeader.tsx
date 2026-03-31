'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { Student } from '@/types';
import { getStorageUrl } from '@/lib/storage-url';

interface Props {
  student: Student;
  displayName: string;
  onOpenAddFee: () => void;
}

export function StudentFeesHeader({ student, displayName, onOpenAddFee }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.ADMIN.FEES.HISTORY}>
          <button className="text-gray-500 hover:text-gray-700 p-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <Link href={ROUTES.ADMIN.STUDENTS_VIEW(student.id)}>
          {student.studentPhoto ? (
            <img
              src={getStorageUrl(student.studentPhoto) || undefined}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-green-500 hover:ring-offset-2 transition-all"
              title="View Student"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 cursor-pointer hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:bg-gray-300 transition-all"
              title="View Student"
            >
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
          <p className="text-xs text-gray-500">Fee Management</p>
        </div>
      </div>
      <Button onClick={onOpenAddFee} size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add Fee
      </Button>
    </div>
  );
}

