'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { SubscriptionAppSurface, SubscriptionModule, SubscriptionTierDetail } from '@/types/subscription';
import { replaceTierPermissions, updateSubscriptionTier } from '@/lib/subscription-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Perm = {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const SURFACES: { id: SubscriptionAppSurface; label: string }[] = [
  { id: 'SCHOOL_ADMIN', label: 'School admin' },
  { id: 'TEACHER_APP', label: 'Teacher app' },
  { id: 'PARENT_APP', label: 'Parent app' },
];

function buildPermissionMap(tier: SubscriptionTierDetail, modules: SubscriptionModule[]): Record<string, Perm> {
  const byKey = new Map(tier.tierPermissions.map((tp) => [tp.module.moduleKey, tp]));
  const map: Record<string, Perm> = {};
  for (const m of modules) {
    const row = byKey.get(m.moduleKey);
    map[m.moduleKey] = row
      ? {
        canView: row.canView,
        canCreate: row.canCreate,
        canUpdate: row.canUpdate,
        canDelete: row.canDelete,
      }
      : { canView: false, canCreate: false, canUpdate: false, canDelete: false };
  }
  return map;
}

function groupByLabel(modules: SubscriptionModule[]): [string, SubscriptionModule[]][] {
  const map = new Map<string, SubscriptionModule[]>();
  for (const m of modules) {
    const key = m.groupLabel?.trim() || 'General';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

type Props = {
  initialTier: SubscriptionTierDetail;
  modules: SubscriptionModule[];
};

export default function EditTierClient({ initialTier, modules }: Props) {
  const router = useRouter();
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [surface, setSurface] = useState<SubscriptionAppSurface>('SCHOOL_ADMIN');

  const [name, setName] = useState(initialTier.name);
  const [description, setDescription] = useState(initialTier.description ?? '');
  const [sortOrder, setSortOrder] = useState(initialTier.sortOrder);
  const [isActive, setIsActive] = useState(initialTier.isActive);

  const [permissionMap, setPermissionMap] = useState<Record<string, Perm>>(() =>
    buildPermissionMap(initialTier, modules),
  );

  const modulesForSurface = useMemo(
    () => modules.filter((m) => m.appSurface === surface).sort((a, b) => a.sortOrder - b.sortOrder),
    [modules, surface],
  );

  const grouped = useMemo(() => groupByLabel(modulesForSurface), [modulesForSurface]);

  const setPerm = (moduleKey: string, key: keyof Perm, value: boolean) => {
    setPermissionMap((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [key]: value },
    }));
  };

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    try {
      await updateSubscriptionTier(initialTier.id, {
        name: name.trim(),
        description: description.trim() || null,
        sortOrder,
        isActive,
      });
      toast.success('Tier details saved');
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSavePermissions = async () => {
    const permissions = modules.map((m) => {
      const p = permissionMap[m.moduleKey];
      return {
        moduleKey: m.moduleKey,
        canView: p?.canView ?? false,
        canCreate: p?.canCreate ?? false,
        canUpdate: p?.canUpdate ?? false,
        canDelete: p?.canDelete ?? false,
      };
    });
    setSavingPerms(true);
    try {
      await replaceTierPermissions(initialTier.id, permissions);
      toast.success('Permissions saved');
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <Link
          href={ROUTES.SUPER_ADMIN.SUBSCRIPTIONS}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to subscriptions
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Edit tier</h1>
          {initialTier.isSystem && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-800">
              <Shield className="h-3 w-3" />
              System tier
            </span>
          )}
        </div>
        <p className="text-gray-600 mt-1 font-mono text-sm">{initialTier.slug}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Name, order, and visibility. Slug cannot be changed after creation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
            <input
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full max-w-2xl rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
              <input
                type="number"
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-slate-800 focus:ring-slate-700"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
          <Button
            type="button"
            onClick={handleSaveMeta}
            disabled={savingMeta}
            className="bg-slate-800 hover:bg-slate-700"
          >
            {savingMeta ? 'Saving…' : 'Save details'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Only modules returned by the API are listed ({modules.length} total). Use View / Create / Update /
            Delete to match each area of the product.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SURFACES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSurface(s.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  surface === s.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-3 py-2 font-semibold text-gray-700">Module</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 w-20">View</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 w-20">Create</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 w-20">Update</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 w-20">Delete</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([group, items]) => (
                  <Fragment key={group}>
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-800">
                        {group}
                      </td>
                    </tr>
                    {items.map((m) => {
                      const p = permissionMap[m.moduleKey];
                      return (
                        <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-3 py-2 align-top">
                            <div className="font-medium text-gray-900">{m.label}</div>
                            <div className="font-mono text-[11px] text-gray-500 mt-0.5">{m.moduleKey}</div>
                          </td>
                          {(['canView', 'canCreate', 'canUpdate', 'canDelete'] as const).map((col) => (
                            <td key={col} className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={p?.[col] ?? false}
                                onChange={(e) => setPerm(m.moduleKey, col, e.target.checked)}
                                className="rounded border-gray-300 text-slate-800 focus:ring-slate-700 h-4 w-4"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            onClick={handleSavePermissions}
            disabled={savingPerms}
            className="bg-slate-800 hover:bg-slate-700"
          >
            {savingPerms ? 'Saving permissions…' : 'Save permissions'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
