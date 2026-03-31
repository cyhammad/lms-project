import { apiServer } from '@/lib/api-server';
import { User, School } from '@/types';
import UsersClient from './client';

const DEFAULT_LIMIT = 10;

async function getAdmins(page: number = 1) {
  try {
    const params = new URLSearchParams({
      role: 'ADMIN',
      page: String(page),
      limit: String(DEFAULT_LIMIT),
    });
    const data = await apiServer<{ users: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/users?${params.toString()}`
    );
    return { users: data.users, pagination: data.pagination };
  } catch (error) {
    console.error('Failed to fetch admins:', error);
    return { users: [], pagination: { page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 } };
  }
}

async function getSchools() {
  try {
    const data = await apiServer<{ schools: School[] }>('/schools?limit=100');
    return data.schools;
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    return [];
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const [adminsData, schools] = await Promise.all([
    getAdmins(page),
    getSchools(),
  ]);

  return (
    <UsersClient
      initialUsers={adminsData.users}
      initialSchools={schools}
      initialPagination={adminsData.pagination}
    />
  );
}
