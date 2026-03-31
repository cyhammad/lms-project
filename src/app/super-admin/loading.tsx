'use client';

import { usePathname } from 'next/navigation';
import {
  SuperAdminDashboardRouteSkeleton,
  SuperAdminGenericPageSkeleton,
} from '@/components/loading';

export default function SuperAdminLoading() {
  const pathname = usePathname();
  if (pathname === '/super-admin' || pathname === '/super-admin/') {
    return <SuperAdminDashboardRouteSkeleton />;
  }
  return <SuperAdminGenericPageSkeleton />;
}
