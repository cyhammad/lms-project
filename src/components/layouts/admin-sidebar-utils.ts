import { ROUTES } from '@/constants/routes';
import { NavItemType } from './admin-sidebar-nav-items';

/**
 * Helper function to check if a pathname matches a menu item
 * This ensures only one menu item can be active at a time
 */
export function isPathActive(
  pathname: string | null,
  itemHref: string,
  allMenuHrefs: string[],
  excludeHrefs: string[] = []
): boolean {
  if (!pathname) return false;

  // First, check if pathname is an excluded route - if so, never match
  if (excludeHrefs.some(exclude => pathname === exclude || pathname?.startsWith(exclude + '/'))) {
    return false;
  }

  // Exact match - highest priority
  if (pathname === itemHref) {
    return true;
  }

  // Check if pathname is a nested route of this item
  if (pathname?.startsWith(itemHref + '/')) {
    // Priority 1: Check if pathname exactly matches another menu item (exact match wins)
    const exactMatchInOtherMenus = allMenuHrefs.find(
      href => href !== itemHref && pathname === href
    );
    if (exactMatchInOtherMenus) {
      return false;
    }

    // Priority 2: Check if pathname is nested under another menu item that's more specific
    // (longer href = more specific, so it should win)
    const moreSpecificMatch = allMenuHrefs.find(
      href => href !== itemHref &&
        href.length > itemHref.length &&
        pathname?.startsWith(href + '/')
    );
    if (moreSpecificMatch) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavItemsByPermissions(
  navItems: NavItemType[],
  userPermissions: Array<{ module: string; canView: boolean }> = []
): NavItemType[] {
  return navItems.reduce<NavItemType[]>((acc, item) => {
    // Always include Dashboard
    if (item.label === 'Dashboard') {
      acc.push(item);
      return acc;
    }

    if (item.type === 'submenu') {
      if (item.label === 'Administration') {
        const visibleItems = item.items.filter(subItem => {
          const permissionModule = subItem.label === 'School' ? 'SCHOOL_DETAILS' : 'ADMINS';
          const perm = userPermissions.find(p => p.module === permissionModule);
          return perm?.canView;
        });

        if (visibleItems.length > 0) {
          acc.push({ ...item, items: visibleItems });
        }
      } else {
        // Other submenus map directly to a module
        if (item.label === 'ID Cards') {
          const st = userPermissions.find(p => p.module === 'STUDENTS')?.canView;
          const sf = userPermissions.find(p => p.module === 'STAFF')?.canView;
          if (st || sf) {
            acc.push(item);
          }
          return acc;
        }

        const moduleName: Record<string, string> = {
          Curriculum: 'ACADEMICS',
          Admission: 'ADMISSION',
          Staff: 'STAFF',
          Leaves: 'STAFF',
          Fee: 'FEE',
          Salary: 'SALARY',
          'Expense Management': 'ACCOUNTING',
          Attendance: 'ATTENDANCE',
          Accounting: 'ACCOUNTING',
          Announcements: 'ANNOUNCEMENTS',
          'App Access': 'APP_ACCESS',
        };

        const targetModule = moduleName[item.label];

        if (targetModule) {
          const perm = userPermissions.find(p => p.module === targetModule);
          if (perm?.canView) {
            acc.push(item);
          }
        }
      }
    } else {
      if (item.label === 'Students') {
        const perm = userPermissions.find((p) => p.module === 'STUDENTS');
        if (perm?.canView) acc.push(item);
        return acc;
      }
      if (item.label === 'Timetable' || item.label === 'Exams') {
        const perm = userPermissions.find((p) => p.module === 'ACADEMICS');
        if (perm?.canView) acc.push(item);
        return acc;
      }
      if (item.label === 'Event Calendar') {
        const perm = userPermissions.find((p) => p.module === 'SCHOOL_DETAILS');
        if (perm?.canView) acc.push(item);
        return acc;
      }
      acc.push(item);
    }

    return acc;
  }, []);
}

/**
 * Get all menu item hrefs across all submenus
 */
export function getAllMenuHrefs(filteredNavItems: NavItemType[]): string[] {
  return filteredNavItems
    .filter(item => item.type === 'submenu')
    .flatMap(item => (item as Extract<NavItemType, { type: 'submenu' }>).items.map(i => i.href));
}

/**
 * Calculate active states for all submenus
 */
export function calculateSubmenuActiveStates(
  pathname: string | null,
  allMenuHrefs: string[]
): Record<string, boolean> {
  const curriculumItems = [
    { href: ROUTES.ADMIN.SESSIONS },
    { href: ROUTES.ADMIN.CLASSES },
    { href: ROUTES.ADMIN.SUBJECTS },
    { href: ROUTES.ADMIN.SECTIONS },
  ];
  const isCurriculumActive = curriculumItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const admissionItems = [
    { href: ROUTES.ADMIN.STUDENTS_CREATE },
    { href: ROUTES.ADMIN.STUDENTS_PROMOTE },
    { href: ROUTES.ADMIN.STUDENTS_DEMOTE },
  ];
  const isAdmissionActive = admissionItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const staffItems = [
    { href: ROUTES.ADMIN.STAFF_CREATE },
    { href: ROUTES.ADMIN.STAFF },
    { href: ROUTES.ADMIN.STAFF_WORK_CALENDAR },
  ];
  const isStaffActive = staffItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const leavesItems = [
    { href: ROUTES.ADMIN.STAFF_LEAVES_TYPES },
    { href: ROUTES.ADMIN.STAFF_LEAVES_REQUESTS },
    { href: ROUTES.ADMIN.STAFF_LEAVES_HISTORY },
  ];
  const isLeavesActive = leavesItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const administrationItems = [
    { href: ROUTES.ADMIN.ADMINISTRATION.SCHOOL },
    { href: ROUTES.ADMIN.ADMINISTRATION.ADMINS },
  ];
  const isAdministrationActive = administrationItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const feeItems = [
    { href: ROUTES.ADMIN.FEES.SETTINGS },
    { href: ROUTES.ADMIN.FEES.VIEW },
    { href: ROUTES.ADMIN.FEES.GENERATE },
    { href: ROUTES.ADMIN.FEES.COLLECT },
    { href: ROUTES.ADMIN.FEES.HISTORY },
  ];
  const isFeeActive = feeItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const salaryItems = [
    { href: ROUTES.ADMIN.SALARY_POLICIES.OVERVIEW },
    { href: ROUTES.ADMIN.SALARY_POLICIES.SECURITY_DEDUCTION },
    { href: ROUTES.ADMIN.SALARY_POLICIES.LEAVE_DEDUCTION },
    { href: ROUTES.ADMIN.SALARIES.VIEW },
    { href: ROUTES.ADMIN.SALARIES.GENERATE },
    { href: ROUTES.ADMIN.SALARIES.PAY },
    { href: ROUTES.ADMIN.SALARIES.HISTORY },
  ];
  const isSalaryActive = salaryItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const attendanceItems = [
    { href: ROUTES.ADMIN.ATTENDANCE.STUDENTS },
    { href: ROUTES.ADMIN.ATTENDANCE.STAFF },
    { href: ROUTES.ADMIN.ATTENDANCE.TEACHERS },
  ];
  const isAttendanceActive = attendanceItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const expenseItems = [
    { href: ROUTES.ADMIN.EXPENSES },
    { href: ROUTES.ADMIN.EXPENSES_CREATE },
    { href: ROUTES.ADMIN.EXPENSES_CATEGORIES },
  ];
  const isExpenseManagementActive = expenseItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const accountingItems = [
    { href: ROUTES.ADMIN.ACCOUNTING.OVERVIEW },
    { href: ROUTES.ADMIN.ACCOUNTING.MONTHLY },
    { href: ROUTES.ADMIN.ACCOUNTING.QUARTERLY },
    { href: ROUTES.ADMIN.ACCOUNTING.YEARLY },
  ];
  const isAccountingActive = accountingItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const idCardsItems = [
    { href: ROUTES.ADMIN.STAFF_ID_CARDS },
    { href: ROUTES.ADMIN.STUDENTS_ID_CARDS },
  ];
  const isIdCardsActive = idCardsItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const announcementsItems = [
    { href: ROUTES.ADMIN.ANNOUNCEMENTS },
    { href: ROUTES.ADMIN.ANNOUNCEMENTS_CREATE },
  ];
  const isAnnouncementsActive = announcementsItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  const appAccessItems = [
    { href: ROUTES.ADMIN.APP_ACCESS.STAFF },
    { href: ROUTES.ADMIN.APP_ACCESS.PARENTS },
  ];
  const isAppAccessActive = appAccessItems.some(item => isPathActive(pathname, item.href, allMenuHrefs));

  return {
    curriculum: isCurriculumActive,
    admission: isAdmissionActive,
    staff: isStaffActive,
    leaves: isLeavesActive,
    administration: isAdministrationActive,
    fee: isFeeActive,
    salary: isSalaryActive,
    'expense management': isExpenseManagementActive,
    attendance: isAttendanceActive,
    accounting: isAccountingActive,
    'id cards': isIdCardsActive,
    announcements: isAnnouncementsActive,
    'app access': isAppAccessActive,
  };
}
