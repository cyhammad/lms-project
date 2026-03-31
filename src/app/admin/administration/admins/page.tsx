import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import { schoolAdminSeatLimit, schoolAdminSeatPlanLabel } from '@/constants/subscription-limits';
import AdminsClient from './client';

async function getData(schoolId: string) {
  try {
    const response = await apiServer<{ users: any[] }>(`/users?role=ADMIN&schoolId=${schoolId}`);
    return response.users || [];
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

async function getSchoolTierSlug(): Promise<string | null> {
  try {
    const data = await apiServer<{ tier: { slug: string } | null }>(
      '/subscription/me/effective?surface=SCHOOL_ADMIN'
    );
    return data.tier?.slug ?? null;
  } catch {
    return null;
  }
}

export default async function AdminsPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const [admins, tierSlug] = await Promise.all([getData(user.schoolId), getSchoolTierSlug()]);
  const maxSchoolAdmins = schoolAdminSeatLimit(tierSlug);
  const adminSeatPlan = schoolAdminSeatPlanLabel(tierSlug);

  return (
    <AdminsClient
      initialAdmins={admins}
      currentUserId={user.userId}
      maxSchoolAdmins={maxSchoolAdmins}
      adminSeatPlan={adminSeatPlan}
    />
  );
}
