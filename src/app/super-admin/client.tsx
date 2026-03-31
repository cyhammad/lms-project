import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import type { School } from '@/types';
import type { ElementType } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Plus,
  UserPlus,
  Settings,
  Calendar,
} from 'lucide-react';

interface DashboardStatsShape {
  schools: { total: number; active: number };
  users: { total: number };
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
  href?: string;
}

const colorClasses = {
  emerald: {
    bg: 'bg-slate-50',
    icon: 'bg-gradient-to-br from-slate-800 to-slate-800',
    shadow: 'shadow-slate-700/20',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-gradient-to-br from-blue-400 to-blue-600',
    shadow: 'shadow-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-gradient-to-br from-purple-400 to-purple-600',
    shadow: 'shadow-purple-500/20',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-gradient-to-br from-orange-400 to-orange-600',
    shadow: 'shadow-orange-500/20',
  },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, href }: StatCardProps) => {
  const colors = colorClasses[color];

  const content = (
    <Card
      className={`relative overflow-hidden group h-full ${href ? 'cursor-pointer hover:shadow-lg' : ''} transition-all duration-300`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-50`}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">{title}</p>
            <div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-700 mt-1">{subtitle}</p>
            </div>
          </div>
          <div className={`p-3 rounded-2xl ${colors.icon} shadow-lg ${colors.shadow}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
};

interface QuickActionProps {
  icon: ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
}

const QuickAction = ({ icon: Icon, title, description, href, color }: QuickActionProps) => (
  <Link href={href} className="group block">
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
          {title}
        </p>
        <p className="text-sm text-slate-700 truncate">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
    </div>
  </Link>
);

interface SuperAdminDashboardClientProps {
  stats: DashboardStatsShape;
  recentSchools: School[];
}

export default function SuperAdminDashboardClient({
  stats,
  recentSchools,
}: SuperAdminDashboardClientProps) {
  const totalSchools = stats.schools.total;
  const activeSchools = stats.schools.active;
  const totalUsers = stats.users.total;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, Super Admin
          </h1>
          <p className="text-slate-700 mt-1">
            Welcome to the LMS administrative dashboard
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-800" />
          <span className="text-sm font-medium text-slate-800">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Schools"
          value={totalSchools}
          subtitle="Registered schools"
          icon={Building2}
          color="emerald"
          href={ROUTES.SUPER_ADMIN.SCHOOLS}
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          subtitle="All platform users"
          icon={Users}
          color="blue"
          href={ROUTES.SUPER_ADMIN.USERS}
        />
        <StatCard
          title="Active Schools"
          value={activeSchools}
          subtitle={
            totalSchools > 0
              ? `${Math.round((activeSchools / totalSchools) * 100)}% active`
              : 'No schools'
          }
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="System Status"
          value="Healthy"
          subtitle="All systems operational"
          icon={CheckCircle}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-700" />
                  Recent Schools
                </CardTitle>
                <CardDescription>
                  Recently added schools in the system
                </CardDescription>
              </div>
              <Link
                href={ROUTES.SUPER_ADMIN.SCHOOLS}
                className="text-sm font-medium text-slate-800 hover:text-slate-700 flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentSchools.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-800" />
                </div>
                <p className="text-slate-900 font-medium">No schools added yet</p>
                <p className="text-sm text-slate-700 mt-1 mb-4">
                  Get started by adding your first school
                </p>
                <Link
                  href={ROUTES.SUPER_ADMIN.SCHOOLS_CREATE}
                  className="text-sm font-medium text-slate-800 hover:text-slate-700"
                >
                  Add your first school →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSchools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 min-w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-slate-700/20">
                      {school.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{school.name}</p>
                      <p className="text-sm text-slate-700 truncate">{school.email}</p>
                    </div>
                    <span className="text-xs text-slate-800">
                      {new Date(school.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction
              icon={Plus}
              title="Add New School"
              description="Register a new school"
              href={ROUTES.SUPER_ADMIN.SCHOOLS_CREATE}
              color="bg-gradient-to-br from-slate-800 to-slate-800"
            />
            <QuickAction
              icon={Building2}
              title="View All Schools"
              description="Manage existing schools"
              href={ROUTES.SUPER_ADMIN.SCHOOLS}
              color="bg-gradient-to-br from-blue-400 to-blue-600"
            />
            <QuickAction
              icon={UserPlus}
              title="Add New User"
              description="Create user account"
              href={ROUTES.SUPER_ADMIN.USERS_CREATE}
              color="bg-gradient-to-br from-purple-400 to-purple-600"
            />
            <QuickAction
              icon={Users}
              title="Manage Users"
              description="View all platform users"
              href={ROUTES.SUPER_ADMIN.USERS}
              color="bg-gradient-to-br from-orange-400 to-orange-600"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
