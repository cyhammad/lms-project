'use client';

import { useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStorageUrl } from '@/lib/storage-url';
import { useStudentFormStore } from '@/stores/use-student-form-store';

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

export default function StepBasicInfo() {
  const {
    formData,
    errors,
    initialSessions,
    initialClasses,
    classSections,
    setFormField,
    clearError,
  } = useStudentFormStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 800, 0.7);
    setFormField('studentPhoto', compressed);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = () => {
    setFormField('studentPhoto', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClassChange = (classId: string) => {
    setFormField('classApplyingFor', classId);
    setFormField('sectionId', '');
    if (formData.discountType !== 'NONE') {
      setFormField('discountedFee', '');
    }
  };

  const photoSrc = getStorageUrl(formData.studentPhoto);

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${hasError ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Enter the student's essential details to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        {photoSrc ? (
          <div className="flex items-center gap-5">
            <div className="relative group flex-shrink-0">
              <img
                src={photoSrc}
                alt="Student preview"
                className="w-32 h-32 object-cover rounded-2xl border-2 border-gray-200 shadow-md"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all" />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  Change
                </span>
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Student Photo</p>
              <p className="text-xs text-gray-500 mt-0.5">Click the image to change or the X to remove</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-5 p-5 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#10b981] hover:bg-[#10b981]/[0.03] transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 flex-shrink-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center group-hover:from-[#10b981]/10 group-hover:to-[#10b981]/5 transition-colors">
              <Upload className="w-7 h-7 text-gray-300 group-hover:text-[#10b981] transition-colors" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Upload student photo</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG or PNG, max 5 MB</p>
            </div>
          </button>
        )}

        {/* Name + Email fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => {
                setFormField('firstName', e.target.value);
                if (errors.firstName) clearError('firstName');
              }}
              className={inputClass(!!errors.firstName)}
              placeholder="Enter first name"
            />
            {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => {
                setFormField('lastName', e.target.value);
                if (errors.lastName) clearError('lastName');
              }}
              className={inputClass(!!errors.lastName)}
              placeholder="Enter last name"
            />
            {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormField('email', e.target.value);
                if (errors.email) clearError('email');
              }}
              className={inputClass(!!errors.email)}
              placeholder="student@example.com"
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Academic fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session *</label>
            <select
              value={formData.academicSession}
              onChange={(e) => {
                setFormField('academicSession', e.target.value);
                if (errors.academicSession) clearError('academicSession');
              }}
              className={inputClass(!!errors.academicSession)}
            >
              <option value="">Select session</option>
              {initialSessions.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            {errors.academicSession && <p className="text-sm text-red-500 mt-1">{errors.academicSession}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={formData.classApplyingFor}
              onChange={(e) => {
                handleClassChange(e.target.value);
                if (errors.classApplyingFor) clearError('classApplyingFor');
              }}
              className={inputClass(!!errors.classApplyingFor)}
            >
              <option value="">Select class</option>
              {initialClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.grade}</option>
              ))}
            </select>
            {errors.classApplyingFor && <p className="text-sm text-red-500 mt-1">{errors.classApplyingFor}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
            <select
              value={formData.sectionId}
              onChange={(e) => {
                setFormField('sectionId', e.target.value);
                if (errors.sectionId) clearError('sectionId');
              }}
              disabled={!formData.classApplyingFor}
              className={`${inputClass(!!errors.sectionId)} disabled:bg-gray-100 disabled:cursor-not-allowed`}
            >
              <option value="">Select section</option>
              {classSections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.sectionId && <p className="text-sm text-red-500 mt-1">{errors.sectionId}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
