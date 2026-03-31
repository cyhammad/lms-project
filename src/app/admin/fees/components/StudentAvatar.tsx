import { useState } from 'react';
import type { Student } from '@/types';
import { getStorageUrl } from '@/lib/storage-url';

interface StudentAvatarProps {
  student: Student | undefined;
  displayName: string;
}

export function StudentAvatar({ student, displayName }: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const photoUrl = getStorageUrl(student?.studentPhoto);

  if (photoUrl && !imageError) {
    return (
      <img
        src={photoUrl}
        alt={displayName}
        className="w-8 h-8 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-800 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-slate-700/20">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

