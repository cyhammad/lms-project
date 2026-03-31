import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import AdminDashboardClient from './client';
import { apiServerOr } from '@/lib/api-server';
import type {
  Student,
  Teacher,
  Class,
  Section,
  Timetable,
  StudentFeePayment,
  StaffSalaryPayment,
  Attendance,
} from '@/types';

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const [
    studentsData,
    staffData,
    classesData,
    sectionsData,
    timetablesData,
    feesData,
    salariesData,
    attendanceData,
  ] = await Promise.all([
    apiServerOr<{ students: Student[] }>('/students', { students: [] }),
    apiServerOr<{ staff: Teacher[] }>('/staff', { staff: [] }),
    apiServerOr<{ classes: Class[] }>('/classes', { classes: [] }),
    apiServerOr<{ sections: Section[] }>('/sections', { sections: [] }),
    apiServerOr<{ timetables: Timetable[] }>('/timetables', { timetables: [] }),
    apiServerOr<Record<string, unknown>>('/fees', {}),
    apiServerOr<Record<string, unknown>>('/salaries', {}),
    apiServerOr<{ attendance: Attendance[] }>('/attendance', { attendance: [] }),
  ]);

  const students = studentsData.students ?? [];
  const staff = staffData.staff ?? [];
  const classes = classesData.classes ?? [];
  const sections = sectionsData.sections ?? [];
  const timetables = timetablesData.timetables ?? [];
  const fees = feesData as { fees?: StudentFeePayment[]; payments?: StudentFeePayment[] };
  const feePayments = fees.fees ?? fees.payments ?? [];
  const salaries = salariesData as {
    salaries?: StaffSalaryPayment[];
    payments?: StaffSalaryPayment[];
  };
  const salaryPayments = salaries.salaries ?? salaries.payments ?? [];
  const attendances = attendanceData.attendance ?? [];

  return (
    <AdminDashboardClient
      user={user}
      students={students}
      teachers={staff}
      classes={classes}
      sections={sections}
      timetables={timetables}
      feePayments={feePayments}
      salaryPayments={salaryPayments}
      attendances={attendances}
    />
  );
}
