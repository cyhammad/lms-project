'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { SchoolPolicy, SchoolPolicyType } from '@/types';

const POLICY_TYPE_COLORS: Record<SchoolPolicyType, string> = {
  Grading: 'bg-blue-100 text-blue-700 border-blue-200',
  Attendance: 'bg-green-100 text-green-700 border-green-200',
  Discipline: 'bg-red-100 text-red-700 border-red-200',
  Academic: 'bg-purple-100 text-purple-700 border-purple-200',
  General: 'bg-slate-100 text-slate-700 border-slate-200',
  Other: 'bg-orange-100 text-orange-700 border-orange-200',
};

interface SchoolPoliciesClientProps {
  user: { schoolId?: string };
}

export default function SchoolPoliciesClient({ user }: SchoolPoliciesClientProps) {
  const [policies, setPolicies] = useState<SchoolPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess, showConfirm, AlertComponent, ConfirmComponent } = useAlert();

  type BackendSchoolPolicy = Omit<SchoolPolicy, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  };

  const normalizePolicy = (policy: BackendSchoolPolicy): SchoolPolicy => ({
    ...policy,
    createdAt: new Date(policy.createdAt),
    updatedAt: new Date(policy.updatedAt),
  });

  useEffect(() => {
    const loadPolicies = async () => {
      if (!user?.schoolId) {
        setPolicies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { policies } = await apiClient<{ policies: BackendSchoolPolicy[] }>('/policies/school');
        setPolicies(policies.map(normalizePolicy));
      } catch (error) {
        console.error('Error loading school policies from API:', error);
        showError('Failed to load school policies. Please try again.');
        setPolicies([]);
      } finally {
        setLoading(false);
      }
    };

    void loadPolicies();
  }, [user?.schoolId, showError]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<SchoolPolicyType | 'all'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesSearch =
        policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || policy.type === filterType;
      const matchesActive =
        filterActive === 'all' ||
        (filterActive === 'active' && policy.isActive) ||
        (filterActive === 'inactive' && !policy.isActive);

      return matchesSearch && matchesType && matchesActive;
    });
  }, [policies, searchQuery, filterType, filterActive]);

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete the policy "${title}"? This action cannot be undone.`,
      'Delete Policy',
      'Delete',
      'Cancel',
      'destructive',
    );

    if (!confirmed) return;

    try {
      await apiClient<{ message: string }>(`/policies/school/${id}`, {
        method: 'DELETE',
      });
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      showSuccess('Policy deleted successfully');
    } catch (error) {
      console.error('Error deleting school policy via API:', error);
      showError('Failed to delete policy');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">School Policies</h1>
            <p className="text-slate-700 mt-1">Manage school-wide policies</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FileText className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-700">Loading policies...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">School Policies</h1>
            <p className="text-slate-700 mt-1">Manage and define school-wide policies for everyone to follow</p>
          </div>
          <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES_CREATE}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-800" />
                <input
                  type="text"
                  placeholder="Search policies by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-800" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as SchoolPolicyType | 'all')}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Grading">Grading</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Discipline">Discipline</option>
                  <option value="Academic">Academic</option>
                  <option value="General">General</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Active Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policies List */}
        {filteredPolicies.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-700">No policies found</p>
                <p className="text-sm text-slate-800 mt-1">
                  {searchQuery || filterType !== 'all' || filterActive !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first school policy'}
                </p>
                {!searchQuery && filterType === 'all' && filterActive === 'all' && (
                  <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES_CREATE}>
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Policy
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{policy.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-lg border ${POLICY_TYPE_COLORS[policy.type]}`}
                        >
                          {policy.type}
                        </span>
                        {policy.isActive ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-lg">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 line-clamp-2">{policy.description}</p>
                      <p className="text-xs text-slate-800 mt-2">
                        Created: {new Date(policy.createdAt).toLocaleDateString()} • Updated:{' '}
                        {new Date(policy.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES_EDIT(policy.id)}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(policy.id, policy.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertComponent />
      <ConfirmComponent />
    </>
  );
}

