'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { SchoolPolicyType } from '@/types';

type SessionUser = { schoolId?: string; userId?: string; id?: string };

interface CreateSchoolPolicyClientProps {
  user: SessionUser;
}

export default function CreateSchoolPolicyClient({ user }: CreateSchoolPolicyClientProps) {
  const router = useRouter();
  const { showError, showSuccess, AlertComponent } = useAlert();

  const [formData, setFormData] = useState({
    title: '',
    type: 'General' as SchoolPolicyType,
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || (!user?.userId && !user?.id)) {
      return;
    }


    try {
      await apiClient('/policies/school', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: user.schoolId,
          title: formData.title.trim(),
          type: formData.type,
          description: formData.description.trim(),
          createdBy: user.userId || user.id,
          isActive: formData.isActive,
        }),
      });

      showSuccess('School policy created successfully');
      router.push(ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES);
    } catch (error) {
      console.error('Error creating school policy via API:', error);
      showError('Failed to create policy');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create School Policy</h1>
            <p className="text-slate-700 mt-1">Define a new policy for your school</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Policy Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                  placeholder="e.g., Grading Policy, Attendance Policy"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Policy Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SchoolPolicyType })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                >
                  <option value="Grading">Grading</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Discipline">Discipline</option>
                  <option value="Academic">Academic</option>
                  <option value="General">General</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Policy Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white resize-none"
                  placeholder="Enter the full policy description and details..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
                <p className="text-xs text-slate-700 mt-1">
                  {formData.description.length} characters (minimum 10)
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-slate-800 rounded focus:ring-slate-700"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Set as active policy
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Create Policy
                </Button>
                <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <AlertComponent />
    </>
  );
}

