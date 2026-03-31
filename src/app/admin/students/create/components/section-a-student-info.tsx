'use client';

import { useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBForm } from '@/lib/validation';
import { getStorageUrl } from '@/lib/storage-url';
import type { Gender, Religion } from '@/types';
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

export default function SectionAStudentInfo() {
  const {
    formData,
    errors,
    setFormField,
    clearError,
  } = useStudentFormStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBForm(e.target.value);
    setFormField('bFormCrc', formatted);
    if (errors.bFormCrc) clearError('bFormCrc');
  };

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

  const photoSrc = getStorageUrl(formData.studentPhoto);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Section A: Student Information</CardTitle>
        <CardDescription>Personal details of the student</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => {
                setFormField('firstName', e.target.value);
                if (errors.firstName) clearError('firstName');
              }}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
              placeholder="Enter first name"
            />
            {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => {
                setFormField('lastName', e.target.value);
                if (errors.lastName) clearError('lastName');
              }}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
              placeholder="Enter last name"
            />
            {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormField('email', e.target.value);
              if (errors.email) clearError('email');
            }}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            placeholder="student@example.com"
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormField('gender', e.target.value as Gender)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => {
                setFormField('dateOfBirth', e.target.value);
                if (errors.dateOfBirth) clearError('dateOfBirth');
              }}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
            <input
              type="text"
              value={formData.placeOfBirth}
              onChange={(e) => setFormField('placeOfBirth', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
              placeholder="City, Province"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => setFormField('nationality', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
              placeholder="Pakistani"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
            <select
              value={formData.religion}
              onChange={(e) => {
                const value = e.target.value as Religion | '';
                setFormField('religion', value);
                setFormField('religionOther', value !== 'Other' ? '' : formData.religionOther);
              }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
            >
              <option value="">Select religion</option>
              <option value="Islam">Islam</option>
              <option value="Christian">Christian</option>
              <option value="Hindu">Hindu</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.religion === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specify Religion *</label>
              <input
                type="text"
                required
                value={formData.religionOther}
                onChange={(e) => setFormField('religionOther', e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.religionOther ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
                placeholder="Enter religion"
              />
              {errors.religionOther && <p className="text-sm text-red-500 mt-1">{errors.religionOther}</p>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">B-Form/CRC Number *</label>
          <input
            type="text"
            required
            value={formData.bFormCrc}
            onChange={handleBFormChange}
            maxLength={15}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.bFormCrc ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            placeholder="#####-#######-#"
          />
          {errors.bFormCrc && <p className="text-sm text-red-500 mt-1">{errors.bFormCrc}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          {photoSrc ? (
            <div className="flex items-start gap-4">
              <div className="relative group">
                <img
                  src={photoSrc}
                  alt="Student preview"
                  className="w-28 h-28 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#10b981] bg-[#10b981]/10 hover:bg-[#10b981]/20 rounded-lg transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#10b981] hover:bg-[#10b981]/5 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 min-w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
              </div>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="specialNeeds"
              checked={formData.specialNeeds}
              onChange={(e) => {
                setFormField('specialNeeds', e.target.checked);
                setFormField('specialNeedsDetails', e.target.checked ? formData.specialNeedsDetails : '');
              }}
              className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981]"
            />
            <label htmlFor="specialNeeds" className="text-sm font-medium text-gray-700">
              Has Special Needs
            </label>
          </div>
          {formData.specialNeeds && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs Details *</label>
              <textarea
                required
                value={formData.specialNeedsDetails}
                onChange={(e) => setFormField('specialNeedsDetails', e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.specialNeedsDetails ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
                rows={3}
                placeholder="Describe special needs requirements"
              />
              {errors.specialNeedsDetails && <p className="text-sm text-red-500 mt-1">{errors.specialNeedsDetails}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

