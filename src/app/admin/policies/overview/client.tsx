'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle, XCircle, Plus, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/lib/api-client';
import type { SchoolPolicy, SchoolPolicyType } from '@/types';

const POLICY_TYPE_COLORS: Record<SchoolPolicyType, { bg: string; text: string; border: string }> = {
    Grading: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Attendance: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    Discipline: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    Academic: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    General: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    Other: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

interface PoliciesOverviewClientProps {
    user: any;
}

export default function PoliciesOverviewClient({ user }: PoliciesOverviewClientProps) {
    const [schoolPolicies, setSchoolPolicies] = useState<SchoolPolicy[]>([]);
    const [loading, setLoading] = useState(true);

    type BackendSchoolPolicy = Omit<SchoolPolicy, 'createdAt' | 'updatedAt'> & {
        createdAt: string;
        updatedAt: string;
    };

    useEffect(() => {
        const loadPolicies = async () => {
            if (!user?.schoolId) {
                setSchoolPolicies([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { policies } = await apiClient<{ policies: BackendSchoolPolicy[] }>('/policies/school');
                setSchoolPolicies(
                    policies.map((p) => ({
                        ...p,
                        createdAt: new Date(p.createdAt),
                        updatedAt: new Date(p.updatedAt),
                    })),
                );
            } catch (error) {
                console.error('Error loading school policies for overview:', error);
                setSchoolPolicies([]);
            } finally {
                setLoading(false);
            }
        };

        void loadPolicies();
    }, [user?.schoolId]);

    const schoolPolicyStats = useMemo(() => {
        const activePolicies = schoolPolicies.filter(p => p.isActive);

        const policiesByType: Record<SchoolPolicyType, number> = {
            Grading: schoolPolicies.filter(p => p.type === 'Grading').length,
            Attendance: schoolPolicies.filter(p => p.type === 'Attendance').length,
            Discipline: schoolPolicies.filter(p => p.type === 'Discipline').length,
            Academic: schoolPolicies.filter(p => p.type === 'Academic').length,
            General: schoolPolicies.filter(p => p.type === 'General').length,
            Other: schoolPolicies.filter(p => p.type === 'Other').length,
        };

        const activePercentage = schoolPolicies.length > 0
            ? Math.round((activePolicies.length / schoolPolicies.length) * 100)
            : 0;

        // Get recent policies (last 5)
        const recentPolicies = [...schoolPolicies]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        return {
            total: schoolPolicies.length,
            active: activePolicies.length,
            inactive: schoolPolicies.length - activePolicies.length,
            activePercentage,
            byType: policiesByType,
            recentPolicies,
        };
    }, [schoolPolicies]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Policy Management</h1>
                    <p className="text-slate-700 mt-1">Overview of all school policies and statistics</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES_CREATE}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Policy
                        </Button>
                    </Link>
                    <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES}>
                        <Button variant="outline">
                            View All
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Key Statistics - Compact Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Policies */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-800 mb-1">Total Policies</p>
                                <p className="text-3xl font-bold text-slate-900">{schoolPolicyStats.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-slate-800" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Policies */}
                <Card className="hover:shadow-md transition-shadow border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-800 mb-1 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Active Policies
                                </p>
                                <p className="text-3xl font-bold text-slate-900">{schoolPolicyStats.active}</p>
                                {schoolPolicyStats.total > 0 && (
                                    <p className="text-xs text-slate-800 mt-1">
                                        {schoolPolicyStats.activePercentage}% of total
                                    </p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-slate-800" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Inactive Policies */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-800 mb-1 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Inactive Policies
                                </p>
                                <p className="text-3xl font-bold text-slate-700">{schoolPolicyStats.inactive}</p>
                                {schoolPolicyStats.total > 0 && (
                                    <p className="text-xs text-slate-700 mt-1">
                                        {100 - schoolPolicyStats.activePercentage}% of total
                                    </p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-slate-800" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Policy Types */}
                <Card className="hover:shadow-md transition-shadow border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 mb-1">Policy Types</p>
                                <p className="text-3xl font-bold text-blue-900">
                                    {Object.values(schoolPolicyStats.byType).filter(count => count > 0).length}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">Categories in use</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Policies by Type - Takes 2 columns */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Policies by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(schoolPolicyStats.byType).map(([type, count]) => {
                                const colors = POLICY_TYPE_COLORS[type as SchoolPolicyType];
                                const percentage = schoolPolicyStats.total > 0
                                    ? Math.round((count / schoolPolicyStats.total) * 100)
                                    : 0;

                                return (
                                    <div key={type} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
                                                    {type}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-900">{count}</span>
                                            </div>
                                            <span className="text-xs text-slate-700">{percentage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${colors.bg.replace('50', '400')}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Policies - Takes 1 column */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Recent Policies
                            </CardTitle>
                            <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES}>
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {schoolPolicyStats.recentPolicies.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-700 mb-4">No policies yet</p>
                                <Link href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES_CREATE}>
                                    <Button size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create First Policy
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {schoolPolicyStats.recentPolicies.map((policy) => {
                                    const colors = POLICY_TYPE_COLORS[policy.type];
                                    return (
                                        <Link
                                            key={policy.id}
                                            href={ROUTES.ADMIN.POLICIES.SCHOOL_POLICIES_EDIT(policy.id)}
                                            className="block p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-slate-900 text-sm truncate group-hover:text-slate-700">
                                                        {policy.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text} ${colors.border}`}>
                                                            {policy.type}
                                                        </span>
                                                        {policy.isActive ? (
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-medium rounded">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-800 group-hover:text-slate-800 flex-shrink-0 mt-1" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
