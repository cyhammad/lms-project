'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { LogoutConfirmDialog } from '@/components/auth/logout-button';
import type { User } from '@/types';
import { AdminSidebarHeader } from './admin-sidebar-header';
import { AdminSidebarToggle } from './admin-sidebar-toggle';
import { NavItem } from './admin-sidebar-nav-item';
import { superAdminNavSections } from './super-admin-sidebar-nav-items';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

function isSuperAdminNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === ROUTES.SUPER_ADMIN.DASHBOARD) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SuperAdminHeader({
  user,
  onOpenSidebar,
}: {
  user: User | null | undefined;
  onOpenSidebar: () => void;
}) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white px-6 shadow-sm">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="text-[#64748b] hover:text-[#0f172a] lg:hidden"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg border border-[#e2e8f0] py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="mx-1 hidden h-8 w-px bg-[#e2e8f0] sm:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="group -m-2 flex cursor-pointer items-center gap-2 rounded-xl p-2 pl-2 transition-all hover:bg-[#f1f5f9]"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 font-semibold text-white shadow-lg shadow-slate-700/20 transition-all group-hover:shadow-xl group-hover:shadow-slate-700/30">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-[#0f172a] transition-colors group-hover:text-slate-800">
                {user?.name || 'User'}
              </p>
              <p className="text-xs capitalize text-[#64748b]">
                {(user?.role as string)?.toLowerCase()?.replace('_', ' ') || 'Super admin'}
              </p>
            </div>
            <ChevronDown
              className={`hidden h-4 w-4 text-[#94a3b8] transition-transform md:block ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" aria-hidden onClick={() => setUserMenuOpen(false)} />
              <div
                className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    router.push(ROUTES.SUPER_ADMIN.SETTINGS);
                    setUserMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#334155] hover:bg-[#f8fafc]"
                >
                  <Settings className="h-4 w-4 text-[#64748b]" />
                  Settings
                </button>
                <div className="my-1 border-t border-[#f1f5f9]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setLogoutDialogOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[#334155] hover:bg-[#f8fafc] hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 text-[#64748b]" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <LogoutConfirmDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </header>
  );
}

export function SuperAdminLayout({ children, initialUser }: SuperAdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = initialUser;
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#f8fafc]">
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-800/50 to-transparent" />

        <AdminSidebarHeader
          collapsed={collapsed}
          onClose={() => setSidebarOpen(false)}
          subtitle="Platform administration"
        />

        <nav className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {superAdminNavSections.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="px-3 pb-2 pt-1 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    active={isSuperAdminNavActive(pathname, item.href)}
                    collapsed={collapsed}
                    onExpand={() => setCollapsed(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <AdminSidebarToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        <SuperAdminHeader user={user} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0f172a]/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
