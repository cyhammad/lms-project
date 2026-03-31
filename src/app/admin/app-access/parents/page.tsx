import { getCurrentUser } from '@/lib/session';
import { ParentsClient } from './parents-client';

export default async function ParentsAppAccessPage() {
  const user = await getCurrentUser();
  return <ParentsClient user={user} />;
}

