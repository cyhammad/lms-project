import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import CreateStaffClient from './client';

export default async function CreateStaffPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.schoolId) {
    redirect('/login');
  }

  return (
    <CreateStaffClient 
      schoolId={user.schoolId}
    />
  );
}
