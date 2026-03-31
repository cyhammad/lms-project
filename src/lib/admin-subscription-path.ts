/**
 * Maps school admin panel URL paths to subscription module keys + CRUD action,
 * aligned with `lms-server/src/constants/subscription-modules.ts` and API guards.
 */
export type SubscriptionCrudAction = 'view' | 'create' | 'update' | 'delete';

export type AdminSubscriptionRequirement = {
  moduleKey: string;
  action: SubscriptionCrudAction;
};

function normalizePathname(pathname: string): string {
  const p = pathname.split('?')[0].replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

/**
 * Returns null when the route is not gated by subscription (always show UI),
 * or when the path is outside `/admin`.
 */
export function getAdminPanelSubscriptionRequirement(
  pathname: string | null
): AdminSubscriptionRequirement | null {
  if (!pathname) return null;
  const p = normalizePathname(pathname);
  if (!p.startsWith('/admin')) return null;

  // Not gated — personal / global chrome
  if (
    p === '/admin/settings' ||
    p === '/admin/notifications' ||
    p === '/admin/subscription'
  ) {
    return null;
  }

  if (p === '/admin') {
    return { moduleKey: 'admin_dashboard', action: 'view' };
  }

  // —— Administration ——
  if (p === '/admin/administration/school') {
    return { moduleKey: 'administration_school', action: 'view' };
  }
  if (p.startsWith('/admin/administration/admins')) {
    if (p.endsWith('/create')) return { moduleKey: 'administration_admins', action: 'create' };
    if (p.includes('/edit')) return { moduleKey: 'administration_admins', action: 'update' };
    return { moduleKey: 'administration_admins', action: 'view' };
  }
  if (p === '/admin/administration/event-calendar') {
    return { moduleKey: 'administration_event_calendar', action: 'view' };
  }
  if (p.startsWith('/admin/administration/campuses')) {
    if (p.endsWith('/create')) return { moduleKey: 'administration_school', action: 'create' };
    if (p.includes('/edit')) return { moduleKey: 'administration_school', action: 'update' };
    return { moduleKey: 'administration_school', action: 'view' };
  }

  // —— Academics: sessions, classes, sections, subjects, timetables ——
  const academics: Array<{ prefix: string; key: string }> = [
    { prefix: '/admin/sessions', key: 'academics_sessions' },
    { prefix: '/admin/classes', key: 'academics_classes' },
    { prefix: '/admin/sections', key: 'academics_sections' },
    { prefix: '/admin/subjects', key: 'academics_subjects' },
    { prefix: '/admin/timetables', key: 'academics_timetables' },
  ];
  for (const { prefix, key } of academics) {
    if (p === prefix || p.startsWith(`${prefix}/`)) {
      if (p.endsWith('/create')) return { moduleKey: key, action: 'create' };
      if (p.includes('/edit')) return { moduleKey: key, action: 'update' };
      return { moduleKey: key, action: 'view' };
    }
  }

  // —— Exams ——
  if (p.startsWith('/admin/exams')) {
    if (p.endsWith('/create')) return { moduleKey: 'academics_exams', action: 'create' };
    return { moduleKey: 'academics_exams', action: 'view' };
  }

  // —— Admission / students ——
  if (p === '/admin/students/create') {
    return { moduleKey: 'admission_enroll_student', action: 'create' };
  }
  if (p === '/admin/students/promote') {
    return { moduleKey: 'admission_promote_students', action: 'view' };
  }
  if (p === '/admin/students/demote') {
    return { moduleKey: 'admission_demote_students', action: 'view' };
  }
  if (p === '/admin/students/id-cards') {
    return { moduleKey: 'students_id_cards', action: 'view' };
  }
  if (p.startsWith('/admin/students')) {
    if (p.endsWith('/edit')) return { moduleKey: 'students_all', action: 'update' };
    return { moduleKey: 'students_all', action: 'view' };
  }

  // —— Staff ——
  if (p === '/admin/staff/create') {
    return { moduleKey: 'staff_add', action: 'create' };
  }
  if (p === '/admin/staff/id-cards') {
    return { moduleKey: 'staff_id_cards', action: 'view' };
  }
  if (p === '/admin/staff/work-calendar') {
    return { moduleKey: 'staff_work_calendar', action: 'view' };
  }
  if (p.startsWith('/admin/staff/leaves/types')) {
    return { moduleKey: 'leaves_types', action: 'view' };
  }
  if (p.startsWith('/admin/staff/leaves/requests')) {
    return { moduleKey: 'leaves_requests', action: 'view' };
  }
  if (p.startsWith('/admin/staff/leaves/history')) {
    return { moduleKey: 'leaves_history', action: 'view' };
  }
  if (p.startsWith('/admin/staff/')) {
    if (p.endsWith('/edit')) return { moduleKey: 'staff_all', action: 'update' };
    if (p.includes('/work-calendar')) return { moduleKey: 'staff_work_calendar', action: 'view' };
    return { moduleKey: 'staff_all', action: 'view' };
  }
  if (p === '/admin/staff') {
    return { moduleKey: 'staff_all', action: 'view' };
  }

  // —— Attendance ——
  if (p.startsWith('/admin/attendance/teachers')) {
    return { moduleKey: 'attendance_teachers', action: 'view' };
  }
  if (p.startsWith('/admin/attendance/staff')) {
    return { moduleKey: 'attendance_staff', action: 'view' };
  }
  if (p.startsWith('/admin/attendance/students')) {
    return { moduleKey: 'attendance_students', action: 'view' };
  }
  if (p === '/admin/attendance') {
    return { moduleKey: 'attendance_students', action: 'view' };
  }

  // —— Fees ——
  if (p.startsWith('/admin/fees/settings')) {
    return { moduleKey: 'fee_settings', action: 'view' };
  }
  if (p.startsWith('/admin/fees/generate')) {
    return { moduleKey: 'fee_generate', action: 'create' };
  }
  if (p.startsWith('/admin/fees/collect')) {
    return { moduleKey: 'fee_collect', action: 'view' };
  }
  if (p.startsWith('/admin/fees/history')) {
    return { moduleKey: 'fee_history', action: 'view' };
  }
  if (p.startsWith('/admin/fees')) {
    return { moduleKey: 'fee_view', action: 'view' };
  }
  if (p.startsWith('/admin/finance/fees')) {
    return { moduleKey: 'fee_view', action: 'view' };
  }

  // —— Salaries ——
  if (p.startsWith('/admin/salary-policies') || p.startsWith('/admin/salaries/policies')) {
    return { moduleKey: 'salary_policies', action: 'view' };
  }
  if (p.startsWith('/admin/salaries/generate')) {
    return { moduleKey: 'salary_generate', action: 'create' };
  }
  if (p.startsWith('/admin/salaries/pay')) {
    return { moduleKey: 'salary_pay', action: 'view' };
  }
  if (p.startsWith('/admin/salaries/history')) {
    return { moduleKey: 'salary_history', action: 'view' };
  }
  if (p.startsWith('/admin/salaries')) {
    return { moduleKey: 'salary_view', action: 'view' };
  }
  if (p.startsWith('/admin/finance/salaries')) {
    return { moduleKey: 'salary_view', action: 'view' };
  }

  // —— Expenses ——
  if (p.startsWith('/admin/expenses/categories')) {
    return { moduleKey: 'expense_categories', action: 'view' };
  }
  if (p.startsWith('/admin/expenses/create')) {
    return { moduleKey: 'expense_add', action: 'create' };
  }
  if (p.startsWith('/admin/expenses/') && p.endsWith('/edit')) {
    return { moduleKey: 'expense_all', action: 'update' };
  }
  if (p.startsWith('/admin/expenses')) {
    return { moduleKey: 'expense_all', action: 'view' };
  }

  // —— Accounting ——
  if (p === '/admin/accounting/monthly') {
    return { moduleKey: 'accounting_monthly', action: 'view' };
  }
  if (p === '/admin/accounting/quarterly') {
    return { moduleKey: 'accounting_quarterly', action: 'view' };
  }
  if (p === '/admin/accounting/yearly') {
    return { moduleKey: 'accounting_yearly', action: 'view' };
  }
  if (p === '/admin/accounting' || p.startsWith('/admin/accounting/')) {
    return { moduleKey: 'accounting_overview', action: 'view' };
  }

  // —— Announcements ——
  if (p.startsWith('/admin/announcements/create')) {
    return { moduleKey: 'announcements_create', action: 'create' };
  }
  if (p.startsWith('/admin/announcements')) {
    return { moduleKey: 'announcements_all', action: 'view' };
  }

  if (p === '/admin/daily-diary') {
    return { moduleKey: 'admin_daily_diary', action: 'view' };
  }

  // —— Policies ——
  if (p === '/admin/policies' || p === '/admin/policies/overview') {
    return { moduleKey: 'policy_overview', action: 'view' };
  }
  if (p.startsWith('/admin/policies/school-policies')) {
    if (p.endsWith('/create')) return { moduleKey: 'policy_school_policies', action: 'create' };
    if (p.includes('/edit')) return { moduleKey: 'policy_school_policies', action: 'update' };
    return { moduleKey: 'policy_school_policies', action: 'view' };
  }

  // —— App access ——
  if (p.startsWith('/admin/app-access/staff')) {
    return { moduleKey: 'app_access_staff', action: 'view' };
  }
  if (p.startsWith('/admin/app-access/parents')) {
    return { moduleKey: 'app_access_parents', action: 'view' };
  }

  // Unrecognized admin route — do not block (new screens stay reachable; API still enforces)
  return null;
}

export function subscriptionAllowsAction(
  permissionsByModule: Record<
    string,
    { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }
  > | null,
  bypass: boolean,
  requirement: AdminSubscriptionRequirement | null
): boolean {
  if (requirement === null) return true;
  if (bypass) return true;
  if (!permissionsByModule) return false;
  const row = permissionsByModule[requirement.moduleKey];
  if (!row) return false;
  switch (requirement.action) {
    case 'view':
      return row.canView;
    case 'create':
      return row.canCreate;
    case 'update':
      return row.canUpdate;
    case 'delete':
      return row.canDelete;
    default:
      return false;
  }
}

/** True when the nav target is allowed by subscription for list/view navigation (same rules as the page gate). */
export function isHrefAllowedBySubscription(
  href: string,
  permissionsByModule: Record<
    string,
    { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }
  > | null,
  bypass: boolean
): boolean {
  const requirement = getAdminPanelSubscriptionRequirement(href);
  return subscriptionAllowsAction(permissionsByModule, bypass, requirement);
}
