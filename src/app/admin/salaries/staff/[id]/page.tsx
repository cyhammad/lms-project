import { getCurrentUser } from '@/lib/session';
import { StaffSalaryClient } from './staff-salary-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffSalaryPage(props: PageProps) {
  const user = await getCurrentUser();
  const { id } = await props.params;
  return <StaffSalaryClient user={user} staffId={id} />;
}

