'use client';
import { GraduationCap, X } from 'lucide-react';

interface AdminSidebarHeaderProps {
  collapsed: boolean;
  onClose: () => void;
  /** Defaults to "School Management" for school admin */
  subtitle?: string;
}

export function AdminSidebarHeader({
  collapsed,
  onClose,
  subtitle = 'School Management',
}: AdminSidebarHeaderProps) {
  return (
    <div className="relative z-[1] flex shrink-0 items-center gap-3 border-b border-white/5 px-5 py-6">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 flex-shrink-0 shadow-lg shadow-slate-700/30">
        <GraduationCap className="h-6 w-6 text-white" />
      </div>
      {!collapsed && (
        <div className="min-w-0 text-left">
          <h1 className="text-xl font-bold tracking-tight text-white">LMS</h1>
          <p className="text-xs font-medium text-[#94a3b8]">{subtitle}</p>
        </div>
      )}
      <button
        onClick={onClose}
        className="ml-auto rounded-lg p-2 text-[#94a3b8] transition-colors hover:bg-white/10 hover:text-white lg:hidden"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
