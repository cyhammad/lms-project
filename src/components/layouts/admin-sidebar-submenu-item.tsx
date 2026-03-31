'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmenuItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onExpand?: () => void;
  onNavigate?: () => void;
  subscriptionLocked?: boolean;
}

export function SubmenuItem({
  icon: Icon,
  label,
  href,
  active,
  collapsed,
  onExpand,
  onNavigate,
  subscriptionLocked,
}: SubmenuItemProps) {
  const handleClick = () => {
    if (collapsed && onExpand) {
      onExpand();
    }
    // Close sidebar on mobile when navigating
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      title={subscriptionLocked ? 'Not included on your plan — tap to learn more' : undefined}
      aria-label={subscriptionLocked ? `${label}, not on your plan` : undefined}
      className={cn(
        'group relative ml-6 flex w-full items-center justify-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200',
        active
          ? 'bg-slate-700/10 text-slate-800'
          : 'text-[#94a3b8] hover:bg-white/5 hover:text-[#e2e8f0]',
        subscriptionLocked && !active && 'opacity-50 hover:opacity-70',
        subscriptionLocked && active && 'opacity-90'
      )}
    >
      {active && (
        <motion.div
          layoutId="activeSubmenuIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-slate-800 rounded-r-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-all duration-200',
          active ? 'text-slate-800' : 'text-[#94a3b8] group-hover:text-[#e2e8f0]'
        )}
      />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">{label}</span>
          {subscriptionLocked && (
            <Lock
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                active ? 'text-slate-800/80' : 'text-[#64748b] group-hover:text-[#94a3b8]'
              )}
              aria-hidden
            />
          )}
        </>
      )}
    </Link>
  );
}
