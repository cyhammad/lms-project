'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { addCampus } from '@/lib/campus-storage';

interface CreateCampusClientProps {
    user: any;
}

export default function CreateCampusClient({ user }: CreateCampusClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        principalName: '',
        description: '',
        isActive: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Campus name is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
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
            addCampus({
                name: formData.name.trim(),
                address: formData.address.trim(),
                phone: formData.phone.trim() || undefined,
                email: formData.email.trim() || undefined,
                principalName: formData.principalName.trim() || undefined,
                description: formData.description.trim() || undefined,
                schoolId: user.schoolId,
                isActive: formData.isActive,
            });

            router.push(ROUTES.ADMIN.ADMINISTRATION.CAMPUSES);
        } catch (error) {
            console.error('Error creating campus:', error);
            alert('Failed to create campus. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Campus</h1>
                <p className="text-gray-600 mt-1">Add a new campus to your school</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Campus Information</CardTitle>
                    <CardDescription>Enter the details for the new campus</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Campus Name *
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
                                placeholder="Enter campus name"
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                Address *
                            </label>
                            <textarea
                                id="address"
                                required
                                value={formData.address}
                                onChange={(e) => {
                                    setFormData({ ...formData, address: e.target.value });
                                    if (errors.address) setErrors({ ...errors, address: '' });
                                }}
                                rows={3}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter campus address"
                            />
                            {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                    placeholder="+92xxxxxxxxx"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="campus@example.com"
                                />
                                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="principalName" className="block text-sm font-medium text-gray-700 mb-1">
                                Principal Name
                            </label>
                            <input
                                type="text"
                                id="principalName"
                                value={formData.principalName}
                                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                placeholder="Enter principal name"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                placeholder="Enter campus description"
                            />
                        </div>

                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981]"
                                />
                                <span className="text-sm font-medium text-gray-700">Active Campus</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(ROUTES.ADMIN.ADMINISTRATION.CAMPUSES)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Campus'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
