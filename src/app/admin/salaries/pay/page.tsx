import { getCurrentUser } from '@/lib/session';
import { PaySalariesClient } from './pay-salaries-client';

export default async function PaySalaryPage() {
  const user = await getCurrentUser();
  return <PaySalariesClient user={user} />;
}

