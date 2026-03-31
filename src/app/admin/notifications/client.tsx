'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudents } from '@/hooks/use-students';
import { useTeachers } from '@/hooks/use-teachers';
import { useStudentFeePayments } from '@/hooks/use-student-fee-payments';
import { useStaffSalaryPayments } from '@/hooks/use-staff-salary-payments';
import { useSessions } from '@/hooks/use-sessions';
import { useClasses } from '@/hooks/use-classes';
import { useSections } from '@/hooks/use-sections';
import { useTimetables } from '@/hooks/use-timetables';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import {
    Bell,
    Wallet,
    CreditCard,
    CheckCircle2,
    Clock,
    DollarSign,
    User,
    Calendar,
    X,
    Filter
} from 'lucide-react';
import { SessionPayload } from '@/lib/session';

interface NotificationItem {
    id: string;
    type: 'fee' | 'salary' | 'system' | 'reminder';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    timestamp: Date;
    read: boolean;
    href?: string;
    icon: React.ElementType;
    iconBg: string;
}

interface NotificationsClientProps {
    user: SessionPayload;
}

export default function NotificationsClient({ user }: NotificationsClientProps) {
    const { students } = useStudents();
    const { teachers } = useTeachers();
    const { payments: feePayments } = useStudentFeePayments();
    const { payments: salaryPayments } = useStaffSalaryPayments();
    const { sessions } = useSessions();
    const { classes } = useClasses();
    const { sections } = useSections();
    const { timetables } = useTimetables();

    const [filter, setFilter] = useState<'all' | 'unread' | 'fee' | 'salary' | 'system'>('all');
    const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

    // Filter data by school
    const schoolStudents = user?.schoolId
        ? students.filter(s => s.schoolId === user.schoolId && s.isActive)
        : students.filter(s => s.isActive);

    const schoolTeachers = user?.schoolId
        ? teachers.filter(t => t.schoolId === user.schoolId && t.isActive)
        : teachers.filter(t => t.isActive);

    const schoolClasses = user?.schoolId
        ? classes.filter(c => c.schoolId === user.schoolId && c.isActive)
        : classes.filter(c => c.isActive);

    const schoolSessions = user?.schoolId
        ? sessions.filter(s => s.schoolId === user.schoolId)
        : sessions;

    const schoolSections = user?.schoolId
        ? sections.filter(s => s.schoolId === user.schoolId && s.isActive)
        : sections.filter(s => s.isActive);

    const schoolTimetables = user?.schoolId
        ? timetables.filter(t => t.schoolId === user.schoolId)
        : timetables;

    // Get current date
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Generate notifications
    const notifications = useMemo<NotificationItem[]>(() => {
        const items: NotificationItem[] = [];

        // 1. Pending Fees
        const pendingFees = feePayments.filter(p => {
            if (p.status === 'Paid') return false;
            const student = schoolStudents.find(s => s.id === p.studentId);
            return student && (user?.schoolId ? student.schoolId === user.schoolId : true);
        });

        pendingFees.forEach(payment => {
            const student = schoolStudents.find(s => s.id === payment.studentId);
            if (!student) return;

            const isOverdue = payment.dueDate && new Date(payment.dueDate) < currentDate;
            const daysOverdue = payment.dueDate
                ? Math.floor((currentDate.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            items.push({
                id: `fee-${payment.id}`,
                type: 'fee',
                title: isOverdue
                    ? `Overdue Fee Payment - ${student.name}`
                    : `Pending Fee Payment - ${student.name}`,
                description: isOverdue
                    ? `Fee payment of ₹${payment.finalAmount} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`
                    : `Fee payment of ₹${payment.finalAmount} is due ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'soon'}`,
                priority: isOverdue ? 'high' : 'medium',
                timestamp: payment.dueDate ? new Date(payment.dueDate) : new Date(),
                read: readNotifications.has(`fee-${payment.id}`),
                href: `${ROUTES.ADMIN.FEES.STUDENT(student.id)}`,
                icon: Wallet,
                iconBg: isOverdue ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-orange-400 to-orange-600',
            });
        });

        // 2. Pending Salaries
        const pendingSalaries = salaryPayments.filter(p => {
            if (p.status === 'Paid') return false;
            const teacher = schoolTeachers.find(t => t.id === p.staffId);
            return teacher && (user?.schoolId ? teacher.schoolId === user.schoolId : true);
        });

        pendingSalaries.forEach(payment => {
            const teacher = schoolTeachers.find(t => t.id === payment.staffId);
            if (!teacher) return;

            const isOverdue = payment.dueDate && new Date(payment.dueDate) < currentDate;
            const daysOverdue = payment.dueDate
                ? Math.floor((currentDate.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            items.push({
                id: `salary-${payment.id}`,
                type: 'salary',
                title: isOverdue
                    ? `Overdue Salary Payment - ${teacher.name}`
                    : `Pending Salary Payment - ${teacher.name}`,
                description: isOverdue
                    ? `Salary payment of ₹${payment.finalAmount} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`
                    : `Salary payment of ₹${payment.finalAmount} is due ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'soon'}`,
                priority: isOverdue ? 'high' : 'medium',
                timestamp: payment.dueDate ? new Date(payment.dueDate) : new Date(),
                read: readNotifications.has(`salary-${payment.id}`),
                href: `${ROUTES.ADMIN.SALARIES.STAFF(teacher.id)}`,
                icon: CreditCard,
                iconBg: isOverdue ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-blue-400 to-blue-600',
            });
        });

        // 3. System Notifications
        if (schoolSessions.length === 0) {
            items.push({
                id: 'system-no-sessions',
                type: 'system',
                title: 'No Academic Sessions',
                description: 'Create your first academic session to start managing your school',
                priority: 'high',
                timestamp: new Date(),
                read: readNotifications.has('system-no-sessions'),
                href: ROUTES.ADMIN.SESSIONS_CREATE,
                icon: Calendar,
                iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
            });
        }

        if (schoolStudents.length === 0) {
            items.push({
                id: 'system-no-students',
                type: 'system',
                title: 'No Students Enrolled',
                description: 'Enroll your first student to start managing admissions',
                priority: 'high',
                timestamp: new Date(),
                read: readNotifications.has('system-no-students'),
                href: ROUTES.ADMIN.STUDENTS_CREATE,
                icon: User,
                iconBg: 'bg-gradient-to-br from-slate-800 to-slate-800',
            });
        }

        // Check for sections without timetables
        const sectionsWithoutTimetables = schoolSections.filter(section => {
            return !schoolTimetables.some(t => t.sectionId === section.id);
        });

        if (sectionsWithoutTimetables.length > 0) {
            sectionsWithoutTimetables.slice(0, 3).forEach(section => {
                const sectionClass = schoolClasses.find(c => c.id === section.classId);
                items.push({
                    id: `system-no-timetable-${section.id}`,
                    type: 'system',
                    title: `Section "${section.name}" has no timetable`,
                    description: sectionClass ? `Create a timetable for ${section.name} - ${sectionClass.name}` : 'Create a timetable to schedule classes and subjects',
                    priority: 'medium',
                    timestamp: new Date(),
                    read: readNotifications.has(`system-no-timetable-${section.id}`),
                    href: `${ROUTES.ADMIN.TIMETABLES_CREATE}?sectionId=${section.id}`,
                    icon: Clock,
                    iconBg: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
                });
            });
        }

        // Check for current month fees
        const currentMonthFees = feePayments.filter(p =>
            p.month === currentMonth &&
            p.year === currentYear &&
            (user?.schoolId ? schoolStudents.some(s => s.id === p.studentId && s.schoolId === user.schoolId) : true)
        );

        if (schoolStudents.length > 0 && currentMonthFees.length === 0) {
            items.push({
                id: 'system-no-fees',
                type: 'system',
                title: 'No fees generated for current month',
                description: `Generate fees for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                priority: 'high',
                timestamp: new Date(),
                read: readNotifications.has('system-no-fees'),
                href: ROUTES.ADMIN.FEES.GENERATE,
                icon: DollarSign,
                iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
            });
        }

        // Check for current month salaries
        const currentMonthSalaries = salaryPayments.filter(p =>
            p.month === currentMonth &&
            p.year === currentYear &&
            (user?.schoolId ? schoolTeachers.some(t => t.id === p.staffId && t.schoolId === user.schoolId) : true)
        );

        if (schoolTeachers.length > 0 && currentMonthSalaries.length === 0) {
            items.push({
                id: 'system-no-salaries',
                type: 'system',
                title: 'No salaries generated for current month',
                description: `Generate salaries for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                priority: 'high',
                timestamp: new Date(),
                read: readNotifications.has('system-no-salaries'),
                href: ROUTES.ADMIN.SALARIES.GENERATE,
                icon: CreditCard,
                iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
            });
        }

        // Sort by priority and timestamp
        return items.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.timestamp.getTime() - a.timestamp.getTime();
        });
    }, [feePayments, salaryPayments, schoolStudents, schoolTeachers, schoolSessions, schoolClasses, schoolTimetables, user, currentMonth, currentYear, readNotifications]);

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        if (filter === 'unread') return notifications.filter(n => !n.read);
        return notifications.filter(n => n.type === filter);
    }, [notifications, filter]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setReadNotifications(prev => new Set([...prev, id]));
    };

    const markAllAsRead = () => {
        setReadNotifications(new Set(notifications.map(n => n.id)));
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((currentDate.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-slate-800" />
                        Notifications
                    </h1>
                    <p className="text-slate-700 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={markAllAsRead} variant="outline" size="sm">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-slate-700" />
                {(['all', 'unread', 'fee', 'salary', 'system'] as const).map((filterType) => (
                    <button
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === filterType
                            ? 'bg-slate-700 text-white shadow-lg shadow-slate-700/25'
                            : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        {filterType === 'unread' && unreadCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-white text-xs rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
                        <p className="text-slate-700">
                            {filter === 'unread'
                                ? "You're all caught up! No unread notifications."
                                : 'No notifications match your current filter.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                        const Icon = notification.icon;
                        const content = (
                            <Card className={`transition-all hover:shadow-md ${notification.read ? 'opacity-75' : 'border-l-4 border-l-slate-700'}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${notification.iconBg} shadow-lg`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className={`text-sm font-semibold ${notification.read ? 'text-slate-800' : 'text-slate-900'}`}>
                                                    {notification.title}
                                                </h3>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-slate-700 rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-700 mb-2">{notification.description}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-slate-800 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {getTimeAgo(notification.timestamp)}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${notification.priority === 'high'
                                                    ? 'bg-red-100 text-red-700'
                                                    : notification.priority === 'medium'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {notification.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                            className="p-1.5 text-slate-800 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                            title={notification.read ? 'Mark as unread' : 'Mark as read'}
                                        >
                                            {notification.read ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : (
                                                <X className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        );

                        if (notification.href) {
                            return (
                                <Link key={notification.id} href={notification.href} onClick={() => markAsRead(notification.id)}>
                                    {content}
                                </Link>
                            );
                        }

                        return <div key={notification.id}>{content}</div>;
                    })}
                </div>
            )}
        </div>
    );
}
