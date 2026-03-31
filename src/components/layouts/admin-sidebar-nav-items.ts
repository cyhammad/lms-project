import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserPlus,
  List,
  Briefcase,
  Building2,
  UserCog,
  School,
  Calendar,
  BookMarked,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  DollarSign,
  Wallet,
  ClipboardCheck,
  BarChart3,
  TrendingUp,
  FileText,
  Shield,
  CalendarX,
  Bell,
  Key,
  BookHeart,
  UserCheck,
  History,
  Settings,
  FolderTree,
  Layers,
  CalendarDays,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export type NavItemType =
  | { type: 'item'; icon: React.ElementType; label: string; href: string }
  | { type: 'submenu'; icon: React.ElementType; label: string; items: Array<{ icon: React.ElementType; label: string; href: string }> };

export interface NavSection {
  title: string;
  items: NavItemType[];
}

export const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ type: 'item', icon: LayoutDashboard, label: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD }],
  },
  {
    title: 'Academics',
    items: [
      {
        type: 'submenu',
        icon: Layers,
        label: 'Curriculum',
        items: [
          { icon: Calendar, label: 'Sessions', href: ROUTES.ADMIN.SESSIONS },
          { icon: BookOpen, label: 'Classes', href: ROUTES.ADMIN.CLASSES },
          { icon: Users, label: 'Sections', href: ROUTES.ADMIN.SECTIONS },
          { icon: BookMarked, label: 'Subjects', href: ROUTES.ADMIN.SUBJECTS },
        ],
      },
      { type: 'item', icon: Calendar, label: 'Timetable', href: ROUTES.ADMIN.TIMETABLES },
      { type: 'item', icon: ClipboardList, label: 'Exams', href: ROUTES.ADMIN.EXAMS },
      { type: 'item', icon: CalendarDays, label: 'Event Calendar', href: ROUTES.ADMIN.ADMINISTRATION.EVENT_CALENDAR },
    ],
  },
  {
    title: 'People',
    items: [
      {
        type: 'submenu',
        icon: UserPlus,
        label: 'Admission',
        items: [
          { icon: UserPlus, label: 'Enroll Student', href: ROUTES.ADMIN.STUDENTS_CREATE },
          { icon: ArrowUpCircle, label: 'Promote Students', href: ROUTES.ADMIN.STUDENTS_PROMOTE },
          { icon: ArrowDownCircle, label: 'Demote Students', href: ROUTES.ADMIN.STUDENTS_DEMOTE },
        ],
      },
      { type: 'item', icon: GraduationCap, label: 'Students', href: ROUTES.ADMIN.STUDENTS },
      {
        type: 'submenu',
        icon: Briefcase,
        label: 'Staff',
        items: [
          { icon: UserPlus, label: 'Add Staff Member', href: ROUTES.ADMIN.STAFF_CREATE },
          { icon: List, label: 'All Staff Members', href: ROUTES.ADMIN.STAFF },
          { icon: Calendar, label: 'Work Calendar', href: ROUTES.ADMIN.STAFF_WORK_CALENDAR },
        ],
      },
      {
        type: 'submenu',
        icon: CreditCard,
        label: 'ID Cards',
        items: [
          { icon: Briefcase, label: 'Staff ID Cards', href: ROUTES.ADMIN.STAFF_ID_CARDS },
          { icon: GraduationCap, label: 'Student ID Cards', href: ROUTES.ADMIN.STUDENTS_ID_CARDS },
        ],
      },
    ],
  },
  {
    title: 'Attendance & Leaves',
    items: [
      {
        type: 'submenu',
        icon: ClipboardCheck,
        label: 'Attendance',
        items: [
          { icon: GraduationCap, label: 'Students', href: ROUTES.ADMIN.ATTENDANCE.STUDENTS },
          { icon: Briefcase, label: 'Staff', href: ROUTES.ADMIN.ATTENDANCE.STAFF },
          { icon: UserCheck, label: 'Teachers', href: ROUTES.ADMIN.ATTENDANCE.TEACHERS },
        ],
      },
      {
        type: 'submenu',
        icon: CalendarX,
        label: 'Leaves',
        items: [
          { icon: FileText, label: 'Leave Requests', href: ROUTES.ADMIN.STAFF_LEAVES_REQUESTS },
          { icon: History, label: 'Leave History', href: ROUTES.ADMIN.STAFF_LEAVES_HISTORY },
          { icon: CalendarX, label: 'Leave Types', href: ROUTES.ADMIN.STAFF_LEAVES_TYPES },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        type: 'submenu',
        icon: Wallet,
        label: 'Fee',
        items: [
          { icon: Settings, label: 'Fee Settings', href: ROUTES.ADMIN.FEES.SETTINGS },
          { icon: Calendar, label: 'Generate Fee', href: ROUTES.ADMIN.FEES.GENERATE },
          { icon: List, label: 'View Challans', href: ROUTES.ADMIN.FEES.VIEW },
          { icon: DollarSign, label: 'Collect Fee', href: ROUTES.ADMIN.FEES.COLLECT },
          { icon: FileText, label: 'Fee History', href: ROUTES.ADMIN.FEES.HISTORY },
        ],
      },
      {
        type: 'submenu',
        icon: CreditCard,
        label: 'Salary',
        items: [
          { icon: Shield, label: 'Salary Policies', href: ROUTES.ADMIN.SALARY_POLICIES.OVERVIEW },
          { icon: Calendar, label: 'Generate Salary', href: ROUTES.ADMIN.SALARIES.GENERATE },
          { icon: List, label: 'View Salaries', href: ROUTES.ADMIN.SALARIES.VIEW },
          { icon: DollarSign, label: 'Pay Salary', href: ROUTES.ADMIN.SALARIES.PAY },
          { icon: FileText, label: 'Salary History', href: ROUTES.ADMIN.SALARIES.HISTORY },
        ],
      },
      {
        type: 'submenu',
        icon: Wallet,
        label: 'Expense Management',
        items: [
          { icon: List, label: 'All Expenses', href: ROUTES.ADMIN.EXPENSES },
          { icon: DollarSign, label: 'Add Expense', href: ROUTES.ADMIN.EXPENSES_CREATE },
          { icon: FolderTree, label: 'Expense Categories', href: ROUTES.ADMIN.EXPENSES_CATEGORIES },
        ],
      },
      {
        type: 'submenu',
        icon: DollarSign,
        label: 'Accounting',
        items: [
          { icon: BarChart3, label: 'Overview', href: ROUTES.ADMIN.ACCOUNTING.OVERVIEW },
          { icon: Calendar, label: 'Monthly Report', href: ROUTES.ADMIN.ACCOUNTING.MONTHLY },
          { icon: FileText, label: 'Quarterly Report', href: ROUTES.ADMIN.ACCOUNTING.QUARTERLY },
          { icon: TrendingUp, label: 'Yearly Report', href: ROUTES.ADMIN.ACCOUNTING.YEARLY },
        ],
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        type: 'submenu',
        icon: Bell,
        label: 'Announcements',
        items: [
          { icon: List, label: 'All Announcements', href: ROUTES.ADMIN.ANNOUNCEMENTS },
          { icon: UserPlus, label: 'Create Announcement', href: ROUTES.ADMIN.ANNOUNCEMENTS_CREATE },
        ],
      },
      { type: 'item', icon: BookHeart, label: 'Daily Diary', href: ROUTES.ADMIN.DAILY_DIARY },
    ],
  },
  {
    title: 'System',
    items: [
      {
        type: 'submenu',
        icon: Key,
        label: 'App Access',
        items: [
          { icon: Briefcase, label: 'Staff', href: ROUTES.ADMIN.APP_ACCESS.STAFF },
          { icon: Users, label: 'Parents', href: ROUTES.ADMIN.APP_ACCESS.PARENTS },
        ],
      },
      {
        type: 'submenu',
        icon: Building2,
        label: 'Administration',
        items: [
          { icon: School, label: 'School', href: ROUTES.ADMIN.ADMINISTRATION.SCHOOL },
          { icon: UserCog, label: 'Admins', href: ROUTES.ADMIN.ADMINISTRATION.ADMINS },
        ],
      },
    ],
  },
];

/** Flat list for href collection, active-state helpers, and permission filtering */
export const navItems: NavItemType[] = navSections.flatMap((s) => s.items);
