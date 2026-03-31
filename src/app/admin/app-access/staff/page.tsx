import { getCurrentUser } from '@/lib/session';
import { StaffAppAccessClient } from './staff-client';

export default async function StaffAppAccessPage() {
  const user = await getCurrentUser();
  return <StaffAppAccessClient user={user} />;
}

