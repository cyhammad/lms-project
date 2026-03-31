import React from 'react';
import { CollectFeeClientPage } from './components/CollectFeeClientPage';
import { apiServer } from '@/lib/api-server';
import type { User, Class, Student, Section } from '@/types';
import {
  BackendFeesListResponse,
  mapBackendFeeTypeToFrontend,
  mapBackendStatusToFrontend,
} from '../components/feesTypes';
import type { StudentFeePayment } from '@/types';

async function getData() {
  try {
    const [userData, classesRes, studentsRes, sectionsRes, feesRes] = await Promise.all([
      apiServer<{ user: User }>('/auth/me'),
      apiServer<{ classes: Class[] }>('/classes'),
      apiServer<{ students: Student[] }>('/students?isActive=true&limit=1000'),
      apiServer<{ sections: Section[] }>('/sections?limit=1000'),
      apiServer<BackendFeesListResponse>('/fees?limit=1000'),
    ]);

    const normalizedPayments: StudentFeePayment[] = feesRes.fees.map((fee) => ({
      id: fee.id,
      studentId: fee.studentId,
      feeType: mapBackendFeeTypeToFrontend(fee.feeType),
      amount: fee.amount,
      discountAmount: fee.discountAmount,
      finalAmount: fee.finalAmount,
      dueDate: new Date(fee.dueDate),
      status: mapBackendStatusToFrontend(fee.status),
      paidAmount: fee.paidAmount ?? undefined,
      paymentDate: fee.paymentDate ? new Date(fee.paymentDate) : undefined,
      month: fee.month ?? undefined,
      year: fee.year ?? undefined,
      notes: fee.notes ?? undefined,
      createdAt: new Date(fee.createdAt),
      updatedAt: new Date(fee.updatedAt),
    }));

    return {
      user: userData.user,
      classes: classesRes.classes,
      students: studentsRes.students,
      sections: sectionsRes.sections,
      payments: normalizedPayments,
    };
  } catch (error) {
    console.error('Failed to fetch data for collect fees page:', error);
    return {
      user: null,
      classes: [] as Class[],
      students: [] as Student[],
      sections: [] as Section[],
      payments: [] as StudentFeePayment[],
    };
  }
}

const CollectFeePage = async () => {
  const { user, classes, students, sections, payments } = await getData();

  return (
    <CollectFeeClientPage
      initialUser={user}
      initialClasses={classes}
      initialStudents={students}
      initialSections={sections}
      initialPayments={payments}
    />
  );
};

export default CollectFeePage;
