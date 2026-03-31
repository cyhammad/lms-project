'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { AcademicSession, Class } from '@/types';

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'EARLY_YEARS', label: 'Early Years' },
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'MIDDLE', label: 'Middle' },
  { value: 'SECONDARY', label: 'Secondary' },
  { value: 'HIGHER_SECONDARY', label: 'Higher Secondary' },
  { value: 'O_A_LEVELS', label: 'O & A Levels' },
];

function normalizeEducationLevel(value: string | undefined | null): string {
  if (!value) return '';
  const option = EDUCATION_LEVEL_OPTIONS.find(
    (opt) => opt.value === value || opt.label === value,
  );
  return option ? option.value : value;
}

interface EditClassClientProps {
  classToEdit: Class;
  sessions: AcademicSession[];
}

export default function EditClassClient({ classToEdit, sessions }: EditClassClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: classToEdit.name,
    code: classToEdit.code,
    educationLevel: normalizeEducationLevel(classToEdit.educationLevel as unknown as string),
    grade: classToEdit.grade?.toString() ?? '',
    sessionId: classToEdit.sessionId || '',
    standardFee: classToEdit.standardFee ? classToEdit.standardFee.toString() : '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Class code is required';
    }
    if (!formData.educationLevel) {
      newErrors.educationLevel = 'Education level is required';
    }
    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    } else {
      const gradeNum = parseInt(formData.grade, 10);
      if (Number.isNaN(gradeNum) || gradeNum < 0 || gradeNum > 12) {
        newErrors.grade = 'Grade must be a number between 0 and 12';
      }
    }
    if (!formData.sessionId) {
      newErrors.sessionId = 'Academic session is required';
    }
    if (!formData.standardFee.trim()) {
      newErrors.standardFee = 'Standard fee is required';
    } else {
      const feeNum = parseFloat(formData.standardFee);
      if (Number.isNaN(feeNum) || feeNum < 0) {
        newErrors.standardFee = 'Standard fee must be a positive number';
      }
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
      const updates: Partial<Class> = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        // Backend expects enum in CAPS (e.g. EARLY_YEARS)
        educationLevel: formData.educationLevel as unknown as Class['educationLevel'],
        grade: parseInt(formData.grade, 10),
        sessionId: formData.sessionId || undefined,
        standardFee: parseFloat(formData.standardFee),
      };

      await apiClient<{ class: Class }>(`/classes/${classToEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      router.push(ROUTES.ADMIN.CLASSES);
      router.refresh();
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Class</h1>
        <p className="text-gray-600 mt-1">Update class information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>Update the details for this class</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Playgroup, Class 1, Class 9, O Level"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Code / Short Name *
                </label>
                <input
                  type="text"
                  id="code"
                  required
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value.toUpperCase() });
                    if (errors.code) setErrors({ ...errors, code: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., PG, C1, C9, O1"
                />
                {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="educationLevel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Education Level *
                </label>
                <select
                  id="educationLevel"
                  required
                  value={formData.educationLevel}
                  onChange={(e) => {
                    setFormData({ ...formData, educationLevel: e.target.value });
                    if (errors.educationLevel) setErrors({ ...errors, educationLevel: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.educationLevel ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select education level</option>
                  {EDUCATION_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.educationLevel && (
                  <p className="text-sm text-red-500 mt-1">{errors.educationLevel}</p>
                )}
              </div>

              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                  Grade / Numeric Level *
                </label>
                <input
                  type="number"
                  id="grade"
                  required
                  min="0"
                  max="12"
                  value={formData.grade}
                  onChange={(e) => {
                    setFormData({ ...formData, grade: e.target.value });
                    if (errors.grade) setErrors({ ...errors, grade: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.grade ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 0, 1, 2, ... 12"
                />
                {errors.grade && <p className="text-sm text-red-500 mt-1">{errors.grade}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Session *
                </label>
                <select
                  id="sessionId"
                  required
                  value={formData.sessionId}
                  onChange={(e) => {
                    setFormData({ ...formData, sessionId: e.target.value });
                    if (errors.sessionId) setErrors({ ...errors, sessionId: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.sessionId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select academic session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
                {errors.sessionId && (
                  <p className="text-sm text-red-500 mt-1">{errors.sessionId}</p>
                )}
                {sessions.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    No sessions found. Please create a session first.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="standardFee"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Standard Fee (Monthly) *
                </label>
                <input
                  type="number"
                  id="standardFee"
                  required
                  min="0"
                  step="0.01"
                  value={formData.standardFee}
                  onChange={(e) => {
                    setFormData({ ...formData, standardFee: e.target.value });
                    if (errors.standardFee) setErrors({ ...errors, standardFee: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.standardFee ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5000.00"
                />
                {errors.standardFee && (
                  <p className="text-sm text-red-500 mt-1">{errors.standardFee}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.ADMIN.CLASSES)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Class'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

