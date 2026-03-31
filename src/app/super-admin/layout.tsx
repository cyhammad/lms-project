import { SuperAdminLayout } from '@/components/layouts/super-admin-layout';
import { apiServer } from '@/lib/api-server';
import { User } from '@/types';

// Use cookies (session) — must be dynamic
export const dynamic = 'force-dynamic';

async function getCurrentUser() {
  try {
    const data = await apiServer<{ user: User }>('/auth/me');
    return data.user;
  } catch (error) {
    console.error('Failed to fetch current user for layout:', error);
    return null;
  }
}

export default async function SuperAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return <SuperAdminLayout initialUser={user}>{children}</SuperAdminLayout>;
}
