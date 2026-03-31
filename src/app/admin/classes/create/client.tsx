'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { createClass } from '@/actions/classes';
import type { AcademicSession, EducationLevel } from '@/types';
import { useAdminSession } from '@/contexts/AdminSessionContext';

const EDUCATION_LEVELS: EducationLevel[] = ['Early Years', 'Primary', 'Middle', 'Secondary', 'Higher Secondary', 'O & A Levels'];

interface CreateClassClientProps {
  sessions: AcademicSession[];
}

export default function CreateClassClient({ sessions }: CreateClassClientProps) {
  const router = useRouter();
  const { sessionId: globalSessionId } = useAdminSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    educationLevel: '' as EducationLevel | '',
    grade: '',
    sessionId: '',
    standardFee: '',
    subject: '', // Optional
    maxStudents: '', // Optional
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (globalSessionId && !formData.sessionId) {
      setFormData((prev) => ({ ...prev, sessionId: globalSessionId }));
    }
  }, [globalSessionId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Class name is required';
    if (!formData.code.trim()) newErrors.code = 'Class code is required';
    if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    } else {
      const gradeNum = parseInt(formData.grade);
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 12) {
        newErrors.grade = 'Grade must be a number between 0 and 12';
      }
    }
    if (!formData.sessionId) newErrors.sessionId = 'Academic session is required';
    if (!formData.standardFee.trim()) {
      newErrors.standardFee = 'Standard fee is required';
    } else {
      const feeNum = parseFloat(formData.standardFee);
      if (isNaN(feeNum) || feeNum < 0) {
        newErrors.standardFee = 'Standard fee must be a positive number';
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
      submitData.append('code', formData.code.trim().toUpperCase());
      const educationLevelMap: Record<string, string> = {
        'Early Years': 'EARLY_YEARS',
        'Primary': 'PRIMARY',
        'Middle': 'MIDDLE',
        'Secondary': 'SECONDARY',
        'Higher Secondary': 'HIGHER_SECONDARY',
        'O & A Levels': 'O_A_LEVELS',
      };

      submitData.append('educationLevel', educationLevelMap[formData.educationLevel] || formData.educationLevel);
      submitData.append('grade', formData.grade);
      submitData.append('sessionId', formData.sessionId);
      submitData.append('standardFee', formData.standardFee);
      // Optional fields
      if (formData.subject) submitData.append('subject', formData.subject);
      if (formData.maxStudents) submitData.append('maxStudents', formData.maxStudents);

      const result = await createClass(submitData);

      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      router.push(ROUTES.ADMIN.CLASSES);
      router.refresh();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
        <p className="text-gray-600 mt-1">Add a new class to your school</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>Enter the details for the new class</CardDescription>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., PG, C1, C9, O1"
                />
                {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Education Level *
                </label>
                <select
                  id="educationLevel"
                  required
                  value={formData.educationLevel}
                  onChange={(e) => {
                    setFormData({ ...formData, educationLevel: e.target.value as EducationLevel });
                    if (errors.educationLevel) setErrors({ ...errors, educationLevel: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select education level</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                {errors.educationLevel && <p className="text-sm text-red-500 mt-1">{errors.educationLevel}</p>}
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.grade ? 'border-red-500' : 'border-gray-300'
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.sessionId ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select academic session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
                {errors.sessionId && <p className="text-sm text-red-500 mt-1">{errors.sessionId}</p>}
                {sessions.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    No sessions found. Please create a session first.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="standardFee" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.standardFee ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., 5000.00"
                />
                {errors.standardFee && <p className="text-sm text-red-500 mt-1">{errors.standardFee}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Students (Optional)
                </label>
                <input
                  type="number"
                  id="maxStudents"
                  min="1"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Stream (Optional)
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="e.g., Pre-Medical, Computer Science"
                />
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
                {loading ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
