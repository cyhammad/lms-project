'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Briefcase, Mail, Phone, User, GraduationCap, Clock, Calendar, BookOpen, MapPin, Award, Key, DollarSign, ExternalLink, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { returnSecurityDeductions } from '@/actions/security-deductions';
import StaffPhotoCard from './staff-photo-card';
import type { Teacher, Timetable, TimetableEntry, DayOfWeek, Class, Section, Subject, SecurityDeductionRecord } from '@/types';

// Helper types
type TimetableEntryWithContext = {
  entry: TimetableEntry;
  timetableId: string;
  sectionId: string;
};

interface StaffDetailsClientProps {
  staff: Teacher;
  timetableEntries: TimetableEntryWithContext[];
  securityRecords: SecurityDeductionRecord[];
  classes: Class[];
  sections: Section[];
  subjects: Subject[];
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREVIATIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Color palette for different subjects
const SUBJECT_COLORS_LIGHT = [
  'bg-blue-50 border-blue-200 text-blue-900',
  'bg-slate-50 border-slate-200 text-slate-900',
  'bg-purple-50 border-purple-200 text-purple-900',
  'bg-pink-50 border-pink-200 text-pink-900',
  'bg-orange-50 border-orange-200 text-orange-900',
  'bg-cyan-50 border-cyan-200 text-cyan-900',
  'bg-indigo-50 border-indigo-200 text-indigo-900',
  'bg-rose-50 border-rose-200 text-rose-900',
  'bg-amber-50 border-amber-200 text-amber-900',
  'bg-teal-50 border-teal-200 text-teal-900',
];

const SUBJECT_COLORS = [
  'bg-blue-500',
  'bg-slate-700',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
];

export default function StaffDetailsClient({
  staff,
  timetableEntries,
  securityRecords,
  classes,
  sections,
  subjects,
}: StaffDetailsClientProps) {
  const router = useRouter();
  const { showSuccess, showError, showConfirm, AlertComponent, ConfirmComponent } = useAlert();

  // Group entries by day
  const entriesByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, TimetableEntryWithContext[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    timetableEntries.forEach((entry) => {
      if (entry.entry.dayOfWeek) {
        grouped[entry.entry.dayOfWeek].push(entry);
      }
    });

    // Sort entries by start time for each day
    Object.keys(grouped).forEach(day => {
      grouped[day as DayOfWeek].sort((a, b) => {
        return a.entry.startTime.localeCompare(b.entry.startTime);
      });
    });

    return grouped;
  }, [timetableEntries]);

  // Get unique subjects and assign colors
  const subjectColorMap = useMemo(() => {
    if (timetableEntries.length === 0) return {};
    const uniqueSubjects = Array.from(new Set(timetableEntries.map(({ entry }) => entry.subjectId)));
    const map: Record<string, { color: string; lightColor: string }> = {};
    uniqueSubjects.forEach((subjectId, index) => {
      map[subjectId] = {
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
        lightColor: SUBJECT_COLORS_LIGHT[index % SUBJECT_COLORS_LIGHT.length],
      };
    });
    return map;
  }, [timetableEntries]);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : 'Unknown Section';
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name} (${cls.code})` : 'Unknown Class';
  };

  const getSectionClassId = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.classId : '';
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleReturnSecurity = async () => {
    if (!staff.id) return;

    const confirmed = await showConfirm(
      `Are you sure you want to return security deductions for ${staff.name}? This will mark all unreturned deductions as returned.`,
      'Return Security',
      'Return Security',
      'Cancel',
      'default'
    );

    if (!confirmed) return;

    try {
      const result = await returnSecurityDeductions(staff.id);

      if (result.success) {
        showSuccess(`Successfully returned security deductions.`);
        // Note: Actual refresh happens via server action revalidatePath, but client update might lag slightly unless we optimistically update or router.refresh()
        router.refresh();
      } else {
        showError(result.error || 'Failed to return security deductions');
      }
    } catch (error) {
      console.error('Error returning security:', error);
      showError('Failed to return security. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={ROUTES.ADMIN.STAFF}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Staff
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
            <p className="text-gray-600 mt-1">Staff Member Details & Information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={ROUTES.ADMIN.STAFF_WORK_CALENDAR_BY_ID(staff.id)}>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Work Calendar
            </Button>
          </Link>
          <Link href={ROUTES.ADMIN.STAFF_EDIT(staff.id)}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Staff
            </Button>
          </Link>
        </div>
      </div>

      {/* Staff Photo and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StaffPhotoCard
          staffId={staff.id}
          staffPhoto={staff.photo || null}
          staffName={staff.name}
          staffEmail={staff.email}
          staffType={staff.staffType}
        />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900">{staff.email}</p>
                </div>
              </div>
              {staff.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-base font-medium text-gray-900">{staff.phone}</p>
                  </div>
                </div>
              )}
              {staff.staffType && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Staff Type</p>
                    <p className="text-base font-medium text-gray-900">{staff.staffType}</p>
                  </div>
                </div>
              )}
              {staff.experience !== undefined && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="text-base font-medium text-gray-900">
                      {staff.experience} {staff.experience === 1 ? 'year' : 'years'}
                    </p>
                  </div>
                </div>
              )}
              {staff.monthlySalary !== undefined && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Salary</p>
                    <p className="text-base font-medium text-gray-900">
                      PKR {staff.monthlySalary.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Salary Management</p>
                  <Link href={ROUTES.ADMIN.SALARIES.STAFF(staff.id)}>
                    <button className="text-base font-medium text-green-600 hover:text-green-700 hover:underline flex items-center gap-1">
                      View Salary Records
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(staff.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Total Classes</p>
                  <p className="text-base font-medium text-gray-900">
                    {timetableEntries.length} {timetableEntries.length === 1 ? 'period' : 'periods'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Information */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
          <CardDescription>Detailed information about the staff member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="text-base font-medium text-gray-900">{staff.name}</p>
              </div>   {staff.phone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="text-base font-medium text-gray-900">{staff.phone}</p>
                </div>
              )} <div>
                <p className="text-sm text-gray-500 mb-1">Member Since</p>
                <p className="text-base font-medium text-gray-900">{formatDate(staff.createdAt)}</p>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">   {staff.staffType && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Staff Type</p>
                <p className="text-base font-medium text-gray-900">{staff.staffType}</p>
              </div>
            )}  <div>
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="text-base font-medium text-gray-900">{staff.email}</p>
              </div>

              {staff.username && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    App Access Username
                  </p>
                  <p className="text-base font-medium text-gray-900">{staff.username}</p>
                </div>
              )}
              {staff.monthlySalary !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Monthly Salary
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    PKR {staff.monthlySalary.toLocaleString()}
                  </p>
                </div>
              )}

            </div>

            {/* Full Width Fields */}
            {staff.qualifications && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Qualifications</p>
                <p className="text-base font-medium text-gray-900">{staff.qualifications}</p>
              </div>
            )}
            {staff.subjects && staff.subjects.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Subjects / Departments</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {staff.subjects.map((subject: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 text-sm font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Deductions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Deductions
          </CardTitle>
          <CardDescription>Security deductions and return status</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const unreturnedRecords = securityRecords.filter(r => r.status === 'deducted');
            const returnedRecords = securityRecords.filter(r => r.status === 'returned');
            const totalDeducted = securityRecords.reduce((sum, r) => sum + r.amount, 0);
            const totalReturned = returnedRecords.reduce((sum, r) => sum + r.amount, 0);
            const pendingReturn = unreturnedRecords.reduce((sum, r) => sum + r.amount, 0);

            return (
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600">Total Deducted</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      PKR {totalDeducted.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-800">Total Returned</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      PKR {totalReturned.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-orange-600">Pending Return</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      PKR {pendingReturn.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Unreturned Deductions */}
                {unreturnedRecords.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Unreturned Deductions ({unreturnedRecords.length})</h4>
                      <Button onClick={handleReturnSecurity} variant="outline" size="sm">
                        <Shield className="w-4 h-4 mr-2" />
                        Return Security
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {unreturnedRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 border border-orange-200 bg-orange-50 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {new Date(record.year, record.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-slate-800 mt-1">
                              Deducted: {new Date(record.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-semibold text-orange-900">
                            PKR {record.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Returned Deductions */}
                {returnedRecords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Returned Deductions ({returnedRecords.length})</h4>
                    <div className="space-y-2">
                      {returnedRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {new Date(record.year, record.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-slate-800 mt-1">
                              Returned: {record.returnedDate ? new Date(record.returnedDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <p className="font-semibold text-slate-900">
                            PKR {record.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Records */}
                {securityRecords.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700">No security deductions recorded</p>
                    <p className="text-sm text-slate-800 mt-1">
                      Security deductions will be automatically recorded when salaries are generated
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Timetable Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Associated Timetable
          </CardTitle>
          <CardDescription>
            Weekly schedule showing all classes assigned to this staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timetableEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No timetable entries found</p>
              <p className="text-sm">This staff member is not assigned to any classes yet.</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Total Periods</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          {timetableEntries.length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-700 font-medium">Subjects</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {new Set(timetableEntries.map(({ entry }) => entry.subjectId)).size}
                        </p>
                      </div>
                      <BookOpen className="w-8 h-8 text-slate-800" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Days</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">
                          {DAYS_OF_WEEK.filter(day => entriesByDay[day].length > 0).length}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700 font-medium">Sections</p>
                        <p className="text-2xl font-bold text-orange-900 mt-1">
                          {new Set(timetableEntries.map(({ sectionId }) => sectionId)).size}
                        </p>
                      </div>
                      <GraduationCap className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {DAYS_OF_WEEK.map((day, index) => {
                  const dayEntries = entriesByDay[day];
                  const hasEntries = dayEntries.length > 0;
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-lg text-center border-2 transition-all ${hasEntries
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-600 shadow-md'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide mb-1">
                        {DAY_ABBREVIATIONS[index]}
                      </p>
                      <p className="text-sm font-semibold">{day}</p>
                      {hasEntries && (
                        <p className="text-xs mt-1 opacity-90">
                          {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Timetable Grid */}
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const dayEntries = entriesByDay[day];
                  if (dayEntries.length === 0) return null;

                  return (
                    <div key={day} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <h3 className="font-semibold text-gray-900">{day}</h3>
                        <span className="text-sm text-gray-500">
                          {dayEntries.length} {dayEntries.length === 1 ? 'period' : 'periods'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dayEntries.map(({ entry, sectionId }, idx) => {
                          const subjectName = getSubjectName(entry.subjectId);
                          const sectionName = getSectionName(sectionId);
                          const classId = getSectionClassId(sectionId);
                          const className = getClassName(classId);
                          const colors = subjectColorMap[entry.subjectId] || {
                            color: 'bg-gray-500',
                            lightColor: 'bg-gray-50 border-gray-200 text-gray-900',
                          };

                          return (
                            <div
                              key={idx}
                              className={`${colors.lightColor} border-2 rounded-lg p-4 hover:shadow-lg transition-all transform hover:-translate-y-1`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base mb-1">{subjectName}</h4>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-sm">
                                      <GraduationCap className="w-3.5 h-3.5 opacity-70" />
                                      <span className="font-medium">{sectionName} - {className}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-3.5 h-3.5 opacity-70" />
                                      <span className="font-medium">
                                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                      </span>
                                    </div>
                                    {entry.room && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-3.5 h-3.5 opacity-70" />
                                        <span>{entry.room}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={`w-3 h-3 rounded-full ${colors.color} flex-shrink-0 mt-1`}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subject Legend */}
              {Object.keys(subjectColorMap).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Subject Legend</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(subjectColorMap).map(([subjectId, colors]) => {
                      const subjectName = getSubjectName(subjectId);
                      return (
                        <div
                          key={subjectId}
                          className={`${colors.lightColor} border-2 rounded-lg p-3 flex items-center gap-3`}
                        >
                          <div className={`w-4 h-4 rounded-full ${colors.color} flex-shrink-0`}></div>
                          <span className="font-medium text-sm">{subjectName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertComponent />
      <ConfirmComponent />
    </div>
  );
}
