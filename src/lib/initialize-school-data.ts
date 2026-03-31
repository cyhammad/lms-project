/**
 * Initialize predefined data for school-1 on first login
 * This ensures the system looks proper and not empty for new users
 * 
 * Structure:
 * - 2 Sessions (MUST BE FIRST - other entities reference sessions)
 * - Each session has 3 classes with 2 sections each (6 classes, 12 sections total)
 * - Each section has at least 10 students (120+ students total)
 * - At least 20 staff members (teachers and other types)
 * - Timetables for all sections
 * - Standard policies (Security Deduction: 10% for 3 months, Leave Deduction: 500 PKR per leave)
 * 
 * Initialization Order:
 * 1. Sessions (first - referenced by classes and students)
 * 2. Classes (reference sessions)
 * 3. Sections (reference classes)
 * 4. Subjects (reference classes)
 * 5. Staff/Teachers
 * 6. Students (reference sessions, classes, sections)
 * 7. Timetables (reference sections)
 * 8. Attendance (reference students and staff)
 * 9. Policies (Security and Leave Deduction)
 */

import type {
  AcademicSession,
  Class,
  Section,
  Subject,
  Student,
  Teacher,
  Timetable,
  TimetableEntry,
  SecurityDeductionPolicy,
  LeaveDeductionPolicy,
} from '@/types';
import { saveSessions } from './session-storage';
import { saveClasses } from './class-storage';
import { saveSections } from './section-storage';
import { saveSubjects } from './subject-storage';
import { saveStudents } from './student-storage';
import { saveTeachers } from './teacher-storage';
import { saveTimetables } from './timetable-storage';
import { saveAttendances } from './attendance-storage';
import { saveSecurityDeductionPolicies, saveLeaveDeductionPolicies } from './policy-storage';
import type { Attendance, AttendanceStatus } from '@/types';

const INITIALIZATION_KEY = 'edflo_school_data_initialized';
const SCHOOL_ID = 'school-1';

/**
 * Check if school data has been initialized
 */
export const isSchoolDataInitialized = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(INITIALIZATION_KEY) === 'true';
};

/**
 * Mark school data as initialized
 */
const markAsInitialized = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INITIALIZATION_KEY, 'true');
};

/**
 * Generate a student with unique data
 */
const generateStudent = (
  id: string,
  firstName: string,
  lastName: string,
  gender: 'Male' | 'Female',
  dateOfBirth: Date,
  classId: string,
  sectionId: string,
  sessionName: string,
  admissionDate: Date,
  now: Date
): Student => {
  const studentNum = parseInt(id.replace('student-', ''));
  return {
    id,
    schoolId: SCHOOL_ID,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    nationality: 'Pakistani',
    bFormCrc: `${String(12345 + studentNum).padStart(5, '0')}-${String(1234567 + studentNum).padStart(7, '0')}-${studentNum % 10}`,
    admissionDate,
    academicSession: sessionName,
    classApplyingFor: classId,
    sectionId,
    fatherName: `Father ${firstName}`,
    fatherCnic: `${String(35202 + studentNum).padStart(5, '0')}-${String(1234567 + studentNum).padStart(7, '0')}-${(studentNum % 9) + 1}`,
    fatherMobile: `+92300${String(1111111 + studentNum).padStart(7, '0')}`,
    motherName: `Mother ${firstName}`,
    motherCnic: `${String(35202 + studentNum + 1000).padStart(5, '0')}-${String(1234567 + studentNum).padStart(7, '0')}-${(studentNum % 9) + 1}`,
    motherMobile: `+92300${String(2222222 + studentNum).padStart(7, '0')}`,
    addressLine1: `House ${100 + studentNum}`,
    addressLine2: `Street ${studentNum % 50}, Area ${Math.floor(studentNum / 10)}`,
    city: ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan'][studentNum % 5],
    province: ['Punjab', 'Sindh', 'Punjab', 'Punjab', 'Punjab'][studentNum % 5] as any,
    admissionFee: [4000, 5000, 6000, 7000][studentNum % 4],
    discountedFee: [2500, 3000, 4000, 5000][studentNum % 4],
    discountType: ['None', 'Merit', 'Sibling', 'None'][studentNum % 4] as any,
    enrollmentDate: admissionDate,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Initialize all predefined data for school-1
 */
export const initializeSchoolData = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check if already initialized
  if (isSchoolDataInitialized()) {
    return;
  }

  try {
    const now = new Date();
    
    // IMPORTANT: Sessions must be created FIRST before any other entities
    // Classes reference sessions via sessionId
    // Students reference sessions via academicSession (session name)
    // Sections reference classes, which in turn reference sessions
    
    // 1. Initialize Academic Sessions (2 sessions) - MUST BE FIRST
    const sessions: AcademicSession[] = [
      {
        id: 'session-1',
        name: '2024-2025',
        schoolId: SCHOOL_ID,
        description: 'Academic Year 2024-2025',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'session-2',
        name: '2025-2026',
        schoolId: SCHOOL_ID,
        description: 'Academic Year 2025-2026',
        createdAt: now,
        updatedAt: now,
      },
    ];
    saveSessions(sessions);
    // Sessions are now saved and available for reference

    // 2. Initialize Classes (3 classes per session = 6 classes total)
    // Classes reference sessions via sessionId
    const classes: Class[] = [
      // Session 1 classes
      {
        id: 'class-1',
        name: 'Class 1',
        code: 'C1',
        description: 'Primary - Class 1',
        schoolId: SCHOOL_ID,
        educationLevel: 'Primary',
        grade: 1,
        subject: 'General',
        sessionId: 'session-1',
        standardFee: 3000,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'class-2',
        name: 'Class 3',
        code: 'C3',
        description: 'Primary - Class 3',
        schoolId: SCHOOL_ID,
        educationLevel: 'Primary',
        grade: 3,
        subject: 'General',
        sessionId: 'session-1',
        standardFee: 4000,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'class-3',
        name: 'Class 6',
        code: 'C6',
        description: 'Middle - Class 6',
        schoolId: SCHOOL_ID,
        educationLevel: 'Middle',
        grade: 6,
        subject: 'General',
        sessionId: 'session-1',
        standardFee: 5000,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      // Session 2 classes
      {
        id: 'class-4',
        name: 'Class 2',
        code: 'C2',
        description: 'Primary - Class 2',
        schoolId: SCHOOL_ID,
        educationLevel: 'Primary',
        grade: 2,
        subject: 'General',
        sessionId: 'session-2',
        standardFee: 3500,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'class-5',
        name: 'Class 5',
        code: 'C5',
        description: 'Primary - Class 5',
        schoolId: SCHOOL_ID,
        educationLevel: 'Primary',
        grade: 5,
        subject: 'General',
        sessionId: 'session-2',
        standardFee: 4500,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'class-6',
        name: 'Class 9',
        code: 'C9',
        description: 'Secondary - Class 9',
        schoolId: SCHOOL_ID,
        educationLevel: 'Secondary',
        grade: 9,
        subject: 'General',
        sessionId: 'session-2',
        standardFee: 6000,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    saveClasses(classes);
    // Classes are now saved and available for reference

    // 3. Initialize Sections (2 sections per class = 12 sections total)
    // Sections reference classes via classId (classes must exist first)
    const sections: Section[] = [
      // Class 1 sections
      { id: 'section-1', name: 'Section A', classId: 'class-1', schoolId: SCHOOL_ID, capacity: 35, isActive: true, createdAt: now, updatedAt: now },
      { id: 'section-2', name: 'Section B', classId: 'class-1', schoolId: SCHOOL_ID, capacity: 35, isActive: true, createdAt: now, updatedAt: now },
      // Class 2 sections
      { id: 'section-3', name: 'Section A', classId: 'class-2', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
      { id: 'section-4', name: 'Section B', classId: 'class-2', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
      // Class 3 sections
      { id: 'section-5', name: 'Section A', classId: 'class-3', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
      { id: 'section-6', name: 'Section B', classId: 'class-3', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
      // Class 4 sections
      { id: 'section-7', name: 'Section A', classId: 'class-4', schoolId: SCHOOL_ID, capacity: 35, isActive: true, createdAt: now, updatedAt: now },
      { id: 'section-8', name: 'Section B', classId: 'class-4', schoolId: SCHOOL_ID, capacity: 35, isActive: true, createdAt: now, updatedAt: now },
      // Class 5 sections
      { id: 'section-9', name: 'Section A', classId: 'class-5', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
      { id: 'section-10', name: 'Section B', classId: 'class-5', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
      // Class 6 sections
      { id: 'section-11', name: 'Section A', classId: 'class-6', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
      { id: 'section-12', name: 'Section B', classId: 'class-6', schoolId: SCHOOL_ID, capacity: 40, isActive: true, createdAt: now, updatedAt: now },
    ];
    saveSections(sections);
    // Sections are now saved and available for reference

    // 4. Initialize Subjects (multiple subjects per class)
    const subjects: Subject[] = [
      // Class 1 subjects
      { id: 'subject-1', name: 'Mathematics', classId: 'class-1', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Mathematics for Class 1', createdAt: now, updatedAt: now },
      { id: 'subject-2', name: 'English', classId: 'class-1', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'English Language', createdAt: now, updatedAt: now },
      { id: 'subject-3', name: 'Urdu', classId: 'class-1', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Urdu Language', createdAt: now, updatedAt: now },
      { id: 'subject-4', name: 'General Knowledge', classId: 'class-1', schoolId: SCHOOL_ID, totalMarks: 50, passingPercentage: 40, description: 'General Knowledge', createdAt: now, updatedAt: now },
      // Class 2 subjects
      { id: 'subject-5', name: 'Mathematics', classId: 'class-2', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Mathematics for Class 3', createdAt: now, updatedAt: now },
      { id: 'subject-6', name: 'English', classId: 'class-2', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'English Language', createdAt: now, updatedAt: now },
      { id: 'subject-7', name: 'Urdu', classId: 'class-2', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Urdu Language', createdAt: now, updatedAt: now },
      { id: 'subject-8', name: 'Science', classId: 'class-2', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'General Science', createdAt: now, updatedAt: now },
      // Class 3 subjects
      { id: 'subject-9', name: 'Mathematics', classId: 'class-3', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Mathematics for Class 6', createdAt: now, updatedAt: now },
      { id: 'subject-10', name: 'English', classId: 'class-3', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'English Language', createdAt: now, updatedAt: now },
      { id: 'subject-11', name: 'Urdu', classId: 'class-3', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Urdu Language', createdAt: now, updatedAt: now },
      { id: 'subject-12', name: 'Science', classId: 'class-3', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'General Science', createdAt: now, updatedAt: now },
      { id: 'subject-13', name: 'Social Studies', classId: 'class-3', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Social Studies', createdAt: now, updatedAt: now },
      // Class 4 subjects
      { id: 'subject-14', name: 'Mathematics', classId: 'class-4', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Mathematics for Class 2', createdAt: now, updatedAt: now },
      { id: 'subject-15', name: 'English', classId: 'class-4', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'English Language', createdAt: now, updatedAt: now },
      { id: 'subject-16', name: 'Urdu', classId: 'class-4', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Urdu Language', createdAt: now, updatedAt: now },
      // Class 5 subjects
      { id: 'subject-17', name: 'Mathematics', classId: 'class-5', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Mathematics for Class 5', createdAt: now, updatedAt: now },
      { id: 'subject-18', name: 'English', classId: 'class-5', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'English Language', createdAt: now, updatedAt: now },
      { id: 'subject-19', name: 'Urdu', classId: 'class-5', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Urdu Language', createdAt: now, updatedAt: now },
      { id: 'subject-20', name: 'Science', classId: 'class-5', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'General Science', createdAt: now, updatedAt: now },
      { id: 'subject-21', name: 'Social Studies', classId: 'class-5', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Social Studies', createdAt: now, updatedAt: now },
      // Class 6 subjects
      { id: 'subject-22', name: 'Mathematics', classId: 'class-6', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Mathematics for Class 9', createdAt: now, updatedAt: now },
      { id: 'subject-23', name: 'English', classId: 'class-6', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'English Language', createdAt: now, updatedAt: now },
      { id: 'subject-24', name: 'Urdu', classId: 'class-6', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Urdu Language', createdAt: now, updatedAt: now },
      { id: 'subject-25', name: 'Physics', classId: 'class-6', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Physics', createdAt: now, updatedAt: now },
      { id: 'subject-26', name: 'Chemistry', classId: 'class-6', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Chemistry', createdAt: now, updatedAt: now },
      { id: 'subject-27', name: 'Biology', classId: 'class-6', schoolId: SCHOOL_ID, totalMarks: 100, passingPercentage: 40, description: 'Biology', createdAt: now, updatedAt: now },
    ];
    saveSubjects(subjects);

    // 5. Initialize Staff Members (20+ staff: teachers and other types)
    const teachers: Teacher[] = [
      // Teachers (12)
      { id: 'teacher-1', email: 'sarah.ahmed@school1.com', name: 'Sarah Ahmed', phone: '+923001111111', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Mathematics', 'English'], classes: ['class-1', 'class-4'], qualifications: 'M.Sc Mathematics, B.Ed', experience: 5, monthlySalary: 50000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-2', email: 'ali.hassan@school1.com', name: 'Ali Hassan', phone: '+923002222222', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Science', 'Mathematics'], classes: ['class-2', 'class-5'], qualifications: 'M.Sc Physics, B.Ed', experience: 8, monthlySalary: 60000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-3', email: 'fatima.khan@school1.com', name: 'Fatima Khan', phone: '+923003333333', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Urdu', 'English'], classes: ['class-1', 'class-4'], qualifications: 'M.A Urdu, B.Ed', experience: 6, monthlySalary: 55000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-4', email: 'ahmed.malik@school1.com', name: 'Ahmed Malik', phone: '+923004444444', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Physics', 'Chemistry'], classes: ['class-6'], qualifications: 'M.Sc Physics, M.Ed', experience: 10, monthlySalary: 70000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-5', email: 'zainab.ali@school1.com', name: 'Zainab Ali', phone: '+923005555555', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['English'], classes: ['class-2', 'class-5'], qualifications: 'M.A English, B.Ed', experience: 4, monthlySalary: 48000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-6', email: 'hassan.raza@school1.com', name: 'Hassan Raza', phone: '+923006666666', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Mathematics'], classes: ['class-3', 'class-6'], qualifications: 'M.Sc Mathematics, M.Ed', experience: 7, monthlySalary: 58000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-7', email: 'amina.khan@school1.com', name: 'Amina Khan', phone: '+923007777777', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Science'], classes: ['class-3'], qualifications: 'M.Sc Chemistry, B.Ed', experience: 5, monthlySalary: 52000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-8', email: 'muhammad.ali@school1.com', name: 'Muhammad Ali', phone: '+923008888888', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Social Studies'], classes: ['class-3', 'class-5'], qualifications: 'M.A History, B.Ed', experience: 6, monthlySalary: 54000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-9', email: 'sana.ahmed@school1.com', name: 'Sana Ahmed', phone: '+923009999999', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Biology'], classes: ['class-6'], qualifications: 'M.Sc Biology, B.Ed', experience: 5, monthlySalary: 51000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-10', email: 'bilal.hassan@school1.com', name: 'Bilal Hassan', phone: '+923001010101', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['Urdu'], classes: ['class-2', 'class-5'], qualifications: 'M.A Urdu, B.Ed', experience: 4, monthlySalary: 47000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-11', email: 'nadia.malik@school1.com', name: 'Nadia Malik', phone: '+923001111111', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['General Knowledge'], classes: ['class-1'], qualifications: 'B.A, B.Ed', experience: 3, monthlySalary: 45000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'teacher-12', email: 'usman.raza@school1.com', name: 'Usman Raza', phone: '+923001212121', schoolId: SCHOOL_ID, staffType: 'TEACHER', subjects: ['English', 'Urdu'], classes: ['class-4'], qualifications: 'M.A English, B.Ed', experience: 5, monthlySalary: 50000, isActive: true, createdAt: now, updatedAt: now },
      // Other staff types (8)
      { id: 'staff-1', email: 'principal@school1.com', name: 'Dr. Asif Khan', phone: '+923001313131', schoolId: SCHOOL_ID, staffType: 'MANAGER', qualifications: 'Ph.D Education', experience: 20, monthlySalary: 150000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'staff-2', email: 'vice.principal@school1.com', name: 'Mrs. Ayesha Malik', phone: '+923001414141', schoolId: SCHOOL_ID, staffType: 'MANAGER', qualifications: 'M.Ed, M.A', experience: 15, monthlySalary: 120000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'staff-3', email: 'admin@school1.com', name: 'Khalid Ahmed', phone: '+923001515151', schoolId: SCHOOL_ID, staffType: 'ADMINISTRATIVE', qualifications: 'B.Com', experience: 8, monthlySalary: 45000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'staff-4', email: 'accountant@school1.com', name: 'Farhan Ali', phone: '+923001616161', schoolId: SCHOOL_ID, staffType: 'FINANCE', qualifications: 'M.Com, CA', experience: 10, monthlySalary: 80000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'staff-5', email: 'it.support@school1.com', name: 'Zeeshan Khan', phone: '+923001717171', schoolId: SCHOOL_ID, staffType: 'IT', qualifications: 'BSCS', experience: 5, monthlySalary: 60000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'staff-6', email: 'security@school1.com', name: 'Rashid Ali', phone: '+923001818181', schoolId: SCHOOL_ID, staffType: 'SECURITY', qualifications: 'Matric', experience: 12, monthlySalary: 30000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'staff-7', email: 'maintenance@school1.com', name: 'Tariq Hussain', phone: '+923001919191', schoolId: SCHOOL_ID, staffType: 'MAINTENANCE', qualifications: 'Matric', experience: 8, monthlySalary: 28000, isActive: true, createdAt: now, updatedAt: now },
      { id: 'staff-8', email: 'librarian@school1.com', name: 'Sadia Iqbal', phone: '+923002020202', schoolId: SCHOOL_ID, staffType: 'SUPPORT', qualifications: 'M.LIS', experience: 6, monthlySalary: 40000, isActive: true, createdAt: now, updatedAt: now },
    ];
    saveTeachers(teachers);

    // 6. Initialize Students (at least 10 per section = 120+ students)
    // Students are associated with:
    // - academicSession: session name (e.g., '2024-2025')
    // - classApplyingFor: class ID
    // - sectionId: section ID
    // All sessions, classes, and sections must exist before creating students
    const students: Student[] = [];
    const firstNames = ['Ahmad', 'Fatima', 'Hassan', 'Zainab', 'Omar', 'Ayesha', 'Bilal', 'Sana', 'Usman', 'Nadia', 'Khalid', 'Amina', 'Rashid', 'Sadia', 'Tariq', 'Maryam', 'Ali', 'Hira', 'Ahmed', 'Zara'];
    const lastNames = ['Khan', 'Ali', 'Ahmed', 'Hassan', 'Malik', 'Iqbal', 'Raza', 'Hussain', 'Butt', 'Sheikh', 'Rashid', 'Iqbal', 'Khan', 'Ali', 'Ahmed'];
    
    let studentCounter = 1;
    const sectionIds = ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-8', 'section-9', 'section-10', 'section-11', 'section-12'];
    const classMap: Record<string, string> = {
      'section-1': 'class-1', 'section-2': 'class-1',
      'section-3': 'class-2', 'section-4': 'class-2',
      'section-5': 'class-3', 'section-6': 'class-3',
      'section-7': 'class-4', 'section-8': 'class-4',
      'section-9': 'class-5', 'section-10': 'class-5',
      'section-11': 'class-6', 'section-12': 'class-6',
    };
    // Map classes to their session names (must match session names created above)
    const sessionMap: Record<string, string> = {
      'class-1': '2024-2025', 'class-2': '2024-2025', 'class-3': '2024-2025',
      'class-4': '2025-2026', 'class-5': '2025-2026', 'class-6': '2025-2026',
    };

    sectionIds.forEach((sectionId, sectionIndex) => {
      const classId = classMap[sectionId];
      const sessionName = sessionMap[classId];
      const baseYear = sectionIndex < 6 ? 2014 : 2015; // Different base years for different sessions
      
      for (let i = 0; i < 12; i++) { // 12 students per section
        const firstName = firstNames[(studentCounter - 1) % firstNames.length];
        const lastName = lastNames[(studentCounter - 1) % lastNames.length];
        const gender = (studentCounter % 2 === 0) ? 'Female' : 'Male';
        const birthYear = baseYear + (i % 3); // Vary birth years
        const birthMonth = (i % 12) + 1;
        const birthDay = ((i * 7) % 28) + 1;
        const dateOfBirth = new Date(birthYear, birthMonth - 1, birthDay);
        const admissionDate = new Date(2024, 3, 1); // April 1, 2024
        
        // Generate student with proper associations:
        // - academicSession: session name (must match session.name from step 1)
        // - classApplyingFor: classId (must exist from step 2)
        // - sectionId: sectionId (must exist from step 3)
        students.push(generateStudent(
          `student-${studentCounter}`,
          firstName,
          lastName,
          gender,
          dateOfBirth,
          classId,
          sectionId,
          sessionName, // This must match the session.name created in step 1
          admissionDate,
          now
        ));
        studentCounter++;
      }
    });
    saveStudents(students);

    // 7. Initialize Timetables (one per section = 12 timetables total)
    const timetables: Timetable[] = [];
    const daysOfWeek: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      { start: '08:00', end: '08:45' },
      { start: '08:45', end: '09:30' },
      { start: '09:30', end: '10:15' },
      { start: '10:30', end: '11:15' },
      { start: '11:15', end: '12:00' },
      { start: '12:00', end: '12:45' },
    ];

    // Get subjects for each class
    const classSubjects: Record<string, string[]> = {
      'class-1': ['subject-1', 'subject-2', 'subject-3', 'subject-4'],
      'class-2': ['subject-5', 'subject-6', 'subject-7', 'subject-8'],
      'class-3': ['subject-9', 'subject-10', 'subject-11', 'subject-12', 'subject-13'],
      'class-4': ['subject-14', 'subject-15', 'subject-16'],
      'class-5': ['subject-17', 'subject-18', 'subject-19', 'subject-20', 'subject-21'],
      'class-6': ['subject-22', 'subject-23', 'subject-24', 'subject-25', 'subject-26', 'subject-27'],
    };

    // Get teachers for each class
    const classTeachers: Record<string, string[]> = {
      'class-1': ['teacher-1', 'teacher-3', 'teacher-11'],
      'class-2': ['teacher-2', 'teacher-5', 'teacher-10'],
      'class-3': ['teacher-6', 'teacher-7', 'teacher-8'],
      'class-4': ['teacher-1', 'teacher-3', 'teacher-12'],
      'class-5': ['teacher-2', 'teacher-5', 'teacher-10'],
      'class-6': ['teacher-4', 'teacher-6', 'teacher-9'],
    };

    // Create one timetable per section (12 timetables total)
    sections.forEach((section, sectionIndex) => {
      const classId = section.classId;
      const classSubjectsList = classSubjects[classId] || [];
      const classTeachersList = classTeachers[classId] || [];
      
      const entries: TimetableEntry[] = [];
      let entryCounter = 1;
      
      daysOfWeek.forEach((day, dayIndex) => {
        timeSlots.forEach((slot, slotIndex) => {
          if (slotIndex < classSubjectsList.length) {
            const subjectIndex = (dayIndex * timeSlots.length + slotIndex) % classSubjectsList.length;
            const teacherIndex = subjectIndex % classTeachersList.length;
            
            entries.push({
              id: `entry-${sectionIndex * 30 + entryCounter}`,
              dayOfWeek: day,
              startTime: slot.start,
              endTime: slot.end,
              subjectId: classSubjectsList[subjectIndex],
              teacherId: classTeachersList[teacherIndex],
              room: `Room ${100 + sectionIndex * 10 + slotIndex}`,
            });
            entryCounter++;
          }
        });
      });

      timetables.push({
        id: `timetable-${sectionIndex + 1}`,
        sectionId: section.id,
        schoolId: SCHOOL_ID,
        entries,
        createdAt: now,
        updatedAt: now,
      });
    });
    saveTimetables(timetables);

    // 8. Initialize Attendance Data (entire current month for students and staff)
    const attendances: Attendance[] = [];
    const adminUserId = 'admin-1'; // Default admin user ID for marking attendance
    
    // Generate attendance for the entire current month (from 1st to today)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Student attendance patterns: ~85-92% Present, ~6-10% Absent, ~3-5% Late
    students.forEach((student, studentIndex) => {
      // Generate attendance for each day from the 1st of the month to today
      for (let day = 1; day <= today.getDate(); day++) {
        const attendanceDate = new Date(currentYear, currentMonth, day);
        attendanceDate.setHours(0, 0, 0, 0);
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = attendanceDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue; // Skip weekends
        }
        
        // Skip future dates
        if (attendanceDate > today) {
          continue;
        }
        
        // Generate realistic attendance pattern
        // Use student index and day to create consistent but varied patterns
        const randomSeed = (studentIndex * 1000 + day) % 100;
        let status: AttendanceStatus;
        
        // Some students have better attendance than others
        const studentAttendanceRate = 82 + (studentIndex % 13); // 82-94% attendance rate
        
        if (randomSeed < studentAttendanceRate) {
          status = 'Present';
        } else if (randomSeed < studentAttendanceRate + 10) {
          status = 'Absent';
        } else {
          status = 'Late';
        }
        
        // Add some occasional absences for specific students (sick days, etc.)
        // Every 5-7 days, some students might be absent
        if (day % 6 === 0 && randomSeed > 88) {
          status = 'Absent';
        }
        
        // Some students are occasionally late (especially on Mondays)
        if (dayOfWeek === 1 && randomSeed > 85 && randomSeed < 92) {
          status = 'Late';
        }
        
        attendances.push({
          id: `attendance-student-${student.id}-${currentYear}-${currentMonth}-${day}`,
          studentId: student.id,
          date: attendanceDate,
          status,
          markedBy: adminUserId,
          schoolId: SCHOOL_ID,
          createdAt: attendanceDate,
          updatedAt: attendanceDate,
        });
      }
    });
    
    // Staff attendance patterns: ~90-96% Present, ~3-6% Absent, ~2-4% Late
    teachers.forEach((staff, staffIndex) => {
      // Generate attendance for each day from the 1st of the month to today
      for (let day = 1; day <= today.getDate(); day++) {
        const attendanceDate = new Date(currentYear, currentMonth, day);
        attendanceDate.setHours(0, 0, 0, 0);
        
        // Skip weekends
        const dayOfWeek = attendanceDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue; // Skip weekends
        }
        
        // Skip future dates
        if (attendanceDate > today) {
          continue;
        }
        
        // Generate realistic attendance pattern for staff
        const randomSeed = (staffIndex * 1000 + day) % 100;
        let status: AttendanceStatus;
        
        // Staff generally have better attendance
        const staffAttendanceRate = 88 + (staffIndex % 9); // 88-96% attendance rate
        
        if (randomSeed < staffAttendanceRate) {
          status = 'Present';
        } else if (randomSeed < staffAttendanceRate + 7) {
          status = 'Absent';
        } else {
          status = 'Late';
        }
        
        // Very occasional absences (sick leave, personal days)
        if (day % 12 === 0 && randomSeed > 92) {
          status = 'Absent';
        }
        
        // Staff can be late occasionally (especially on Mondays)
        if (dayOfWeek === 1 && randomSeed > 90 && randomSeed < 96) {
          status = 'Late';
        }
        
        attendances.push({
          id: `attendance-staff-${staff.id}-${currentYear}-${currentMonth}-${day}`,
          staffId: staff.id,
          date: attendanceDate,
          status,
          markedBy: adminUserId,
          schoolId: SCHOOL_ID,
          createdAt: attendanceDate,
          updatedAt: attendanceDate,
        });
      }
    });
    
    saveAttendances(attendances);

    // 9. Initialize Policies (Security Deduction and Leave Deduction)
    // Policies should be initialized after staff are created (for reference)
    const securityPolicy: SecurityDeductionPolicy = {
      id: 'security-policy-1',
      schoolId: SCHOOL_ID,
      deductionType: 'percentage',
      deductionValue: 10, // 10% of salary
      durationMonths: 3, // For first 3 months
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    saveSecurityDeductionPolicies([securityPolicy]);

    const leavePolicy: LeaveDeductionPolicy = {
      id: 'leave-policy-1',
      schoolId: SCHOOL_ID,
      deductionType: 'fixed',
      deductionValue: 500, // 500 PKR per leave
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    saveLeaveDeductionPolicies([leavePolicy]);

    // Mark as initialized
    markAsInitialized();
  } catch (error) {
    console.error('❌ Error initializing school data:', error);
  }
};
