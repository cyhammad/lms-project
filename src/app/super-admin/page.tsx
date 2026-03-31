import { apiServer } from '@/lib/api-server';
import type { School } from '@/types';
import SuperAdminDashboardClient from './client';

interface DashboardStatsShape {
  schools: { total: number; active: number };
  users: { total: number };
}

async function getDashboardData() {
  try {
    const [statsData, schoolsData] = await Promise.all([
      apiServer<{ stats?: DashboardStatsShape } & Record<string, unknown>>('/schools/stats'),
      apiServer<{ schools: School[] }>('/schools?limit=5'),
    ]);

    return {
      stats: statsData?.stats ?? {
        schools: { total: 0, active: 0 },
        users: { total: 0 },
      },
      recentSchools: schoolsData?.schools ?? [],
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      stats: {
        schools: { total: 0, active: 0 },
        users: { total: 0 },
      } satisfies DashboardStatsShape,
      recentSchools: [] as School[],
    };
  }
}

export default async function SuperAdminDashboard() {
  const { stats, recentSchools } = await getDashboardData();

  return (
    <SuperAdminDashboardClient stats={stats} recentSchools={recentSchools} />
  );
}
