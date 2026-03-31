'use client';
import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { User } from '@/types';
import { navSections } from './admin-sidebar-nav-items';
import { NavItem } from './admin-sidebar-nav-item';
import { Submenu } from './admin-sidebar-submenu';
import { AdminSidebarHeader } from './admin-sidebar-header';
import { AdminSidebarToggle } from './admin-sidebar-toggle';
import { isHrefAllowedBySubscription } from '@/lib/admin-subscription-path';
import { getAllMenuHrefs, calculateSubmenuActiveStates } from './admin-sidebar-utils';
import type { SubscriptionPermissionRow } from './admin-subscription-gate';

interface AdminSidebarProps {
  user: User | null | undefined;
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  subscriptionPermissionsByModule: Record<string, SubscriptionPermissionRow> | null;
  subscriptionPermissionBypass: boolean;
}

export function AdminSidebar({
  user,
  collapsed,
  onCollapseChange,
  sidebarOpen,
  onSidebarOpenChange,
  subscriptionPermissionsByModule,
  subscriptionPermissionBypass,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isHrefSubscriptionLocked = useMemo(
    () => (href: string) =>
      !isHrefAllowedBySubscription(
        href,
        subscriptionPermissionsByModule,
        subscriptionPermissionBypass
      ),
    [subscriptionPermissionsByModule, subscriptionPermissionBypass]
  );

  const sections = useMemo(() => (user ? navSections : []), [user]);

  const filteredNavItems = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections]
  );

  const allMenuHrefs = useMemo(
    () => getAllMenuHrefs(filteredNavItems),
    [filteredNavItems]
  );

  // Calculate active states for all submenus
  const submenuActiveStates = useMemo(
    () => calculateSubmenuActiveStates(pathname, allMenuHrefs),
    [pathname, allMenuHrefs]
  );

  // Initialize and manage submenu open states
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(
    submenuActiveStates
  );

  // Update submenu states when active states change
  useEffect(() => {
    setOpenSubmenus(submenuActiveStates);
  }, [submenuActiveStates]);

  // Toggle submenu - only one open at a time
  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => {
      const isCurrentlyOpen = prev[key];
      if (isCurrentlyOpen) {
        return { ...prev, [key]: false };
      }
      return {
        curriculum: key === 'curriculum',
        admission: key === 'admission',
        staff: key === 'staff',
        leaves: key === 'leaves',
        administration: key === 'administration',
        fee: key === 'fee',
        salary: key === 'salary',
        'expense management': key === 'expense management',
        attendance: key === 'attendance',
        accounting: key === 'accounting',
        'id cards': key === 'id cards',
        announcements: key === 'announcements',
        'app access': key === 'app access',
      };
    });
  };

  return (
    <motion.aside
      data-lms-sidebar
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'relative flex h-screen min-h-0 flex-col bg-[#0f172a] text-[#e2e8f0]',
        'fixed inset-y-0 left-0 z-[60] lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-transparent pointer-events-none" />

      {/* Header */}
      <AdminSidebarHeader
        collapsed={collapsed}
        onClose={() => onSidebarOpenChange(false)}
      />

      {/* Navigation */}
      <nav className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            {!collapsed && (
              <p className="px-3 pb-2 pt-1 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                if (item.type === 'submenu') {
                  const submenuKey = item.label.toLowerCase();
                  return (
                    <Submenu
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      items={item.items}
                      pathname={pathname}
                      collapsed={collapsed}
                      isOpen={openSubmenus[submenuKey] || false}
                      onToggle={() => toggleSubmenu(submenuKey)}
                      isActive={submenuActiveStates[submenuKey] || false}
                      onExpand={() => onCollapseChange(false)}
                      onNavigate={() => onSidebarOpenChange(false)}
                      isHrefSubscriptionLocked={isHrefSubscriptionLocked}
                    />
                  );
                }
                /** Paths under /admin/students that are not the main student list (sidebar uses separate items). */
                const studentListExclusionRoutes = [
                  ROUTES.ADMIN.STUDENTS_CREATE,
                  ROUTES.ADMIN.STUDENTS_PROMOTE,
                  ROUTES.ADMIN.STUDENTS_DEMOTE,
                  ROUTES.ADMIN.STUDENTS_ID_CARDS,
                ];
                const onStudentListExclusionRoute =
                  !!pathname &&
                  studentListExclusionRoutes.some(
                    (r) => pathname === r || pathname.startsWith(r + '/')
                  );
                const isActive =
                  item.href === ROUTES.ADMIN.DASHBOARD
                    ? pathname === item.href
                    : item.href === ROUTES.ADMIN.STUDENTS
                      ? !!pathname &&
                      !onStudentListExclusionRoute &&
                      (pathname === item.href || pathname.startsWith(item.href + '/'))
                      : pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <NavItem
                    key={`${section.title}-${item.label}`}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    active={isActive}
                    collapsed={collapsed}
                    onExpand={() => onCollapseChange(false)}
                    subscriptionLocked={isHrefSubscriptionLocked(item.href)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <AdminSidebarToggle
        collapsed={collapsed}
        onToggle={() => onCollapseChange(!collapsed)}
      />
    </motion.aside>
  );
}
