'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminSidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebarToggle({ collapsed, onToggle }: AdminSidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute top-8 z-[70] hidden h-6 w-6 -translate-y-1/2 -right-3 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl lg:flex"
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]" />
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronLeft className="h-3.5 w-3.5 text-[#475569]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
