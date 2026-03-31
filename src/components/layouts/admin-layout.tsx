'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  School,
  Crown,
  Calendar,
  ChevronDown,
  Settings,
  LogOut,
} from 'lucide-react';
import { LogoutConfirmDialog } from '@/components/auth/logout-button';
import { ROUTES } from '@/constants/routes';
import { User, AcademicSession } from '@/types';
import { AdminSidebar } from './admin-sidebar';
import { AdminSessionProvider, useAdminSession } from '@/contexts/AdminSessionContext';
import {
  AdminSubscriptionGate,
  type SubscriptionPermissionRow,
} from './admin-subscription-gate';

interface AdminLayoutProps {
  children: React.ReactNode;
  initialUser?: User | null;
  sessions: AcademicSession[];
  initialSessionId: string | null;
  subscriptionPermissionsByModule: Record<string, SubscriptionPermissionRow> | null;
  subscriptionPermissionBypass: boolean;
}

function AdminHeader({
  user,
  sidebarOpen,
  setSidebarOpen,
  collapsed,
  setCollapsed,
  setSidebarOpenState,
}: {
  user: User | null | undefined;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  setSidebarOpenState: (v: boolean) => void;
}) {
  const router = useRouter();
  const { session, sessions, setSessionId } = useAdminSession();
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  return (
    <header className="relative h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        {/* School Name */}
        <div className="flex items-center gap-3 flex-1">
          <div className="hidden md:flex items-center gap-2">
            <School className="w-5 h-5 text-slate-800" />
            <h2 className="text-lg font-semibold text-slate-900">
              {user?.school?.name || 'School Name'}
            </h2>
            {user?.school?.campusName && (
              <span className="text-sm text-slate-700">
                - {user.school.campusName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Session switcher */}
        {sessions.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSessionDropdownOpen((o) => !o);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700"
              title="Change session for entire admin panel"
            >
              <Calendar className="h-4 w-4 text-slate-700" />
              <span className="max-w-[140px] truncate">
                {session?.name ?? 'Select session'}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-800" />
            </button>
            {sessionDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setSessionDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSessionId(s.id);
                        setSessionDropdownOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${session?.id === s.id ? 'bg-slate-50 font-medium text-slate-700' : 'text-slate-700'
                        }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => router.push(ROUTES.ADMIN.NOTIFICATIONS)}
            className="relative p-2.5 text-slate-700 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Subscription & plan */}
          <button
            type="button"
            onClick={() => router.push(ROUTES.ADMIN.SUBSCRIPTION)}
            className="p-2.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all"
            title="Subscription & plan"
          >
            <Crown className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-200 mx-2" />

          {/* User menu: Settings + Logout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen((o) => !o);
                setSessionDropdownOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl p-2 -m-2 pl-2 transition-all hover:bg-slate-100 cursor-pointer group"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <div className="w-10 h-10 min-w-10 bg-gradient-to-br from-slate-800 to-slate-800 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-slate-700/20 group-hover:shadow-xl group-hover:shadow-slate-700/30 transition-all">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-700 capitalize">
                  {user?.role?.replace('_', ' ') || 'Admin'}
                </p>
              </div>
              <ChevronDown
                className={`hidden md:block h-4 w-4 text-slate-800 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      router.push(ROUTES.ADMIN.SETTINGS);
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-slate-700" />
                    Settings
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setLogoutDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4 text-slate-700" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <LogoutConfirmDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </header>
  );
}

export function AdminLayout({
  children,
  initialUser,
  sessions,
  initialSessionId,
  subscriptionPermissionsByModule,
  subscriptionPermissionBypass,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = initialUser;

  return (
    <AdminSessionProvider initialSessionId={initialSessionId} sessions={sessions}>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <AdminSidebar
          user={user}
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          sidebarOpen={sidebarOpen}
          onSidebarOpenChange={setSidebarOpen}
          subscriptionPermissionsByModule={subscriptionPermissionsByModule}
          subscriptionPermissionBypass={subscriptionPermissionBypass}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader
            user={user}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            setSidebarOpenState={setSidebarOpen}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
            <AdminSubscriptionGate
              bypass={subscriptionPermissionBypass}
              permissionsByModule={subscriptionPermissionsByModule}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AdminSubscriptionGate>
          </main>
        </div>

        {/* Overlay for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminSessionProvider>
  );
}
