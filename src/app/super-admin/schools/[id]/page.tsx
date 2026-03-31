import Link from 'next/link';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Users, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { apiServer } from '@/lib/api-server';
import type { User, School } from '@/types';
import { notFound } from 'next/navigation';
import SchoolFeePaymentsSection from './school-fee-payments-section';
import { SchoolUsersTable } from './school-users-table';

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getRoleBadgeColor = (role: string) => {
  const normalizedRole = role.toLowerCase() as User['role'];
  const colors: Record<User['role'], string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-indigo-100 text-indigo-700',
    teacher: 'bg-green-100 text-green-700',
    student: 'bg-yellow-100 text-yellow-700',
    parent: 'bg-pink-100 text-pink-700',
  };
  return colors[normalizedRole] || 'bg-gray-100 text-gray-700';
};

async function getSchoolData(id: string) {
  try {
    const [schoolData, usersData] = await Promise.all([
      apiServer<{ school: School }>(`/schools/${id}`),
      apiServer<{ users: User[] }>(`/users?schoolId=${id}&limit=1000`),
    ]);

    return {
      school: schoolData.school,
      schoolUsers: usersData.users,
    };
  } catch (error) {
    console.error('Error fetching school data:', error);
    return null;
  }
}

export default async function SchoolDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: schoolId } = await params;
  const data = await getSchoolData(schoolId);

  if (!data || !data.school) {
    notFound();
  }

  const { school, schoolUsers } = data;
  
  // Calculate user stats by role
  const userStats = schoolUsers.reduce((acc, user) => {
    const role = (user.role as string).toLowerCase() as User['role'];
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<User['role'], number>);

  const totalUsers = schoolUsers.length;
  const activeUsers = schoolUsers.length; // All users are considered active for now

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={ROUTES.SUPER_ADMIN.SCHOOLS}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schools
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
            <p className="text-gray-600 mt-1">School Details & Statistics</p>
          </div>
        </div>
        <Link href={ROUTES.SUPER_ADMIN.SCHOOLS_EDIT(school.id)}>
          <Button>Edit School</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
            <UserCheck className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
            <Building2 className="w-5 h-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span
                className={`${
                  school.status === 'ACTIVE'
                    ? 'text-[#10b981]'
                    : school.status === 'ON_HOLD'
                    ? 'text-amber-600'
                    : 'text-gray-600'
                }`}
              >
                {school.status === 'ACTIVE' ? 'Active' : school.status === 'ON_HOLD' ? 'On hold' : 'Suspended'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">School status</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Created</CardTitle>
            <Calendar className="w-5 h-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">
              {formatDate(school.createdAt)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Registration date</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>School Information</CardTitle>
            <CardDescription>Complete details about the school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">School Name</p>
                <p className="text-base text-gray-900">{school.name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base text-gray-900">{school.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-base text-gray-900">{school.phone}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-base text-gray-900">{school.address}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="text-base text-gray-900">{formatDate(school.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-base text-gray-900">{formatDate(school.updatedAt)}</p>
              </div>
            </div>

            {(school.setupFee != null || school.monthlyFee != null || school.referal || school.referalCommission != null || school.referalContact) && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <p className="text-sm font-medium text-gray-700">Fee & referral</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {school.setupFee != null && (
                    <><span className="text-gray-500">Setup fee</span><span className="font-medium">PKR {school.setupFee.toLocaleString()}</span></>
                  )}
                  {school.monthlyFee != null && (
                    <><span className="text-gray-500">Monthly fee</span><span className="font-medium">PKR {school.monthlyFee.toLocaleString()}</span></>
                  )}
                  {school.referal && (
                    <><span className="text-gray-500">Referral</span><span>{school.referal}</span></>
                  )}
                  {school.referalCommission != null && (
                    <><span className="text-gray-500">Referral commission</span><span className="font-medium">PKR {school.referalCommission.toLocaleString()}</span></>
                  )}
                  {school.referalContact && (
                    <><span className="text-gray-500">Referral contact</span><span>{school.referalContact}</span></>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(userStats).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role as User['role'])}`}
                    >
                      {ROLES[role as User['role']]}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{count}</span>
                </div>
              ))}
              {Object.keys(userStats).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No users assigned yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly fee payments */}
      <SchoolFeePaymentsSection
        schoolId={school.id}
        initialPayments={school.monthlyFeePayments ?? []}
      />

      <SchoolUsersTable schoolUsers={schoolUsers} totalUsers={totalUsers} />
    </div>
  );
}
