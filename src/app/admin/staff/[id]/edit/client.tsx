'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, User, Mail, Phone, Briefcase, Award, GraduationCap, Key, Lock, DollarSign, Camera, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { updateStaff } from '@/actions/staff';
import { useAlert } from '@/hooks/use-alert';
import { getStorageUrl } from '@/lib/storage-url';
import { PasswordInput } from '@/components/ui/password-input';
import type { Teacher, StaffType } from '@/types';

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

interface EditStaffClientProps {
  staff: Teacher;
}

export default function EditStaffClient({ staff }: EditStaffClientProps) {
  const router = useRouter();
  const { showError, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: staff.name,
    email: staff.email,
    phone: staff.phone || '',
    staffType: (staff.staffType || '') as StaffType | '',
    subjects: staff.subjects?.join(', ') || '',
    qualifications: staff.qualifications || '',
    experience: staff.experience?.toString() || '',
    monthlySalary: staff.monthlySalary?.toString() || '',
    photo: staff.photo || '',
    username: staff.username || '',
    password: '', // Don't load password
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.staffType) {
      newErrors.staffType = 'Staff type is required';
    }
    if (formData.staffType === 'TEACHER' && !formData.subjects.trim()) {
      newErrors.subjects = 'Subjects are required for teachers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const updates = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        staffType: formData.staffType || undefined,
        subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : undefined,
        qualifications: formData.qualifications.trim() || undefined,
        experience: formData.experience, // string, server handles conversion
        monthlySalary: formData.monthlySalary, // string, server handles conversion
        photo: formData.photo || undefined,
        username: formData.username.trim() || undefined,
        // Only include password if provided
        ...(formData.password ? { password: formData.password } : {}),
      };

      const result = await updateStaff(staff.id, updates);

      if (result.success) {
        router.push(ROUTES.ADMIN.STAFF);
      } else {
        showError(result.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff member:', error);
      showError('Failed to update staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AlertComponent />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Staff Member</h1>
        <p className="text-gray-600 mt-1">Update staff member information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Section - Left Side */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-green-50 to-slate-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Photo
                </CardTitle>
                <CardDescription>Upload a professional photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const compressed = await compressImage(file, 800, 0.7);
                    setFormData({ ...formData, photo: compressed });
                    if (photoInputRef.current) photoInputRef.current.value = '';
                  }}
                />
                <div className="flex flex-col items-center justify-center">
                  {(() => {
                    const photoSrc = getStorageUrl(formData.photo);
                    return photoSrc ? (
                      <div className="relative group">
                        <img
                          src={photoSrc}
                          alt="Staff preview"
                          className="w-40 h-40 object-cover rounded-full border-4 border-white shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, photo: '' });
                            if (photoInputRef.current) photoInputRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/30"
                        >
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                            <Camera className="w-3.5 h-3.5" />
                            Change
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-slate-700 flex items-center justify-center border-4 border-white shadow-lg cursor-pointer hover:from-green-500 hover:to-slate-800 transition-all group"
                      >
                        <div className="text-center">
                          <Upload className="w-10 h-10 text-white/80 group-hover:text-white mx-auto transition-colors" />
                          <p className="text-xs text-white/80 group-hover:text-white mt-1 font-medium">Upload</p>
                        </div>
                      </button>
                    );
                  })()}
                </div>
                {!formData.photo && (
                  <p className="text-xs text-gray-500 text-center">JPG or PNG, max 5 MB</p>
                )}
              </CardContent>
            </Card>

            {/* App Access Section */}
            <Card className="bg-gradient-to-br from-green-50 to-slate-50 border-green-200 mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  App Access
                </CardTitle>
                <CardDescription>Update login credentials for the staff member</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 placeholder-gray-400 text-sm"
                    placeholder="Enter username"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Leave blank to keep existing username</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    New Password
                  </label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 placeholder-gray-400 text-sm"
                    placeholder="Enter new password (leave blank to keep existing)"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Leave blank to keep existing password</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Fields - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Personal details of the staff member</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                        }`}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                        }`}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="staffType" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      Staff Type *
                    </label>
                    <select
                      id="staffType"
                      required
                      value={formData.staffType}
                      onChange={(e) => {
                        setFormData({ ...formData, staffType: e.target.value as StaffType });
                        if (errors.staffType) setErrors({ ...errors, staffType: '' });
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.staffType ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                        }`}
                    >
                      <option value="">Select staff type</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMINISTRATIVE">Administrative</option>
                      <option value="SUPPORT">Support</option>
                      <option value="SECURITY">Security</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="IT">IT</option>
                      <option value="FINANCE">Finance</option>
                      <option value="OTHER">Other</option>
                    </select>
                    {errors.staffType && <p className="text-sm text-red-500 mt-1">{errors.staffType}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Professional Details
                </CardTitle>
                <CardDescription>Qualifications and experience information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 placeholder-gray-400 text-sm"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="monthlySalary" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      Monthly Salary (PKR)
                    </label>
                    <input
                      type="number"
                      id="monthlySalary"
                      value={formData.monthlySalary}
                      onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 placeholder-gray-400 text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {formData.staffType === 'TEACHER' && (
                  <div>
                    <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      Subjects (comma-separated) *
                    </label>
                    <input
                      type="text"
                      id="subjects"
                      required
                      value={formData.subjects}
                      onChange={(e) => {
                        setFormData({ ...formData, subjects: e.target.value });
                        if (errors.subjects) setErrors({ ...errors, subjects: '' });
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.subjects ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                        }`}
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Separate multiple subjects with commas (required for teachers)
                    </p>
                    {errors.subjects && <p className="text-sm text-red-500 mt-1">{errors.subjects}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    Qualifications
                  </label>
                  <textarea
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 placeholder-gray-400 text-sm"
                    rows={3}
                    placeholder="e.g., B.A, M.Sc, Professional Certifications"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.ADMIN.STAFF)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Staff Member'}
          </Button>
        </div>
      </form>
    </div>
  );
}
