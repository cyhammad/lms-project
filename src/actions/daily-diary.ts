'use server';

import { apiServer } from '@/lib/api-server';
import type { DailyDiary } from '@/types';

export interface ListDailyDiaryParams {
  page?: number;
  limit?: number;
  classId?: string;
  sectionId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DailyDiaryListResponse {
  diaries: DailyDiary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listDailyDiary(params: ListDailyDiaryParams = {}) {
  try {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.set('page', String(params.page));
    if (params.limit != null) searchParams.set('limit', String(params.limit));
    if (params.classId) searchParams.set('classId', params.classId);
    if (params.sectionId) searchParams.set('sectionId', params.sectionId);
    if (params.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params.toDate) searchParams.set('toDate', params.toDate);
    const query = searchParams.toString();
    const data = await apiServer<DailyDiaryListResponse>(
      `/daily-diary${query ? `?${query}` : ''}`
    );
    return { success: true, data };
  } catch (error: unknown) {
    console.error('Failed to fetch daily diaries:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch daily diaries';
    return { success: false, error: message, data: { diaries: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } };
  }
}
