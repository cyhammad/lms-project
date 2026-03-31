import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import { ROUTES } from '@/constants/routes';
import { schoolAdminSeatLimit, schoolAdminSeatPlanLabel } from '@/constants/subscription-limits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import CreateAdminClient from './client';

async function getAdminCount(schoolId: string): Promise<number> {
  try {
    const response = await apiServer<{ users: unknown[] }>(`/users?role=ADMIN&schoolId=${schoolId}`);
    return response.users?.length ?? 0;
  } catch {
    return 0;
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

export default async function CreateAdminPage() {
  const user = await getCurrentUser();

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const [adminCount, tierSlug] = await Promise.all([getAdminCount(user.schoolId), getSchoolTierSlug()]);
  const limit = schoolAdminSeatLimit(tierSlug);
  const atSeatLimit = limit != null && adminCount >= limit;
  const plan = schoolAdminSeatPlanLabel(tierSlug);
  const planTitle = plan === 'pro' ? 'Pro' : plan === 'starter' ? 'Starter' : 'Your';

  if (atSeatLimit && limit != null) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card className="border-amber-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Administrator limit reached</CardTitle>
            <CardDescription>
              The {planTitle} plan allows up to {limit} school administrators. Remove an admin from the list or
              upgrade your subscription to add more.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.ADMIN.ADMINISTRATION.ADMINS}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-lg border-2 border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all',
                'hover:bg-gray-50 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2'
              )}
            >
              Back to admins
            </Link>
            <Link
              href={ROUTES.ADMIN.SUBSCRIPTION}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white shadow-sm transition-all',
                'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2'
              )}
            >
              View subscription
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CreateAdminClient schoolId={user.schoolId} />;
}
