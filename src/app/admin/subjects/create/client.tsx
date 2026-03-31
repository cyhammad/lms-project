'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { createSubject } from '@/actions/subjects';
import type { Class } from '@/types';

interface CreateSubjectClientProps {
  classes: Class[];
}

export default function CreateSubjectClient({ classes }: CreateSubjectClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    totalMarks: '',
    passingPercentage: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Subject name is required';
    if (!formData.classId) newErrors.classId = 'Please select a class';
    if (!formData.totalMarks) {
      newErrors.totalMarks = 'Total marks is required';
    } else if (parseInt(formData.totalMarks) <= 0) {
      newErrors.totalMarks = 'Total marks must be greater than 0';
    }
    if (!formData.passingPercentage) {
      newErrors.passingPercentage = 'Passing percentage is required';
    } else {
      const percentage = parseFloat(formData.passingPercentage);
      if (percentage < 0 || percentage > 100) {
        newErrors.passingPercentage = 'Passing percentage must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('classId', formData.classId);
      submitData.append('totalMarks', formData.totalMarks);
      submitData.append('passingPercentage', formData.passingPercentage);
      if (formData.description) submitData.append('description', formData.description.trim());

      const result = await createSubject(submitData);

      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      router.push(ROUTES.ADMIN.SUBJECTS);
      router.refresh();
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Failed to create subject. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Subject</h1>
        <p className="text-gray-600 mt-1">Add a new subject to a class</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject Information</CardTitle>
          <CardDescription>Enter the details for the new subject</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
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
                  placeholder="e.g., Mathematics, Science"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Class *
                </label>
                <select
                  id="classId"
                  required
                  value={formData.classId}
                  onChange={(e) => {
                    setFormData({ ...formData, classId: e.target.value });
                    if (errors.classId) setErrors({ ...errors, classId: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.classId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code}) - {cls.grade}
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="text-sm text-red-500 mt-1">{errors.classId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Marks *
                </label>
                <input
                  type="number"
                  id="totalMarks"
                  required
                  value={formData.totalMarks}
                  onChange={(e) => {
                    setFormData({ ...formData, totalMarks: e.target.value });
                    if (errors.totalMarks) setErrors({ ...errors, totalMarks: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.totalMarks ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 100"
                  min="1"
                />
                {errors.totalMarks && <p className="text-sm text-red-500 mt-1">{errors.totalMarks}</p>}
              </div>

              <div>
                <label htmlFor="passingPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Percentage *
                </label>
                <input
                  type="number"
                  id="passingPercentage"
                  required
                  value={formData.passingPercentage}
                  onChange={(e) => {
                    setFormData({ ...formData, passingPercentage: e.target.value });
                    if (errors.passingPercentage) setErrors({ ...errors, passingPercentage: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.passingPercentage ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 40"
                  min="0"
                  max="100"
                  step="0.1"
                />
                {errors.passingPercentage && <p className="text-sm text-red-500 mt-1">{errors.passingPercentage}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                rows={3}
                placeholder="Optional description of the subject"
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.ADMIN.SUBJECTS)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
