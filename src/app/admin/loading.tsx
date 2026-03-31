'use client';

import { usePathname } from 'next/navigation';
import {
  AdminDashboardRouteSkeleton,
  AdminGenericPageSkeleton,
} from '@/components/loading';

export default function AdminLoading() {
  const pathname = usePathname();
  const isDashboardRoot = pathname === '/admin' || pathname === '/admin/';
  if (isDashboardRoot) {
    return <AdminDashboardRouteSkeleton />;
  }
  return <AdminGenericPageSkeleton />;
}
