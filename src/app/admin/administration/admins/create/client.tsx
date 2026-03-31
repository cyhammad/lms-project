'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { createUser } from '@/actions/users';
import { getDefaultPermissions } from '@/actions/permissions';
import { UserPermission } from '@/types';
import { toast } from 'sonner';
import PermissionSelector from '../_components/PermissionSelector';
import { PasswordInput } from '@/components/ui/password-input';

interface CreateAdminClientProps {
    schoolId: string;
}

export default function CreateAdminClient({ schoolId }: CreateAdminClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<UserPermission[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchDefaults() {
            const result = await getDefaultPermissions();
            if (result.success && result.data) {
                setPermissions(result.data);
            }
        }
        fetchDefaults();
    }, []);

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

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
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
            const result = await createUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: 'ADMIN',
                schoolId: schoolId,
                permissions: permissions,
            });

            if (result.success) {
                toast.success('Administrator created successfully');
                router.push(ROUTES.ADMIN.ADMINISTRATION.ADMINS);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to create admin');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            toast.error('Failed to create admin. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Admin</h1>
                <p className="text-gray-600 mt-1">Add a new admin to your school</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Information</CardTitle>
                    <CardDescription>Enter the details for the new admin</CardDescription>
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="admin@example.com"
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter password"
                                autoComplete="new-password"
                            />
                            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <PermissionSelector
                                permissions={permissions}
                                onChange={setPermissions}
                            />
                        </div>

                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(ROUTES.ADMIN.ADMINISTRATION.ADMINS)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Admin'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
