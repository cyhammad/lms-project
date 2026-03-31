import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { apiServer } from '@/lib/api-server';
import { User, School, AcademicSession } from '@/types';
import type { SubscriptionEffectiveForSchool } from '@/types/subscription';
import type { SubscriptionPermissionRow } from '@/components/layouts/admin-subscription-gate';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-session-cookie';

// Use cookies (session) — must be dynamic
export const dynamic = 'force-dynamic';

async function getData() {
  try {
    const userData = await apiServer<{ user: User }>('/auth/me');
    const user = userData.user;

    let school = null;
    if (user.schoolId) {
      try {
        const schoolData = await apiServer<{ school: School }>(`/schools/${user.schoolId}`);
        school = schoolData.school;
      } catch (error) {
        console.error('Failed to fetch school for admin layout:', error);
      }
    }

    return { user, school };
  } catch (error) {
    console.error('Failed to fetch current user for admin layout:', error);
    return { user: null, school: null };
  }
}

async function getSessions(): Promise<AcademicSession[]> {
  try {
    const data = await apiServer<{ sessions: AcademicSession[] }>('/sessions?limit=500');
    return data.sessions ?? [];
  } catch (error) {
    console.error('Failed to fetch sessions for admin layout:', error);
    return [];
  }
}

async function getSchoolAdminSubscriptionPermissions(user: User | null): Promise<{
  permissionsByModule: Record<string, SubscriptionPermissionRow> | null;
  bypass: boolean;
}> {
  if (!user) {
    return { permissionsByModule: null, bypass: true };
  }
  if (user.role === 'super_admin') {
    return { permissionsByModule: null, bypass: true };
  }
  if (!user.schoolId) {
    return { permissionsByModule: {}, bypass: false };
  }
  try {
    const data = await apiServer<SubscriptionEffectiveForSchool>(
      '/subscription/me/effective?surface=SCHOOL_ADMIN'
    );
    const permissionsByModule: Record<string, SubscriptionPermissionRow> = {};
    for (const m of data.modules) {
      permissionsByModule[m.moduleKey] = {
        canView: m.canView,
        canCreate: m.canCreate,
        canUpdate: m.canUpdate,
        canDelete: m.canDelete,
      };
    }
    return { permissionsByModule, bypass: false };
  } catch (error) {
    console.error('Failed to fetch subscription effective permissions for admin layout:', error);
    return { permissionsByModule: {}, bypass: false };
  }
}

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ user, school }, sessions] = await Promise.all([getData(), getSessions()]);
  const subscription = await getSchoolAdminSubscriptionPermissions(user);

  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value ?? null;
  const initialSessionId =
    cookieSessionId && sessions.some((s) => s.id === cookieSessionId)
      ? cookieSessionId
      : sessions.length > 0
        ? sessions[0].id
        : null;

  return (
    <AdminLayout
      initialUser={user}
      sessions={sessions}
      initialSessionId={initialSessionId}
      subscriptionPermissionsByModule={subscription.permissionsByModule}
      subscriptionPermissionBypass={subscription.bypass}
    >
      {children}
    </AdminLayout>
  );
}
