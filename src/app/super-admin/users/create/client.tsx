'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { createUser } from '@/actions/users';
import { getDefaultPermissions } from '@/actions/permissions';
import type { UserRole, ParentType, User, School, UserPermission } from '@/types';
import { toast } from 'sonner';
import PermissionSelector from '@/app/admin/administration/admins/_components/PermissionSelector';
import { PasswordInput } from '@/components/ui/password-input';

interface CreateUserClientProps {
  schools: School[];
  students: User[];
}

export default function CreateUserClient({ schools, students }: CreateUserClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as UserRole,
    schoolId: '',
    parentType: 'mother' as ParentType,
    studentId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState<UserPermission[]>([]);

  // Fetch default permissions when creating an admin
  useEffect(() => {
    if (formData.role !== 'admin') return;
    async function fetchDefaults() {
      const result = await getDefaultPermissions();
      if (result.success && result.data) {
        setPermissions(result.data);
      }
    }
    fetchDefaults();
  }, [formData.role]);

  // Filter students based on selected school
  const filteredStudents = formData.schoolId
    ? students.filter(s => s.schoolId === formData.schoolId)
    : [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (formData.role !== 'super_admin' && !formData.schoolId) {
      newErrors.schoolId = 'School is required for this role';
    }

    if (formData.role === 'parent' && !formData.studentId) {
      newErrors.studentId = 'Please select a student';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors in the form');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (formData.role === 'admin') {
        const permissionsPayload = permissions.map((p) => ({
          module: p.module,
          canView: Boolean(p.canView),
          canCreate: Boolean(p.canCreate),
          canUpdate: Boolean(p.canUpdate),
          canDelete: Boolean(p.canDelete),
        }));
        const result = await createUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: 'ADMIN',
          schoolId: formData.schoolId,
          permissions: permissionsPayload,
        });
        if (result.error) {
          toast.error(result.error);
          setLoading(false);
          return;
        }
      } else {
        const payload: Record<string, string> = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        };
        if (formData.role !== 'super_admin' && formData.schoolId) {
          payload.schoolId = formData.schoolId;
        }
        if (formData.role === 'parent') {
          payload.parentType = formData.parentType;
          if (formData.studentId) payload.studentId = formData.studentId;
        }
        const result = await createUser(payload);
        if (result.error) {
          toast.error(result.error);
          setLoading(false);
          return;
        }
      }

      toast.success('User created successfully');
      router.push(ROUTES.SUPER_ADMIN.USERS);
      router.refresh();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user. Please try again.');
      setLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      parentType: role === 'parent' ? formData.parentType : 'mother',
      studentId: role === 'parent' ? formData.studentId : '',
      schoolId: role === 'super_admin' ? '' : formData.schoolId,
    });
    setErrors({});
    if (role !== 'admin') setPermissions([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="text-gray-600 mt-1">Add a new user to the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Enter the details for the new user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="user@example.com"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <PasswordInput
                id="password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter password"
                autoComplete="new-password"
              />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                required
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>

            {formData.role !== 'super_admin' && (
              <div>
                <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-1">
                  School *
                </label>
                <select
                  id="schoolId"
                  required
                  value={formData.schoolId}
                  onChange={(e) => {
                    setFormData({ ...formData, schoolId: e.target.value });
                    if (errors.schoolId) setErrors({ ...errors, schoolId: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                    errors.schoolId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                {errors.schoolId && <p className="text-sm text-red-500 mt-1">{errors.schoolId}</p>}
              </div>
            )}

            {formData.role === 'parent' && (
              <>
                <div>
                  <label htmlFor="parentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Type *
                  </label>
                  <select
                    id="parentType"
                    required
                    value={formData.parentType}
                    onChange={(e) => setFormData({ ...formData, parentType: e.target.value as ParentType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  >
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Student *
                  </label>
                  <select
                    id="studentId"
                    required
                    value={formData.studentId}
                    onChange={(e) => {
                      setFormData({ ...formData, studentId: e.target.value });
                      if (errors.studentId) setErrors({ ...errors, studentId: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                      errors.studentId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a student</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <p className="text-sm text-red-500 mt-1">{errors.studentId}</p>}
                  {filteredStudents.length === 0 && formData.schoolId && (
                    <p className="text-sm text-amber-600 mt-1">
                      No students found in this school. Please create students first.
                    </p>
                  )}
                </div>
              </>
            )}

            {formData.role === 'admin' && permissions.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <PermissionSelector
                  permissions={permissions}
                  onChange={setPermissions}
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.SUPER_ADMIN.USERS)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
