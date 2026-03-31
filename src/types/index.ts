// Core types for the application

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'teacher' | 'student' | 'parent';

export interface UserPermission {
  id?: string;
  userId?: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/** Permission string for RBAC (e.g. 'schools.create', 'users.read') */
export type Permission = string;

export type ParentType = 'mother' | 'father' | 'guardian';

export interface AppAccess {
  id: string;
  username: string;
  schoolId: string;
  type: 'staff' | 'parent';
  staffId?: string;
  studentId?: string;
  password?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string;
  userPermissions?: UserPermission[];
  /** Optional flat list of permission strings for RBAC (e.g. 'schools.read') */
  permissions?: string[];
  // Parent-specific fields
  parentType?: ParentType;
  studentId?: string; // For parents - links to their child (student)
  createdAt: Date;
  updatedAt: Date;
  school?: School;
}

// Parent model for mobile app login (separate from User)
export interface Parent {
  id: string;
  email?: string;
  username?: string;
  password?: string; // App access password (returned by API for admin app access management)
  name: string;
  phone?: string;
  cnic?: string;
  parentType: ParentType;
  occupation?: string;
  monthlyIncome?: number;
  guardianRelation?: GuardianRelation; // Only used when parentType is 'guardian'
  schoolId: string;
  isActive: boolean;
  students?: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface School {
  id: string;
  name: string;
  campusName?: string; // Single campus name
  logo?: string;
  schoolType?: SchoolType; // Government / Private / Semi-Government
  level?: SchoolLevel; // Primary / Middle / Secondary / Higher Secondary / O & A Levels
  yearOfEstablishment?: number;
  registrationNumber?: string;
  // Complete Address
  street?: string;
  area?: string;
  city?: string;
  province?: Province;
  country?: string; // Default "Pakistan"
  // Contact Information
  address: string; // Legacy field for backward compatibility
  phone: string;
  phoneNumbers?: string[]; // Multiple phone numbers
  email: string;
  website?: string;
  whatsappNumber?: string;
  status: SchoolStatus; // ACTIVE | ON_HOLD | SUSPENDED
  createdAt: Date;
  updatedAt: Date;
  /** Assigned subscription tier (API may include when loading school) */
  subscriptionTierId?: string | null;
  subscriptionTier?: {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
  };
  // Fee & referral
  setupFee?: number;
  monthlyFee?: number;
  referal?: string;
  referalCommission?: number;
  referalContact?: string;
  monthlyFeePayments?: SchoolMonthlyFeePayment[];
  // School operations / schedule settings
  workingDays?: string[];
  schoolStartTime?: string;
  schoolEndTime?: string;
  periodDurationMins?: number;
  lunchStartTime?: string;
  lunchEndTime?: string;
}

export interface SchoolMonthlyFeePayment {
  id: string;
  schoolId: string;
  month: number;
  year: number;
  amount: number;
  paidAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  school?: School;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface Class {
  id: string;
  name: string;
  code: string; // e.g., "PG", "C1", "C9", "O1"
  description?: string;
  schoolId: string;
  teacherId?: string; // Assigned teacher
  educationLevel: EducationLevel; // Early Years / Primary / Middle / Secondary / Higher Secondary
  grade: number; // Numeric level: 0, 1, 2, ... 12
  subject: string; // e.g., "Mathematics", "Science"
  sessionId?: string; // Academic Session ID
  schedule?: string; // e.g., "Mon, Wed, Fri 9:00 AM"
  room?: string;
  maxStudents?: number;
  standardFee: number; // Standard monthly fee for this class
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StaffType = 'TEACHER' | 'MANAGER' | 'ADMINISTRATIVE' | 'SUPPORT' | 'SECURITY' | 'MAINTENANCE' | 'IT' | 'FINANCE' | 'OTHER';

export interface Teacher {
  id: string;
  email: string;
  name: string;
  phone?: string;
  schoolId: string;
  staffType?: StaffType; // Type of staff member
  subjects?: string[]; // Subjects they teach / Department
  classes?: string[]; // Class IDs they teach
  qualifications?: string;
  experience?: number; // Years of experience
  monthlySalary?: number; // Monthly salary amount
  photo?: string; // URL or base64
  username?: string; // App access username
  password?: string; // App access password (hashed in production)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Gender = 'Male' | 'Female';
export type Religion = 'Islam' | 'Christian' | 'Hindu' | 'Other';
export type PrimaryContact = 'FATHER' | 'MOTHER' | 'GUARDIAN';
export type GuardianRelation = 'GRANDFATHER' | 'GRANDMOTHER' | 'UNCLE' | 'AUNT' | 'BROTHER' | 'SISTER' | 'OTHER';
export type Province = 'PUNJAB' | 'SINDH' | 'KP' | 'BALOCHISTAN' | 'GB' | 'ICT';
export type DiscountType = 'SIBLING' | 'STAFF' | 'MERIT' | 'NONE';
export type SchoolType = 'Government' | 'Private' | 'Semi-Government';
export type SchoolLevel = 'Primary' | 'Middle' | 'Secondary' | 'Higher Secondary' | 'O & A Levels';
export type SchoolStatus = 'ACTIVE' | 'ON_HOLD' | 'SUSPENDED';
export type EducationLevel = 'Early Years' | 'Primary' | 'Middle' | 'Secondary' | 'Higher Secondary' | 'O & A Levels';

export interface Student {
  id: string;
  schoolId: string;
  
  // Student Information (Section A)
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: Date;
  placeOfBirth?: string;
  religion?: Religion;
  religionOther?: string;
  nationality: string; // Default "Pakistani"
  bFormCrc: string; // Format: #####-#######-#
  studentPhoto?: string; // URL or base64
  specialNeeds?: boolean;
  specialNeedsDetails?: string;
  
  // Admission Details (Section B)
  admissionDate: Date;
  academicSession: string; // e.g., "2025-26"
  classApplyingFor: string; // Class ID
  sectionId?: string; // Section ID
  previousSchoolName?: string;
  previousSchoolAddress?: string;
  reasonForLeaving?: string;
  
  // Primary Contact preference (which parent to contact first)
  primaryContact?: PrimaryContact; // Default: 'Father'
  
  // Address Information (Section C)
  addressLine1: string; // House/Flat (required)
  addressLine2: string; // Street/Area (required)
  city: string; // Required
  province: Province; // Required
  postalCode?: string; // Optional
  
  // Fee & Discount (Section D)
  admissionFee?: number;
  discountedFee?: number; // Discounted monthly fee amount
  discountType?: DiscountType; // Sibling/Staff/Merit/None
  
  // Parent Accounts (linked from Parent model)
  parentAccounts?: Parent[]; // Linked parent accounts for mobile app
  
  // Legacy fields (for API compatibility)
  email?: string;
  name?: string; // Computed from firstName + lastName
  phone?: string;
  classId?: string; // Alias for classApplyingFor
  grade?: string;
  studentId?: string;
  address?: string;
  parentIds?: string[];
  // Parent display (API may return with parent info)
  fatherName?: string;
  motherName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  fatherCnic?: string;
  motherCnic?: string;
  enrollmentDate: Date; // Alias for admissionDate
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  id: string;
  name: string; // e.g., "Section A", "Section B"
  classId: string; // Parent class
  schoolId: string;
  teacherId?: string; // Class teacher for this section
  capacity?: number; // Maximum students
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicSession {
  id: string;
  name: string; // e.g., "2024-2025", "Fall 2024"
  schoolId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolHoliday {
  id: string;
  schoolId: string;
  title: string;
  date: string; // ISO date string
  type?: string | null; // e.g. 'holiday' | 'event'
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string; // e.g., "Mathematics", "Science"
  classId: string; // Associated class
  schoolId: string;
  totalMarks: number; // Total marks for the subject
  passingPercentage: number; // Passing percentage (e.g., 40 for 40%)
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimetableEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // Format: "HH:mm" e.g., "09:00"
  endTime: string; // Format: "HH:mm" e.g., "10:00"
  subjectId: string;
  teacherId?: string;
  room?: string;
}

export interface Timetable {
  id: string;
  sectionId: string; // Which section this timetable is for
  schoolId: string;
  entries: TimetableEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Campus {
  id: string;
  name: string;
  schoolId: string;
  address: string;
  phone?: string;
  email?: string;
  principalName?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Announcement Types
export type AnnouncementRecipientType = 'all' | 'teachers' | 'parents' | 'students' | 'specific';

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  message: string;
  recipientType: AnnouncementRecipientType;
  recipientIds?: string[];
  createdBy: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  schoolId: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: { expenses: number };
}

export interface Expense {
  id: string;
  schoolId: string;
  title: string;
  description?: string | null;
  amount: number;
  categoryId?: string | null;
  category?: ExpenseCategory | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyDiary {
  id: string;
  schoolId: string;
  classId: string;
  sectionId: string;
  subject: string | null;
  teacherId: string;
  diaryDate: string;
  title: string;
  topicCovered: string | null;
  homework: string | null;
  reminder: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  class?: { id: string; name: string; code: string };
  section?: { id: string; name: string };
  teacher?: { id: string; name: string; email: string };
}

// Student Fee Management Types
export type FeeType = 'Admission' | 'MonthlyTuition' | 'Fine' | 'Transport' | 'Library' | 'Sports' | 'Lab' | 'Other';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface StudentFeePayment {
  id: string;
  studentId: string; // Reference to student
  feeType: FeeType; // Type of fee
  amount: number; // Original fee amount
  discountAmount: number; // Discount applied
  finalAmount: number; // Amount after discount
  dueDate: Date; // When payment is due
  status: PaymentStatus; // Payment status
  paidAmount?: number; // Amount paid (for partial payments)
  paymentDate?: Date; // When payment was made
  month?: number; // For monthly fees (1-12)
  year?: number; // For monthly fees
  notes?: string; // Optional notes
  createdAt: Date;
  updatedAt: Date;
}

// Staff Salary Management Types
export type SalaryPaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface StaffSalaryPayment {
  id: string;
  staffId: string; // Reference to staff/teacher
  amount: number; // Monthly salary amount
  deductions: number; // Deductions (if any)
  finalAmount: number; // Amount after deductions
  dueDate: Date; // When salary is due
  status: SalaryPaymentStatus; // Payment status
  paidAmount?: number; // Amount paid (for partial payments)
  paymentDate?: Date; // When payment was made
  month: number; // Month (1-12)
  year: number; // Year
  notes?: string; // Optional notes
  createdAt: Date;
  updatedAt: Date;
}

// Teacher attendance (mobile check-in, admin dashboard)
export type TeacherAttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';

export interface TeacherAttendanceSettings {
  id: string;
  schoolId: string;
  attendanceStartTime: string;
  graceMinutes: number;
  absentCutoffTime: string;
  allowManualOverride: boolean;
  geoFencingEnabled?: boolean;
  schoolLatitude?: number | null;
  schoolLongitude?: number | null;
  allowedRadiusMeters?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherAttendanceRecord {
  id: string;
  schoolId: string;
  teacherId: string;
  date: string;
  checkInTime: string | null;
  status: TeacherAttendanceStatus;
  method: 'MOBILE' | 'MOBILE_GEO' | 'MANUAL';
  remarks: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geoVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  teacher?: { id: string; name: string; email: string };
}

// Teacher leave (admin + teacher app)
export type LeaveAllocationType = 'ANNUAL' | 'MONTHLY';
export type LeaveMonthlyBehavior = 'RESET' | 'CARRY_FORWARD';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TeacherLeaveType {
  id: string;
  schoolId: string;
  name: string;
  isPaid: boolean;
  allocationType: LeaveAllocationType;
  allocationCount: number;
  monthlyBehavior?: LeaveMonthlyBehavior | null;
  maxCarryForward?: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherLeaveRequest {
  id: string;
  schoolId: string;
  teacherId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string | null;
  status: LeaveRequestStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  teacher?: { id: string; name: string; email: string };
  leaveType?: { id: string; name: string; isPaid?: boolean };
}

// Attendance Management Types
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface Attendance {
  id: string;
  studentId?: string; // For student attendance
  staffId?: string; // For staff attendance
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: string; // User ID who marked the attendance
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Accounting Management Types
export type FinancialPeriod = 'monthly' | 'yearly';

export interface FinancialSummary {
  period: string; // "2024-01" or "2024"
  revenue: {
    total: number;
    byFeeType: Partial<Record<FeeType, number>>;
    paid: number;
    outstanding: number;
  };
  expenses: {
    total: number;
    byStaffType: Partial<Record<StaffType, number>>;
    paid: number;
    outstanding: number;
    /** Total from Expense Management module (school expenses) for this period */
    otherExpenses?: number;
  };
  profit: number; // revenue.total - expenses.total
  profitMargin: number; // (profit / revenue.total) * 100, or 0 if revenue is 0
}

/** Bank details shown on fee challan. If not set, only school name is shown and fee is submitted manually at school. */
export interface FeeChallanSettings {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branch?: string;
}

// Policy Management Types
export type SecurityDeductionType = 'half' | 'quarter' | 'percentage';

export interface SecurityDeductionPolicy {
  id: string;
  schoolId: string;
  deductionType: SecurityDeductionType;
  deductionValue: number; // Percentage if type is percentage, otherwise ignored
  durationMonths: number; // 1, 2, 3, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SecurityDeductionStatus = 'deducted' | 'returned';

export interface SecurityDeductionRecord {
  id: string;
  staffId: string;
  policyId: string;
  amount: number; // Deducted amount
  month: number;
  year: number;
  status: SecurityDeductionStatus;
  returnedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LeaveDeductionType = 'fixed' | 'percentage';

export interface LeaveDeductionPolicy {
  id: string;
  schoolId: string;
  deductionType: LeaveDeductionType;
  deductionValue: number; // Fixed amount or percentage
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SchoolPolicyType = 'Grading' | 'Attendance' | 'Discipline' | 'Academic' | 'General' | 'Other';

export interface SchoolPolicy {
  id: string;
  schoolId: string;
  title: string;
  type: SchoolPolicyType;
  description: string;
  createdBy: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Teacher work calendar (attendance + leave + holidays + weekends)
export type WorkCalendarDayStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'LEAVE'
  | 'HOLIDAY'
  | 'WEEKEND'
  | 'PENDING';

export interface WorkCalendarDay {
  date: string;
  dayOfWeek: number;
  status: WorkCalendarDayStatus;
  title?: string;
  remarks?: string;
}

export interface WorkCalendarResponse {
  year: number;
  month: number;
  days: WorkCalendarDay[];
  summary: Record<WorkCalendarDayStatus, number>;
}

// Examination system
export type ExamType = 'MID_TERM' | 'FINAL' | 'QUARTERLY' | 'MONTHLY' | 'CLASS_TEST' | 'OTHER';
export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'RESULT_PUBLISHED' | 'CANCELLED';

export interface ExamSubjectDto {
  id: string;
  examId: string;
  subjectId: string;
  totalMarks: number;
  passingMarks: number;
  examDate: string;
  startTime?: string | null;
  endTime?: string | null;
  includeInResult: boolean;
  subject?: { id: string; name: string };
}

export interface ExamDto {
  id: string;
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId?: string | null;
  title: string;
  examType: ExamType;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  /** When false (default), only one subject exam per day. When true, up to maxExamsPerDay per day. */
  allowMultipleExamsPerDay?: boolean;
  /** Max number of subject exams on a single day (used when allowMultipleExamsPerDay is true). Default 1. */
  maxExamsPerDay?: number;
  createdBy?: string | null;
  session?: { id: string; name: string };
  class?: { id: string; name: string; code: string };
  section?: { id: string; name: string } | null;
  subjects?: ExamSubjectDto[];
}

export interface ResultCardDto {
  id?: string;
  examId: string;
  studentId: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade?: string | null;
  student?: { id: string; firstName: string; lastName: string };
}
