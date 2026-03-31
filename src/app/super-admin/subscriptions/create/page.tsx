'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { createSubscriptionTier } from '@/lib/subscription-api';
import { toast } from 'sonner';

export default function CreateSubscriptionTierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !name.trim()) {
      toast.error('Slug and name are required');
      return;
    }
    setLoading(true);
    try {
      const tier = await createSubscriptionTier({
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        description: description.trim() || null,
        sortOrder,
        isActive,
      });
      toast.success('Tier created. Configure permissions next.');
      router.push(ROUTES.SUPER_ADMIN.SUBSCRIPTIONS_EDIT(tier.id));
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={ROUTES.SUPER_ADMIN.SUBSCRIPTIONS}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to subscriptions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create subscription tier</h1>
        <p className="text-gray-600 mt-1">
          After creation you will set permissions for each module exposed by the API (school admin, teacher,
          and parent surfaces).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier details</CardTitle>
          <CardDescription>Identifier must be unique (lowercase, letters, numbers, hyphens).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. custom-pro"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Custom Pro"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-700 focus:border-slate-700 min-h-[88px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                <input
                  type="number"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-8">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-slate-800 focus:ring-slate-700"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-slate-800 hover:bg-slate-700">
                {loading ? 'Creating…' : 'Create & configure permissions'}
              </Button>
              <Link
                href={ROUTES.SUPER_ADMIN.SUBSCRIPTIONS}
                className="inline-flex items-center justify-center rounded-lg font-medium h-10 px-4 text-sm border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
