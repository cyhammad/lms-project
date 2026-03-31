'use client';

import type { ElementType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Calendar,
  Wallet,
  Briefcase,
  ChevronRight,
  BarChart3,
  Activity,
  Clock,
  Lightbulb,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import type {
  Student,
  Teacher,
  Class,
  Section,
  Timetable,
  StudentFeePayment,
  StaffSalaryPayment,
  Attendance
} from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  trend?: { value: string; positive: boolean };
  color: 'emerald' | 'blue' | 'purple' | 'orange' | 'pink';
  href?: string;
}

const colorClasses = {
  emerald: {
    bg: 'bg-slate-50',
    icon: 'bg-gradient-to-br from-slate-800 to-slate-800',
    text: 'text-slate-800',
    shadow: 'shadow-slate-700/20',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-gradient-to-br from-blue-400 to-blue-600',
    text: 'text-blue-600',
    shadow: 'shadow-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-gradient-to-br from-purple-400 to-purple-600',
    text: 'text-purple-600',
    shadow: 'shadow-purple-500/20',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-gradient-to-br from-orange-400 to-orange-600',
    text: 'text-orange-600',
    shadow: 'shadow-orange-500/20',
  },
  pink: {
    bg: 'bg-pink-50',
    icon: 'bg-gradient-to-br from-pink-400 to-pink-600',
    text: 'text-pink-600',
    shadow: 'shadow-pink-500/20',
  },
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color, href }: StatCardProps) => {
  const colors = colorClasses[color];

  const content = (
    <Card className={`relative overflow-hidden group ${href ? 'cursor-pointer hover:shadow-lg' : ''} transition-all duration-300 h-full`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-50`} />
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between flex-1">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-medium text-slate-700">{title}</p>
            <div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-700 mt-1">{subtitle}</p>
            </div>
            <div className="min-h-[28px] flex items-center">
              {trend ? (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend.positive ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'
                  }`}>
                  <TrendingUp className={`w-3 h-3 ${!trend.positive && 'rotate-180'}`} />
                  {trend.value}
                </div>
              ) : (
                <span className="text-transparent text-xs">placeholder</span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-2xl ${colors.icon} shadow-lg ${colors.shadow} flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {href && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className={`w-5 h-5 ${colors.text}`} />
          </div>
        )}
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
        <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">{title}</p>
        <p className="text-sm text-slate-700 truncate">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
    </div>
  </Link>
);

interface RecommendationItemProps {
  icon: ElementType;
  iconBg: string;
  title: string;
  description: string;
  href?: string;
  priority: 'high' | 'medium' | 'low';
}

const RecommendationItem = ({ icon: Icon, iconBg, title, description, href, priority }: RecommendationItemProps) => {
  const priorityDot = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500',
  };

  const content = (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200">
      {/* Priority Dot */}
      <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[priority]} flex-shrink-0`} />

      {/* Icon Container */}
      <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors text-sm">
          {title}
        </p>
        <p className="text-sm text-slate-700 truncate mt-0.5">
          {description}
        </p>
      </div>

      {/* Arrow */}
      {href && (
        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all flex-shrink-0" />
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
};

interface AdminDashboardClientProps {
  user: { schoolId?: string; name?: string };
  students: Student[];
  teachers: Teacher[];
  classes: Class[];
  sections: Section[];
  timetables: Timetable[];
  feePayments: StudentFeePayment[];
  salaryPayments: StaffSalaryPayment[];
  attendances: Attendance[];
}

export default function AdminDashboardClient({
  user,
  students,
  teachers,
  classes,
  sections,
  timetables,
  feePayments,
  salaryPayments,
  attendances,
}: AdminDashboardClientProps) {
  const {
    sessionId: globalSessionId,
    session: globalSession,
    sessions: layoutSessions,
  } = useAdminSession();

  // Filter data by school, then by global session when set
  const schoolClasses = (() => {
    let list = user?.schoolId
      ? classes.filter(c => c.schoolId === user.schoolId && c.isActive)
      : classes.filter(c => c.isActive);
    if (globalSessionId) {
      list = list.filter(c => c.sessionId === globalSessionId);
    }
    return list;
  })();

  const schoolStudents = (() => {
    let list = user?.schoolId
      ? students.filter(s => s.schoolId === user.schoolId && s.isActive)
      : students.filter(s => s.isActive);
    if (globalSessionId && globalSession) {
      list = list.filter(s =>
        s.academicSession === globalSessionId || s.academicSession === globalSession.name
      );
    }
    return list;
  })();

  const schoolTeachers = user?.schoolId
    ? teachers.filter(t => t.schoolId === user.schoolId && t.isActive)
    : teachers.filter(t => t.isActive);

  const schoolSessions = user?.schoolId
    ? layoutSessions.filter(s => s.schoolId === user.schoolId)
    : layoutSessions;

  const schoolSections = user?.schoolId
    ? sections.filter(s => s.schoolId === user.schoolId && s.isActive)
    : sections.filter(s => s.isActive);

  const schoolTimetables = user?.schoolId
    ? timetables.filter(t => t.schoolId === user.schoolId)
    : timetables;

  const totalStudents = schoolStudents.length;
  const totalTeachers = schoolTeachers.length;
  const totalClasses = schoolClasses.length;

  // Calculate today's attendance percentage
  const todayAttendancePercentage = (() => {
    if (attendances.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toDateString();

    const studentIds = schoolStudents.map(s => s.id);
    const staffIds = schoolTeachers.map(t => t.id);

    // Filter today's attendances for this school
    const todayAttendances = attendances.filter(a => {
      if (user?.schoolId && a.schoolId !== user.schoolId) return false;
      const attendanceDate = new Date(a.date);
      attendanceDate.setHours(0, 0, 0, 0);
      return attendanceDate.toDateString() === todayString;
    });

    // Count present for students
    const studentPresent = todayAttendances.filter(a =>
      a.studentId && studentIds.includes(a.studentId) && a.status === 'Present'
    ).length;

    // Count present for staff
    const staffPresent = todayAttendances.filter(a =>
      a.staffId && staffIds.includes(a.staffId) && a.status === 'Present'
    ).length;

    const totalPeople = schoolStudents.length + schoolTeachers.length;
    const totalPresent = studentPresent + staffPresent;

    return totalPeople > 0 ? Math.round((totalPresent / totalPeople) * 100) : 0;
  })();

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Generate recommendations - Priority order: session, students, fee, salary, timetable, students in class
  const recommendations: RecommendationItemProps[] = [];

  // Priority 1: Check if no sessions exist (foundational)
  if (schoolSessions.length === 0) {
    recommendations.push({
      icon: Calendar,
      iconBg: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
      title: 'No Academic Sessions',
      description: 'Create an academic session to organize classes and students',
      href: ROUTES.ADMIN.SESSIONS_CREATE,
      priority: 'high',
    });
  }

  // Priority 2: Check if no students exist
  if (totalStudents === 0) {
    recommendations.push({
      icon: UserPlus,
      iconBg: 'bg-gradient-to-br from-slate-800 to-slate-800',
      title: 'No Students Enrolled',
      description: 'Start by enrolling your first student to begin managing your school',
      href: ROUTES.ADMIN.STUDENTS_CREATE,
      priority: 'high',
    });
  }

  // Priority 3: Check current session has no classes (when session is selected)
  if (globalSessionId && globalSession && schoolClasses.length === 0 && schoolSessions.length > 0) {
    recommendations.push({
      icon: BookOpen,
      iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
      title: `Session "${globalSession.name}" has no classes`,
      description: 'Create classes for this session to organize students',
      href: ROUTES.ADMIN.CLASSES_CREATE,
      priority: 'high',
    });
  }

  // Priority 4: Check if current month has no fees generated
  const currentMonthFees = feePayments.filter(p =>
    p.month === currentMonth &&
    p.year === currentYear &&
    (user?.schoolId ? schoolStudents.some(s => s.id === p.studentId && s.schoolId === user.schoolId) : true)
  );
  if (totalStudents > 0 && currentMonthFees.length === 0) {
    recommendations.push({
      icon: Wallet,
      iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      title: 'No fees generated for current month',
      description: `Generate fees for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      href: ROUTES.ADMIN.FEES.GENERATE,
      priority: 'high',
    });
  }

  // Priority 5: Check if current month has no salaries generated
  const currentMonthSalaries = salaryPayments.filter(p =>
    p.month === currentMonth &&
    p.year === currentYear &&
    (user?.schoolId ? schoolTeachers.some(t => t.id === p.staffId && t.schoolId === user.schoolId) : true)
  );
  if (totalTeachers > 0 && currentMonthSalaries.length === 0) {
    recommendations.push({
      icon: CreditCard,
      iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      title: 'No salaries generated for current month',
      description: `Generate salaries for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      href: ROUTES.ADMIN.SALARIES.GENERATE,
      priority: 'high',
    });
  }

  // Priority 6: Check sections with no timetables (only first one to limit to 4)
  if (recommendations.length < 4) {
    const sectionWithoutTimetable = schoolSections.find(section => {
      const hasTimetable = schoolTimetables.some(t => t.sectionId === section.id);
      return !hasTimetable;
    });
    if (sectionWithoutTimetable) {
      const sectionClass = schoolClasses.find(c => c.id === sectionWithoutTimetable.classId);
      recommendations.push({
        icon: Clock,
        iconBg: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
        title: `Section "${sectionWithoutTimetable.name}" has no timetable`,
        description: sectionClass ? `Create a timetable for ${sectionWithoutTimetable.name} - ${sectionClass.name}` : 'Create a timetable to schedule classes and subjects',
        href: `${ROUTES.ADMIN.TIMETABLES_CREATE}?sectionId=${sectionWithoutTimetable.id}`,
        priority: 'medium',
      });
    }
  }

  // Priority 7: Check classes with no students (only first one to limit to 4)
  if (recommendations.length < 4) {
    const classWithoutStudents = schoolClasses.find(cls => {
      const classStudents = schoolStudents.filter(s =>
        s.classId === cls.id || s.classApplyingFor === cls.id
      );
      return classStudents.length === 0 && totalStudents > 0;
    });
    if (classWithoutStudents) {
      recommendations.push({
        icon: GraduationCap,
        iconBg: 'bg-gradient-to-br from-pink-400 to-pink-600',
        title: `Class "${classWithoutStudents.name}" has no students`,
        description: 'Enroll students or assign existing students to this class',
        href: ROUTES.ADMIN.STUDENTS_CREATE,
        priority: 'low',
      });
    }
  }

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-slate-700 mt-1">
            Here's what's happening at your school today
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-800" />
          <span className="text-sm font-medium text-slate-800">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Active enrollments"
          icon={GraduationCap}
          trend={{ value: '+12% this month', positive: true }}
          color="emerald"
          href={ROUTES.ADMIN.STUDENTS}
        />
        <StatCard
          title="Staff Members"
          value={totalTeachers}
          subtitle="Active staff"
          icon={Briefcase}
          trend={{ value: '+3 this month', positive: true }}
          color="blue"
          href={ROUTES.ADMIN.STAFF}
        />
        <StatCard
          title="Total Classes"
          value={totalClasses}
          subtitle="Active classes"
          icon={BookOpen}
          color="purple"
          href={ROUTES.ADMIN.CLASSES}
        />
        <StatCard
          title="Attendance Rate"
          value={`${todayAttendancePercentage}%`}
          subtitle="Today's average"
          icon={BarChart3}
          trend={{ value: '+2% vs last week', positive: true }}
          color="orange"
          href={ROUTES.ADMIN.ATTENDANCE.STUDENTS}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-700" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction
              icon={UserPlus}
              title="Enroll Student"
              description="Add a new student"
              href={ROUTES.ADMIN.STUDENTS_CREATE}
              color="bg-gradient-to-br from-slate-800 to-slate-800"
            />
            <QuickAction
              icon={Briefcase}
              title="Add Staff"
              description="Register staff member"
              href={ROUTES.ADMIN.STAFF_CREATE}
              color="bg-gradient-to-br from-blue-400 to-blue-600"
            />
            <QuickAction
              icon={BookOpen}
              title="Create Class"
              description="Add a new class"
              href={ROUTES.ADMIN.CLASSES_CREATE}
              color="bg-gradient-to-br from-purple-400 to-purple-600"
            />
            <QuickAction
              icon={Wallet}
              title="Generate Fees"
              description="Create fee records"
              href={ROUTES.ADMIN.FEES.GENERATE}
              color="bg-gradient-to-br from-orange-400 to-orange-600"
            />
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Actionable items to improve your school management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-slate-800" />
                </div>
                <p className="text-slate-900 font-medium">All set! 🎉</p>
                <p className="text-sm text-slate-700 mt-1">No recommendations at this time</p>
              </div>
            ) : (
              recommendations.slice(0, 4).map((rec, index) => (
                <RecommendationItem
                  key={index}
                  icon={rec.icon}
                  iconBg={rec.iconBg}
                  title={rec.title}
                  description={rec.description}
                  href={rec.href}
                  priority={rec.priority}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fee Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-slate-700" />
              Fee Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Total Collected</span>
                <span className="text-lg font-bold text-slate-800">PKR 2.5M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Pending</span>
                <span className="text-lg font-bold text-orange-500">PKR 450K</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-800 h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <p className="text-xs text-slate-800">85% collection rate this month</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  if (attendances.length === 0) {
                    return (
                      <>
                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                          <p className="text-2xl font-bold text-slate-800">-</p>
                          <p className="text-xs text-slate-700 mt-1">Students</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                          <p className="text-2xl font-bold text-blue-600">-</p>
                          <p className="text-xs text-slate-700 mt-1">Staff</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-xl">
                          <p className="text-2xl font-bold text-purple-600">-</p>
                          <p className="text-xs text-slate-700 mt-1">Overall</p>
                        </div>
                      </>
                    );
                  }

                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayString = today.toDateString();

                  const studentIds = schoolStudents.map(s => s.id);
                  const staffIds = schoolTeachers.map(t => t.id);

                  // Filter today's attendances for this school
                  const todayAttendances = attendances.filter(a => {
                    if (user?.schoolId && a.schoolId !== user.schoolId) return false;
                    const attendanceDate = new Date(a.date);
                    attendanceDate.setHours(0, 0, 0, 0);
                    return attendanceDate.toDateString() === todayString;
                  });

                  // Calculate student attendance
                  const studentAttendances = todayAttendances.filter(a =>
                    a.studentId && studentIds.includes(a.studentId)
                  );
                  const studentPresent = studentAttendances.filter(a => a.status === 'Present').length;
                  const studentTotal = schoolStudents.length;
                  const studentPercentage = studentTotal > 0
                    ? Math.round((studentPresent / studentTotal) * 100)
                    : 0;

                  // Calculate staff attendance
                  const staffAttendances = todayAttendances.filter(a =>
                    a.staffId && staffIds.includes(a.staffId)
                  );
                  const staffPresent = staffAttendances.filter(a => a.status === 'Present').length;
                  const staffTotal = schoolTeachers.length;
                  const staffPercentage = staffTotal > 0
                    ? Math.round((staffPresent / staffTotal) * 100)
                    : 0;

                  // Calculate overall attendance
                  const overallTotal = studentTotal + staffTotal;
                  const overallPresent = studentPresent + staffPresent;
                  const overallPercentage = overallTotal > 0
                    ? Math.round((overallPresent / overallTotal) * 100)
                    : 0;

                  return (
                    <>
                      <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-slate-800">{studentPercentage}%</p>
                        <p className="text-xs text-slate-700 mt-1">Students</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">{staffPercentage}%</p>
                        <p className="text-xs text-slate-700 mt-1">Staff</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <p className="text-2xl font-bold text-purple-600">{overallPercentage}%</p>
                        <p className="text-xs text-slate-700 mt-1">Overall</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-slate-800">Today's attendance snapshot</p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">JAN</span>
                  <span className="text-lg font-bold text-purple-700">25</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Parent-Teacher Meeting</p>
                  <p className="text-sm text-slate-700">10:00 AM - 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">FEB</span>
                  <span className="text-lg font-bold text-blue-700">01</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Annual Sports Day</p>
                  <p className="text-sm text-slate-700">All Day Event</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
