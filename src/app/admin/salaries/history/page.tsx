import { getCurrentUser } from '@/lib/session';
import { SalaryHistoryClient } from './history-client';

export default async function SalaryHistoryPage() {
  const user = await getCurrentUser();
  return <SalaryHistoryClient user={user} />;
}

