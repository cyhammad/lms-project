'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { createSchool } from '@/actions/schools';
import type { SubscriptionTierSummary } from '@/types/subscription';

import { toast } from 'sonner';

/** Allow only a normal decimal money string (avoids type="number" float glitches e.g. 5000 → 4999.97 on blur). */
function normalizeMoneyInput(raw: string): string {
  let s = raw.replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  return s;
}

function defaultTierId(tiers: SubscriptionTierSummary[]): string {
  const free = tiers.find((t) => t.slug === 'free');
  if (free) return free.id;
  return tiers[0]?.id ?? '';
}

type Props = {
  initialTiers: SubscriptionTierSummary[];
};

export default function CreateSchoolForm({ initialTiers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(() => ({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    setupFee: '',
    monthlyFee: '',
    referal: '',
    referalCommission: '',
    referalContact: '',
    subscriptionTierId: defaultTierId(initialTiers),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'School name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.subscriptionTierId) {
      newErrors.subscriptionTierId = 'Select a subscription tier';
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
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('email', formData.email.trim());
      submitData.append('phone', formData.phone.trim());
      submitData.append('address', formData.address.trim());
      submitData.append('city', formData.city.trim());
      submitData.append('subscriptionTierId', formData.subscriptionTierId);
      if (formData.setupFee !== '') submitData.append('setupFee', formData.setupFee);
      if (formData.monthlyFee !== '') submitData.append('monthlyFee', formData.monthlyFee);
      if (formData.referal.trim()) submitData.append('referal', formData.referal.trim());
      if (formData.referalCommission !== '') submitData.append('referalCommission', formData.referalCommission);
      if (formData.referalContact.trim()) submitData.append('referalContact', formData.referalContact.trim());

      const result = await createSchool(submitData);

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      toast.success('School created successfully');
      router.push(ROUTES.SUPER_ADMIN.SCHOOLS);
      router.refresh();
    } catch (error) {
      console.error('Error creating school:', error);
      toast.error('Failed to create school. Please try again.');
      setLoading(false);
    }
  };

  const noTiers = initialTiers.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New School</h1>
        <p className="text-gray-600 mt-1">Add a new school and assign a subscription tier</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Enter the details for the new school</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subscriptionTierId" className="block text-sm font-medium text-gray-700 mb-1">
                Subscription tier *
              </label>
              <select
                id="subscriptionTierId"
                required
                disabled={noTiers || loading}
                value={formData.subscriptionTierId}
                onChange={(e) => {
                  setFormData({ ...formData, subscriptionTierId: e.target.value });
                  if (errors.subscriptionTierId) setErrors({ ...errors, subscriptionTierId: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white ${
                  errors.subscriptionTierId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {noTiers ? (
                  <option value="">No tiers available — seed the database</option>
                ) : (
                  initialTiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} ({tier.slug})
                      {!tier.isActive ? ' — inactive' : ''}
                    </option>
                  ))
                )}
              </select>
              {errors.subscriptionTierId && (
                <p className="text-sm text-red-500 mt-1">{errors.subscriptionTierId}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Controls feature access for this school’s admin, teacher, and parent apps.
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                School Name *
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
                placeholder="Enter school name"
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
                placeholder="school@example.com"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+1234567890"
              />
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter school address"
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter city"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="setupFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Setup fee (PKR)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="setupFee"
                  autoComplete="off"
                  value={formData.setupFee}
                  onChange={(e) =>
                    setFormData({ ...formData, setupFee: normalizeMoneyInput(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly fee (PKR)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="monthlyFee"
                  autoComplete="off"
                  value={formData.monthlyFee}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyFee: normalizeMoneyInput(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="referal" className="block text-sm font-medium text-gray-700 mb-1">
                  Referral (source/code)
                </label>
                <input
                  type="text"
                  id="referal"
                  value={formData.referal}
                  onChange={(e) => setFormData({ ...formData, referal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="e.g. Partner name or code"
                />
              </div>
              <div>
                <label htmlFor="referalCommission" className="block text-sm font-medium text-gray-700 mb-1">
                  Referral commission
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="referalCommission"
                  autoComplete="off"
                  value={formData.referalCommission}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referalCommission: normalizeMoneyInput(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label htmlFor="referalContact" className="block text-sm font-medium text-gray-700 mb-1">
                Referral contact
              </label>
              <input
                type="text"
                id="referalContact"
                value={formData.referalContact}
                onChange={(e) => setFormData({ ...formData, referalContact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Contact person or details"
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.SUPER_ADMIN.SCHOOLS)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || noTiers}>
                {loading ? 'Creating...' : 'Create School'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
