'use client';

import { useRef, useState } from 'react';
import { Camera, GraduationCap, Upload, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getStorageUrl } from '@/lib/storage-url';
import { updateStudent } from '@/actions/students';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface StudentPhotoCardProps {
  studentId: string;
  studentPhoto: string | null;
  displayName: string;
  studentIdentifier: string;
  isActive: boolean;
}

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function StudentPhotoCard({
  studentId,
  studentPhoto,
  displayName,
  studentIdentifier,
  isActive,
}: StudentPhotoCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(studentPhoto);

  const photoSrc = getStorageUrl(currentPhoto);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      setCurrentPhoto(compressed);

      const result = await updateStudent(studentId, { studentPhoto: compressed });
      if (result.success) {
        toast.success('Photo updated successfully');
        router.refresh();
      } else {
        setCurrentPhoto(studentPhoto);
        toast.error(result.error || 'Failed to update photo');
      }
    } catch {
      setCurrentPhoto(studentPhoto);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    const previous = currentPhoto;
    setCurrentPhoto(null);
    try {
      const result = await updateStudent(studentId, { studentPhoto: '' });
      if (result.success) {
        toast.success('Photo removed');
        router.refresh();
      } else {
        setCurrentPhoto(previous);
        toast.error(result.error || 'Failed to remove photo');
      }
    } catch {
      setCurrentPhoto(previous);
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />

        <div className="flex justify-center">
          {photoSrc ? (
            <div className="relative group">
              <img
                src={photoSrc}
                alt={displayName}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              {!uploading && (
                <>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#10b981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center shadow-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative group">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow disabled:cursor-wait"
              >
                {uploading ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <>
                    <GraduationCap className="w-12 h-12 text-white" />
                    <span className="flex items-center gap-1 mt-1.5 text-[11px] font-medium text-white/90">
                      <Upload className="w-3 h-3" />
                      Add Photo
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
          <p className="text-sm text-gray-500">{studentIdentifier}</p>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
