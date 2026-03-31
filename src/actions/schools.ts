'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function createSchool(formData: FormData) {
  const setupFeeRaw = formData.get('setupFee');
  const monthlyFeeRaw = formData.get('monthlyFee');
  const referalCommissionRaw = formData.get('referalCommission');
  const subscriptionTierIdRaw = formData.get('subscriptionTierId');
  const subscriptionTierId =
    subscriptionTierIdRaw != null && String(subscriptionTierIdRaw).trim() !== ''
      ? String(subscriptionTierIdRaw).trim()
      : undefined;

  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    city: formData.get('city'),
    setupFee: setupFeeRaw != null && setupFeeRaw !== '' ? parseFloat(String(setupFeeRaw)) : undefined,
    monthlyFee: monthlyFeeRaw != null && monthlyFeeRaw !== '' ? parseFloat(String(monthlyFeeRaw)) : undefined,
    referal: formData.get('referal') ? String(formData.get('referal')) : undefined,
    referalCommission: referalCommissionRaw != null && referalCommissionRaw !== '' ? parseFloat(String(referalCommissionRaw)) : undefined,
    referalContact: formData.get('referalContact') ? String(formData.get('referalContact')) : undefined,
    ...(subscriptionTierId ? { subscriptionTierId } : {}),
  };

  try {
    await apiServer('/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/super-admin/schools');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSchool(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData);
  
  // Special handling for array fields
  const phoneNumbers = formData.getAll('phoneNumbers').map(p => p.toString()).filter(p => p.trim());
  
  const data = {
    ...rawData,
    yearOfEstablishment: rawData.yearOfEstablishment ? parseInt(rawData.yearOfEstablishment as string) : undefined,
    phoneNumbers: phoneNumbers.length > 0 ? phoneNumbers : undefined,
    setupFee: rawData.setupFee != null && rawData.setupFee !== '' ? parseFloat(String(rawData.setupFee)) : undefined,
    monthlyFee: rawData.monthlyFee != null && rawData.monthlyFee !== '' ? parseFloat(String(rawData.monthlyFee)) : undefined,
    referalCommission: rawData.referalCommission != null && rawData.referalCommission !== '' ? parseFloat(String(rawData.referalCommission)) : undefined,
    referalContact: rawData.referalContact != null && rawData.referalContact !== '' ? String(rawData.referalContact) : undefined,
  };

  try {
    await apiServer(`/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/super-admin/schools');
    revalidatePath('/admin/administration/school');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSchool(id: string) {
  try {
    await apiServer(`/schools/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/super-admin/schools');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSchoolSettings(
  id: string,
  settings: {
    workingDays?: string[];
    schoolStartTime?: string;
    schoolEndTime?: string;
    periodDurationMins?: number;
    lunchStartTime?: string | null;
    lunchEndTime?: string | null;
  }
) {
  try {
    await apiServer(`/schools/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    revalidatePath('/admin/administration/school');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSchoolStatus(id: string, status: 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED') {
  try {
    await apiServer(`/schools/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    revalidatePath('/super-admin/schools');
    revalidatePath('/admin/administration/school');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createSchoolFeePayment(
  schoolId: string,
  payload: { month: number; year: number; amount: number; paidAt?: string; notes?: string }
) {
  try {
    const data = await apiServer<{ payment: import('@/types').SchoolMonthlyFeePayment }>(
      `/schools/${schoolId}/fee-payments`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    revalidatePath('/super-admin/schools');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    return { success: true, payment: data.payment };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSchoolFeePayment(
  schoolId: string,
  paymentId: string,
  payload: { amount?: number; paidAt?: string; notes?: string }
) {
  try {
    await apiServer(`/schools/${schoolId}/fee-payments/${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    revalidatePath('/super-admin/schools');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSchoolFeePayment(schoolId: string, paymentId: string) {
  try {
    await apiServer(`/schools/${schoolId}/fee-payments/${paymentId}`, {
      method: 'DELETE',
    });
    revalidatePath('/super-admin/schools');
    revalidatePath(`/super-admin/schools/${schoolId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
