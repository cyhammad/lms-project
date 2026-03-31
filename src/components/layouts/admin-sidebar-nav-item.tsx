'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onExpand?: () => void;
  /** Not on current subscription plan; still navigates so the upgrade screen can show */
  subscriptionLocked?: boolean;
}

export function NavItem({
  icon: Icon,
  label,
  href,
  active,
  collapsed,
  onExpand,
  subscriptionLocked,
}: NavItemProps) {
  const handleClick = () => {
    if (collapsed && onExpand) {
      onExpand();
    }
  };

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        onClick={handleClick}
        title={subscriptionLocked ? 'Not included on your plan — tap to learn more' : undefined}
        aria-label={subscriptionLocked ? `${label}, not on your plan` : undefined}
        className={cn(
          'group relative flex items-center justify-start gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200',
          active
            ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-700/25'
            : 'text-[#94a3b8] hover:bg-white/5 hover:text-white',
          subscriptionLocked && !active && 'opacity-50 hover:opacity-70',
          subscriptionLocked && active && 'opacity-90'
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-transform duration-200',
            active ? 'text-white' : 'text-[#94a3b8] group-hover:text-white',
            !active && 'group-hover:scale-110'
          )}
        />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left text-current">
              {label}
            </span>
            {subscriptionLocked && (
              <Lock
                className={cn(
                  'h-4 w-4 shrink-0',
                  active ? 'text-white/80' : 'text-[#64748b] group-hover:text-[#94a3b8]'
                )}
                aria-hidden
              />
            )}
          </>
        )}
        {collapsed && subscriptionLocked && (
          <Lock
            className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]"
            aria-hidden
          />
        )}
      </Link>
    </motion.div>
  );
}
