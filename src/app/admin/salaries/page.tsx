import { getCurrentUser } from '@/lib/session';
import { SalariesClient } from './salaries-client';

export default async function SalariesPage() {
  const user = await getCurrentUser();
  
  return <SalariesClient user={user} />;
}

