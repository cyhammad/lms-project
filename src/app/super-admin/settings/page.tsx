import { apiServer } from '@/lib/api-server';
import { User } from '@/types';
import SettingsClient from './client';

async function getCurrentUser() {
  try {
    const data = await apiServer<{ user: User }>('/auth/me');
    return data.user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return <SettingsClient user={user} />;
}
