'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubmenuItem } from './admin-sidebar-submenu-item';

interface SubmenuProps {
  icon: React.ElementType;
  label: string;
  items: Array<{ icon: React.ElementType; label: string; href: string }>;
  pathname: string;
  collapsed?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  onExpand?: () => void;
  onNavigate?: () => void;
  /** Per-item href: true when not on subscription plan */
  isHrefSubscriptionLocked: (href: string) => boolean;
}

export function Submenu({
  icon: Icon,
  label,
  items,
  pathname,
  collapsed,
  isOpen,
  onToggle,
  isActive = false,
  onExpand,
  onNavigate,
  isHrefSubscriptionLocked,
}: SubmenuProps) {
  const allItemsLocked =
    items.length > 0 && items.every((item) => isHrefSubscriptionLocked(item.href));

  // Use the active state passed from parent, or calculate it if not provided
  const hasActiveItem = isActive !== undefined ? isActive : items.some(item => {
    // Exact match
    if (pathname === item.href) return true;

    // Check nested routes
    if (pathname?.startsWith(item.href + '/')) {
      // Get all sibling hrefs (other items in this submenu)
      const siblingHrefs = items.map(i => i.href).filter(href => href !== item.href);

      // Don't match if pathname exactly matches a sibling
      if (siblingHrefs.some(sibling => pathname === sibling)) return false;

      // Don't match if pathname is nested under a sibling
      if (siblingHrefs.some(sibling => pathname?.startsWith(sibling + '/'))) return false;

      return true;
    }

    return false;
  });

  if (collapsed) {
    const handleCollapsedClick = () => {
      if (onExpand) {
        onExpand();
      }
      // Also open the submenu if it has an active item
      if (hasActiveItem && !isOpen) {
        onToggle();
      }
    };

    return (
      <div className="relative group">
        <button
          type="button"
          onClick={handleCollapsedClick}
          title={
            allItemsLocked ? 'This section is not on your plan — expand to see links' : undefined
          }
          className={cn(
            'relative flex items-center justify-start gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors',
            hasActiveItem
              ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-700/25'
              : 'text-[#94a3b8] hover:bg-white/5 hover:text-white',
            allItemsLocked && !hasActiveItem && 'opacity-50 hover:opacity-70',
            allItemsLocked && hasActiveItem && 'opacity-90'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              hasActiveItem ? 'text-white' : 'text-[#94a3b8]'
            )}
          />
          {allItemsLocked && (
            <Lock
              className={cn(
                'absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2',
                hasActiveItem ? 'text-white/80' : 'text-[#64748b]'
              )}
              aria-hidden
            />
          )}
        </button>
      </div>
    );
  }

  const handleToggle = () => {
    if (collapsed && onExpand) {
      onExpand();
    }
    onToggle();
  };

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={handleToggle}
        title={allItemsLocked ? 'Items in this section may not be on your plan' : undefined}
        className={cn(
          'group flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200',
          hasActiveItem
            ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg shadow-slate-700/25'
            : 'text-[#94a3b8] hover:bg-white/5 hover:text-white',
          allItemsLocked && !hasActiveItem && 'opacity-50 hover:opacity-70',
          allItemsLocked && hasActiveItem && 'opacity-90'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0 transition-transform duration-200',
              hasActiveItem ? 'text-white' : 'text-[#94a3b8] group-hover:text-white',
              !hasActiveItem && 'group-hover:scale-110'
            )}
          />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-left">{label}</span>
              {allItemsLocked && (
                <Lock
                  className={cn(
                    'h-4 w-4 shrink-0',
                    hasActiveItem ? 'text-white/80' : 'text-[#64748b] group-hover:text-[#94a3b8]'
                  )}
                  aria-hidden
                />
              )}
            </>
          )}
        </div>
        {!collapsed && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 flex-shrink-0',
                hasActiveItem ? 'text-white/70' : 'text-[#94a3b8] opacity-90 group-hover:text-white'
              )}
            />
          </motion.div>
        )}
      </button>
      <AnimatePresence>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-0.5 overflow-hidden"
          >
            {items.map((item) => {
              // Exact match
              const isExactMatch = pathname === item.href;

              // Check if it's a nested route
              const isNestedRoute = pathname?.startsWith(item.href + '/');

              // Get sibling items (other items in this submenu)
              const siblingItems = items.filter(i => i.href !== item.href);

              // Check if pathname exactly matches a sibling
              const matchesSiblingExact = siblingItems.some(i => pathname === i.href);

              // Check if pathname is nested under a sibling (sibling has higher priority)
              const matchesSiblingNested = siblingItems.some(i =>
                pathname?.startsWith(i.href + '/')
              );

              // Only active if exact match, or nested route that doesn't match siblings
              const isActive = isExactMatch || (isNestedRoute && !matchesSiblingExact && !matchesSiblingNested);

              return (
                <SubmenuItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={isActive}
                  collapsed={collapsed}
                  onExpand={onExpand}
                  onNavigate={onNavigate}
                  subscriptionLocked={isHrefSubscriptionLocked(item.href)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
