'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { updateAdmin } from '@/actions/users';
import { UserPermission } from '@/types';
import { toast } from 'sonner';
import PermissionSelector from '../../_components/PermissionSelector';
import { PasswordInput } from '@/components/ui/password-input';

interface EditAdminClientProps {
    admin: {
        id: string;
        name: string;
        email: string;
        userPermissions?: UserPermission[];
    };
}

export default function EditAdminClient({ admin }: EditAdminClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<UserPermission[]>(admin.userPermissions || []);
    const [formData, setFormData] = useState({
        name: admin.name,
        email: admin.email,
        password: '',
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

        if (formData.password.trim() && formData.password.length < 6) {
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
            const permissionsPayload = permissions.map((p) => ({
                module: p.module,
                canView: Boolean(p.canView),
                canCreate: Boolean(p.canCreate),
                canUpdate: Boolean(p.canUpdate),
                canDelete: Boolean(p.canDelete),
            }));
            const payload: any = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                permissions: permissionsPayload,
            };

            if (formData.password.trim()) {
                payload.password = formData.password;
            }

            const result = await updateAdmin(admin.id, payload);

            if (result.success) {
                toast.success('Administrator updated successfully');
                router.push(ROUTES.ADMIN.ADMINISTRATION.ADMINS);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update admin');
            }
        } catch (error) {
            console.error('Error updating admin:', error);
            toast.error('Failed to update admin. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Admin</h1>
                <p className="text-gray-500 mt-1">Update admin information and permissions</p>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader className="bg-muted/30 pb-6">
                    <CardTitle className="text-xl">Admin Information</CardTitle>
                    <CardDescription>Update the details for this admin</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
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
                                    className={`w-full px-4 py-2 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                    placeholder="Enter full name"
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                                    className={`w-full px-4 py-2 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                    placeholder="admin@example.com"
                                />
                                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password (leave blank to keep current)
                            </label>
                            <PasswordInput
                                id="password"
                                value={formData.password}
                                onChange={(e) => {
                                    setFormData({ ...formData, password: e.target.value });
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                className={`w-full px-4 py-2 border rounded-lg transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                placeholder="Enter new password (optional)"
                                autoComplete="new-password"
                            />
                            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                            <p className="text-xs text-gray-400 mt-2 italic">
                                Leave blank if you don't want to change the password
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <PermissionSelector
                                permissions={permissions}
                                onChange={setPermissions}
                            />
                        </div>

                        <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="outline"
                                className="px-6"
                                onClick={() => router.push(ROUTES.ADMIN.ADMINISTRATION.ADMINS)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="px-8" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Admin'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
