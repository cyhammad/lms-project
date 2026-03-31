'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Users, UserCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeachers } from '@/hooks/use-teachers';
import { useUsers } from '@/hooks/use-users';
import { useStudents } from '@/hooks/use-students';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import type { AnnouncementRecipientType } from '@/types';
import { createAnnouncement } from '@/actions/announcements';

type CreateAnnouncementUser = { schoolId?: string };

export default function CreateAnnouncementClient({ user }: { user: CreateAnnouncementUser }) {
  const router = useRouter();
  const { teachers } = useTeachers();
  const { users } = useUsers();
  const { students } = useStudents();
  const { showSuccess, showError, AlertComponent } = useAlert();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<AnnouncementRecipientType>('all');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter users/teachers/students by school
  const schoolTeachers = user?.schoolId
    ? teachers.filter((t) => t.schoolId === user.schoolId && t.isActive)
    : teachers.filter((t) => t.isActive);

  const schoolParents = user?.schoolId
    ? users.filter((u) => u.role === 'parent' && u.schoolId === user.schoolId)
    : users.filter((u) => u.role === 'parent');

  const schoolStudents = user?.schoolId
    ? students.filter((s) => s.schoolId === user.schoolId && s.isActive)
    : students.filter((s) => s.isActive);

  const handleRecipientTypeChange = (type: AnnouncementRecipientType) => {
    setRecipientType(type);
    setSelectedRecipientIds([]); // Clear selections when changing type
  };

  const toggleRecipientSelection = (id: string) => {
    setSelectedRecipientIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((recipientId) => recipientId !== id);
      }
      return [...prev, id];
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (recipientType === 'specific' && selectedRecipientIds.length === 0) {
      newErrors.recipients = 'Please select at least one recipient';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user?.schoolId) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('message', message.trim());
      formData.append('recipientType', recipientType);
      if (recipientType === 'specific' && selectedRecipientIds.length > 0) {
        formData.append('recipientIds', selectedRecipientIds.join(','));
      }

      const result = await createAnnouncement(formData);

      if (result.error) {
        showError(result.error);
        setLoading(false);
        return;
      }

      showSuccess('Announcement created successfully!');
      setTimeout(() => {
        router.push(ROUTES.ADMIN.ANNOUNCEMENTS);
        router.refresh();
      }, 800);
    } catch (error) {
      console.error('Error creating announcement:', error);
      showError('Failed to create announcement. Please try again.');
      setLoading(false);
    }
  };

  const getAvailableRecipients = () => {
    switch (recipientType) {
      case 'teachers':
        return schoolTeachers.map((t) => ({ id: t.id, name: t.name, email: t.email }));
      case 'parents':
        return schoolParents.map((p) => ({ id: p.id, name: p.name, email: p.email }));
      case 'students':
        return schoolStudents.map((s) => ({
          id: s.id,
          name: s.name || `${s.firstName} ${s.lastName}`.trim(),
          email: s.email || 'N/A',
        }));
      case 'specific': {
        const allRecipients: Array<{ id: string; name: string; email: string; type: string }> =
          [];
        schoolTeachers.forEach((t) =>
          allRecipients.push({ id: t.id, name: t.name, email: t.email, type: 'Teacher' }),
        );
        schoolParents.forEach((p) =>
          allRecipients.push({ id: p.id, name: p.name, email: p.email, type: 'Parent' }),
        );
        schoolStudents.forEach((s) =>
          allRecipients.push({
            id: s.id,
            name: s.name || `${s.firstName} ${s.lastName}`.trim(),
            email: s.email || 'N/A',
            type: 'Student',
          }),
        );
        return allRecipients;
      }
      default:
        return [];
    }
  };

  const availableRecipients = getAvailableRecipients();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.ANNOUNCEMENTS}>
            <button className="text-gray-500 hover:text-gray-700 p-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Announcement</h1>
            <p className="text-slate-700 mt-1">
              Send notifications to teachers, parents, students, or everyone
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Announcement Details */}
          <Card>
            <CardHeader>
              <CardTitle>Announcement Details</CardTitle>
              <CardDescription>
                Enter the title and message for your announcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  placeholder="Enter announcement title"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all ${errors.title ? 'border-red-300' : 'border-slate-200'
                    }`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
                  }}
                  placeholder="Enter announcement message"
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all resize-none ${errors.message ? 'border-red-300' : 'border-slate-200'
                    }`}
                />
                {errors.message && (
                  <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recipient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose who should receive this announcement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Recipient Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('all')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${recipientType === 'all'
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users
                        className={`w-4 h-4 ${recipientType === 'all' ? 'text-slate-800' : 'text-slate-800'
                          }`}
                      />
                      <span
                        className={`text-sm font-semibold ${recipientType === 'all' ? 'text-slate-900' : 'text-slate-700'
                          }`}
                      >
                        Everyone
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">All users</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('teachers')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${recipientType === 'teachers'
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users
                        className={`w-4 h-4 ${recipientType === 'teachers'
                          ? 'text-slate-800'
                          : 'text-slate-800'
                          }`}
                      />
                      <span
                        className={`text-sm font-semibold ${recipientType === 'teachers'
                          ? 'text-slate-900'
                          : 'text-slate-700'
                          }`}
                      >
                        Teachers
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{schoolTeachers.length} teachers</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('parents')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${recipientType === 'parents'
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users
                        className={`w-4 h-4 ${recipientType === 'parents'
                          ? 'text-slate-800'
                          : 'text-slate-800'
                          }`}
                      />
                      <span
                        className={`text-sm font-semibold ${recipientType === 'parents'
                          ? 'text-slate-900'
                          : 'text-slate-700'
                          }`}
                      >
                        Parents
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{schoolParents.length} parents</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('students')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${recipientType === 'students'
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users
                        className={`w-4 h-4 ${recipientType === 'students'
                          ? 'text-slate-800'
                          : 'text-slate-800'
                          }`}
                      />
                      <span
                        className={`text-sm font-semibold ${recipientType === 'students'
                          ? 'text-slate-900'
                          : 'text-slate-700'
                          }`}
                      >
                        Students
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{schoolStudents.length} students</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('specific')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${recipientType === 'specific'
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck
                        className={`w-4 h-4 ${recipientType === 'specific'
                          ? 'text-slate-800'
                          : 'text-slate-800'
                          }`}
                      />
                      <span
                        className={`text-sm font-semibold ${recipientType === 'specific'
                          ? 'text-slate-900'
                          : 'text-slate-700'
                          }`}
                      >
                        Specific
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">Choose individuals</p>
                  </button>
                </div>
              </div>

              {/* Specific Recipient Selection */}
              {recipientType === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Select Recipients <span className="text-red-500">*</span>
                    {selectedRecipientIds.length > 0 && (
                      <span className="ml-2 text-xs text-slate-800 font-normal">
                        ({selectedRecipientIds.length} selected)
                      </span>
                    )}
                  </label>
                  {errors.recipients && (
                    <p className="text-xs text-red-500 mb-2">{errors.recipients}</p>
                  )}
                  <div className="border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {availableRecipients.length === 0 ? (
                      <p className="text-sm text-slate-700 text-center py-4">
                        No recipients available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {availableRecipients.map((recipient) => {
                          const isSelected = selectedRecipientIds.includes(recipient.id);
                          return (
                            <button
                              key={recipient.id}
                              type="button"
                              onClick={() => toggleRecipientSelection(recipient.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isSelected
                                ? 'border-slate-700 bg-slate-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-slate-700' : 'bg-slate-200'
                                    }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                  ) : (
                                    <Users className="w-4 h-4 text-slate-700" />
                                  )}
                                </div>
                                <div className="text-left">
                                  <p
                                    className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-900'
                                      }`}
                                  >
                                    {recipient.name}
                                  </p>
                                  <p className="text-xs text-slate-700">
                                    {recipient.email}{' '}
                                    {'type' in recipient && `• ${recipient.type}`}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recipient Count Display for non-specific types */}
              {recipientType !== 'specific' && recipientType !== 'all' && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800">
                    This announcement will be sent to{' '}
                    <strong>{availableRecipients.length}</strong> {recipientType}
                  </p>
                </div>
              )}

              {recipientType === 'all' && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800">
                    This announcement will be sent to <strong>all users</strong> in your school
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href={ROUTES.ADMIN.ANNOUNCEMENTS}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Announcement'}
            </Button>
          </div>
        </div>
      </form>

      <AlertComponent />
    </div>
  );
}

