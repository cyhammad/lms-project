'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Shield, CalendarX, ArrowRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePolicies } from '@/hooks/use-policies';
import { useSecurityDeductions } from '@/hooks/use-security-deductions';
import { ROUTES } from '@/constants/routes';

const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
};

interface PoliciesClientProps {
    user: any;
}

export default function PoliciesClient({ user }: PoliciesClientProps) {
    const { securityPolicies, leavePolicies, getActiveSecurityPolicy, getActiveLeavePolicy } = usePolicies(user?.schoolId);
    const { records: securityRecords } = useSecurityDeductions();

    const activeSecurityPolicy = getActiveSecurityPolicy();
    const activeLeavePolicy = getActiveLeavePolicy();

    const securityStats = useMemo(() => {
        const totalDeducted = securityRecords
            .filter(r => r.status === 'deducted')
            .reduce((sum, r) => sum + r.amount, 0);
        const totalReturned = securityRecords
            .filter(r => r.status === 'returned')
            .reduce((sum, r) => sum + r.amount, 0);
        const pendingReturn = securityRecords
            .filter(r => r.status === 'deducted')
            .length;

        return {
            totalDeducted,
            totalReturned,
            pendingReturn,
            totalRecords: securityRecords.length,
        };
    }, [securityRecords]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Policy Management</h1>
                <p className="text-slate-700 mt-1">Manage security and leave deduction policies</p>
            </div>

            {/* Policy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Deduction Policy Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Security Deduction</CardTitle>
                                <CardDescription>Manage security deduction policies for new staff</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeSecurityPolicy ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-800">Active Policy:</span>
                                    <span className="px-2 py-1 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg">
                                        Active
                                    </span>
                                </div>
                                <div className="text-sm text-slate-700">
                                    <p>
                                        <span className="font-medium">Type:</span>{' '}
                                        {activeSecurityPolicy.deductionType === 'half' ? 'Half Salary' :
                                            activeSecurityPolicy.deductionType === 'quarter' ? 'Quarter Salary' :
                                                `${activeSecurityPolicy.deductionValue}%`}
                                    </p>
                                    <p className="mt-1">
                                        <span className="font-medium">Duration:</span> {activeSecurityPolicy.durationMonths} month(s)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-700">No active policy configured</p>
                        )}
                        <div className="pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-700">Total Deducted</p>
                                    <p className="font-semibold text-slate-900 mt-1">{formatCurrency(securityStats.totalDeducted)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-700">Pending Return</p>
                                    <p className="font-semibold text-orange-600 mt-1">{securityStats.pendingReturn} records</p>
                                </div>
                            </div>
                        </div>
                        <Link href={ROUTES.ADMIN.SALARY_POLICIES.SECURITY_DEDUCTION}>
                            <Button className="w-full" variant="outline">
                                Manage Security Deduction
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Leave Deduction Policy Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                <CalendarX className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Leave Deduction</CardTitle>
                                <CardDescription>Manage leave deduction policies</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeLeavePolicy ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-800">Active Policy:</span>
                                    <span className="px-2 py-1 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg">
                                        Active
                                    </span>
                                </div>
                                <div className="text-sm text-slate-700">
                                    <p>
                                        <span className="font-medium">Type:</span>{' '}
                                        {activeLeavePolicy.deductionType === 'fixed'
                                            ? `Fixed: ${formatCurrency(activeLeavePolicy.deductionValue)} per leave`
                                            : `Percentage: ${activeLeavePolicy.deductionValue}% of daily salary`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-700">No active policy configured</p>
                        )}
                        <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-700">
                                Leave deductions are automatically calculated from attendance records (Absent days)
                            </p>
                        </div>
                        <Link href={ROUTES.ADMIN.SALARY_POLICIES.LEAVE_DEDUCTION}>
                            <Button className="w-full" variant="outline">
                                Manage Leave Deduction
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Security Deduction Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-slate-800">Total Policies</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{securityPolicies.length}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <p className="text-sm text-blue-600">Total Deducted</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(securityStats.totalDeducted)}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-slate-800">Total Returned</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(securityStats.totalReturned)}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl">
                            <p className="text-sm text-orange-600">Pending Return</p>
                            <p className="text-2xl font-bold text-orange-900 mt-1">{securityStats.pendingReturn}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
