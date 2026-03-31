'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Upload, Briefcase, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getStorageUrl } from '@/lib/storage-url';
import { updateStaff } from '@/actions/staff';
import { toast } from 'sonner';

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

interface StaffPhotoCardProps {
  staffId: string;
  staffPhoto: string | null;
  staffName: string;
  staffEmail: string;
  staffType?: string;
}

export default function StaffPhotoCard({
  staffId,
  staffPhoto,
  staffName,
  staffEmail,
  staffType,
}: StaffPhotoCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(staffPhoto);

  const photoSrc = getStorageUrl(currentPhoto);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const result = await updateStaff(staffId, { photo: compressed });
      if (result.success) {
        toast.success('Photo updated successfully');
        setCurrentPhoto(compressed);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to upload photo');
      }
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      const result = await updateStaff(staffId, { photo: '' });
      if (result.success) {
        toast.success('Photo removed');
        setCurrentPhoto(null);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to remove photo');
      }
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-slate-50 border-green-200">
      <CardContent className="pt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        <div className="flex justify-center">
          {photoSrc ? (
            <div className="relative group">
              <img
                src={photoSrc}
                alt={staffName}
                className="w-32 h-32 rounded-full object-cover border-4 border-green-200 shadow-lg"
              />
              {!uploading && (
                <>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/30"
                  >
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                      <Camera className="w-3.5 h-3.5" />
                      Change
                    </span>
                  </button>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-slate-800 flex items-center justify-center shadow-lg cursor-pointer hover:from-green-600 hover:to-slate-700 transition-all group disabled:opacity-70"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-white/80 group-hover:text-white mx-auto transition-colors" />
                    <p className="text-[10px] text-white/80 group-hover:text-white mt-1 font-medium">Add Photo</p>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">{staffName}</h3>
          <p className="text-sm text-gray-500 mt-1">{staffEmail}</p>
          {staffType && (
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                {staffType}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
