import { getCurrentUser } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { apiServer } from '@/lib/api-server';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { Student, Class, Section } from '@/types';
import StudentPhotoCard from './student-photo-card';

async function getData(studentId: string) {
  try {
    const [studentRes, classesRes, sectionsRes] = await Promise.all([
      apiServer<{ student: Student }>(`/students/${studentId}`),
      apiServer<{ classes: Class[] }>('/classes'),
      apiServer<{ sections: Section[] }>('/sections'),
    ]);

    if (!studentRes || !studentRes.student) {
      return null;
    }

    return {
      student: studentRes.student,
      classes: classesRes.classes || [],
      sections: sectionsRes.sections || [],
    };
  } catch (error) {
    console.error('Error fetching data for view student:', error);
    return null;
  }
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return 'N/A';
  return `PKR ${amount.toLocaleString()}`;
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentDetailsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id: studentId } = await params;

  if (!user || !user.schoolId) {
    redirect('/login');
  }

  const data = await getData(studentId);

  if (!data) {
    notFound();
  }

  const { student, classes, sections } = data;

  if (student.schoolId !== user.schoolId) {
    redirect('/admin/students');
  }

  const studentClass = classes.find(c => c.id === (student.classId || student.classApplyingFor));
  const studentSection = sections.find(s => s.id === student.sectionId);
  const displayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={ROUTES.ADMIN.STUDENTS}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-600 mt-1">Student Details & Information</p>
          </div>
        </div>
        <Link href={ROUTES.ADMIN.STUDENTS_EDIT(student.id)}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Student
          </Button>
        </Link>
      </div>

      {/* Student Photo and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StudentPhotoCard
          studentId={student.id}
          studentPhoto={student.studentPhoto || null}
          displayName={displayName}
          studentIdentifier={student.studentId || student.bFormCrc || 'N/A'}
          isActive={student.isActive}
        />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Class</p>
                <p className="text-base font-medium text-gray-900">
                  {studentClass?.name || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Section</p>
                <p className="text-base font-medium text-gray-900">
                  {studentSection?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="text-base font-medium text-gray-900">
                  {student.grade || studentClass?.grade || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Academic Session</p>
                <p className="text-base font-medium text-gray-900">
                  {student.academicSession || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Admission Date</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(student.admissionDate || student.enrollmentDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Primary Contact</p>
                <p className="text-base font-medium text-gray-900">
                  {student.primaryContact || 'Father'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section A: Student Information */}
      <Card>
        <CardHeader>
          <CardTitle>Section A: Student Information</CardTitle>
          <CardDescription>Personal details of the student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">First Name</p>
              <p className="text-base font-medium text-gray-900">{student.firstName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Name</p>
              <p className="text-base font-medium text-gray-900">{student.lastName || 'N/A'}</p>
            </div>
            {student.email && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-base font-medium text-gray-900">{student.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Gender</p>
              <p className="text-base font-medium text-gray-900">{student.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
              <p className="text-base font-medium text-gray-900">{formatDate(student.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Place of Birth</p>
              <p className="text-base font-medium text-gray-900">{student.placeOfBirth || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Nationality</p>
              <p className="text-base font-medium text-gray-900">{student.nationality || 'Pakistani'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Religion</p>
              <p className="text-base font-medium text-gray-900">
                {student.religion === 'Other' ? student.religionOther : (student.religion || 'N/A')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">B-Form/CRC Number</p>
              <p className="text-base font-medium text-gray-900">{student.bFormCrc || 'N/A'}</p>
            </div>
            {student.specialNeeds && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Special Needs</p>
                <p className="text-base font-medium text-gray-900">Yes</p>
                {student.specialNeedsDetails && (
                  <p className="text-sm text-gray-700 mt-2">{student.specialNeedsDetails}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section B: Admission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Section B: Admission Details</CardTitle>
          <CardDescription>Admission and academic information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Admission Date</p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(student.admissionDate || student.enrollmentDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Academic Session</p>
              <p className="text-base font-medium text-gray-900">{student.academicSession || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Class</p>
              <p className="text-base font-medium text-gray-900">
                {studentClass?.name || 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Section</p>
              <p className="text-base font-medium text-gray-900">
                {studentSection?.name || 'N/A'}
              </p>
            </div>
            {student.previousSchoolName && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Previous School Name</p>
                <p className="text-base font-medium text-gray-900">{student.previousSchoolName}</p>
              </div>
            )}
            {student.previousSchoolAddress && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Previous School Address</p>
                <p className="text-base font-medium text-gray-900">{student.previousSchoolAddress}</p>
              </div>
            )}
            {student.reasonForLeaving && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Reason for Leaving</p>
                <p className="text-base font-medium text-gray-900">{student.reasonForLeaving}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section C: Parent / Guardian Information */}
      <Card>
        <CardHeader>
          <CardTitle>Section C: Parent / Guardian Information</CardTitle>
          <CardDescription>Contact information for parents and guardians</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Parents from parentAccounts */}
          {student.parentAccounts && student.parentAccounts.length > 0 ? (
            <>
              {/* Father Information */}
              {student.parentAccounts.filter(p => {
                const type = (p.parentType || '').toUpperCase();
                return type === 'FATHER';
              }).map((father) => (
                <div key={father.id}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Father Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="text-base font-medium text-gray-900">{father.name || 'N/A'}</p>
                    </div>
                    {father.cnic && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">CNIC</p>
                        <p className="text-base font-medium text-gray-900">{father.cnic}</p>
                      </div>
                    )}
                    {father.phone && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Mobile</p>
                        <p className="text-base font-medium text-gray-900">{father.phone}</p>
                      </div>
                    )}
                    {father.email && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="text-base font-medium text-gray-900">{father.email}</p>
                      </div>
                    )}
                    {father.occupation && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Occupation</p>
                        <p className="text-base font-medium text-gray-900">{father.occupation}</p>
                      </div>
                    )}
                    {father.monthlyIncome !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
                        <p className="text-base font-medium text-gray-900">{formatCurrency(father.monthlyIncome)}</p>
                      </div>
                    )}
                    {father.username && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Username (Mobile App)</p>
                        <p className="text-base font-medium text-gray-900">{father.username}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Mother Information */}
              {student.parentAccounts.filter(p => {
                const type = (p.parentType || '').toUpperCase();
                return type === 'MOTHER';
              }).map((mother) => (
                <div key={mother.id}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Mother Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="text-base font-medium text-gray-900">{mother.name || 'N/A'}</p>
                    </div>
                    {mother.cnic && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">CNIC</p>
                        <p className="text-base font-medium text-gray-900">{mother.cnic}</p>
                      </div>
                    )}
                    {mother.phone && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Mobile</p>
                        <p className="text-base font-medium text-gray-900">{mother.phone}</p>
                      </div>
                    )}
                    {mother.email && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="text-base font-medium text-gray-900">{mother.email}</p>
                      </div>
                    )}
                    {mother.username && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Username (Mobile App)</p>
                        <p className="text-base font-medium text-gray-900">{mother.username}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Guardian Information */}
              {student.parentAccounts.filter(p => {
                const type = (p.parentType || '').toUpperCase();
                return type === 'GUARDIAN';
              }).map((guardian) => (
                <div key={guardian.id}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="text-base font-medium text-gray-900">{guardian.name || 'N/A'}</p>
                    </div>
                    {guardian.guardianRelation && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Relation</p>
                        <p className="text-base font-medium text-gray-900">
                          {guardian.guardianRelation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    )}
                    {guardian.cnic && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">CNIC</p>
                        <p className="text-base font-medium text-gray-900">{guardian.cnic}</p>
                      </div>
                    )}
                    {guardian.phone && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Mobile</p>
                        <p className="text-base font-medium text-gray-900">{guardian.phone}</p>
                      </div>
                    )}
                    {guardian.email && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="text-base font-medium text-gray-900">{guardian.email}</p>
                      </div>
                    )}
                    {guardian.username && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Username (Mobile App)</p>
                        <p className="text-base font-medium text-gray-900">{guardian.username}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No parent/guardian information available</p>
            </div>
          )}

          {/* Primary Contact */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Primary Contact</p>
            <p className="text-base font-medium text-gray-900">
              {student.primaryContact ? student.primaryContact.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Father'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Used for SMS / WhatsApp / OTP notifications</p>
          </div>

          {/* Linked Parent Accounts (Mobile App) - Summary */}
          {student.parentAccounts && student.parentAccounts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Linked Parent Accounts (Mobile App)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.parentAccounts.map((parent) => {
                  const parentTypeUpper = (parent.parentType || '').toUpperCase();
                  return (
                    <div key={parent.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          parentTypeUpper === 'FATHER' ? 'bg-blue-100 text-blue-700' :
                          parentTypeUpper === 'MOTHER' ? 'bg-pink-100 text-pink-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {parentTypeUpper === 'FATHER' ? 'Father' :
                           parentTypeUpper === 'MOTHER' ? 'Mother' :
                           parentTypeUpper === 'GUARDIAN' ? 'Guardian' : 'Parent'}
                        </span>
                        <span className={`text-xs ${parent.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {parent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{parent.name}</p>
                      <p className="text-sm text-gray-600">{parent.email || parent.username || 'No email/username'}</p>
                      {parent.phone && <p className="text-sm text-gray-600">{parent.phone}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section D: Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Section D: Address Information</CardTitle>
          <CardDescription>Residential address of the student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Address Line 1 (House/Flat)</p>
              <p className="text-base font-medium text-gray-900">{student.addressLine1 || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Address Line 2 (Street/Area)</p>
              <p className="text-base font-medium text-gray-900">{student.addressLine2 || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">City</p>
              <p className="text-base font-medium text-gray-900">{student.city || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Province</p>
              <p className="text-base font-medium text-gray-900">{student.province || 'N/A'}</p>
            </div>
            {student.postalCode && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Postal Code</p>
                <p className="text-base font-medium text-gray-900">{student.postalCode}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section E: Fee & Discount */}
      {(student.admissionFee !== undefined || student.discountedFee !== undefined || student.discountType) && (
        <Card>
          <CardHeader>
            <CardTitle>Section E: Fee & Discount</CardTitle>
            <CardDescription>Fee structure and discount information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.admissionFee !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Admission Fee</p>
                  <p className="text-base font-medium text-gray-900">{formatCurrency(student.admissionFee)}</p>
                </div>
              )}
              {student.discountedFee !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Discounted Fee</p>
                  <p className="text-base font-medium text-gray-900">{formatCurrency(student.discountedFee)}</p>
                </div>
              )}
              {student.discountType && student.discountType.toUpperCase() !== 'NONE' && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Discount Type</p>
                    <p className="text-base font-medium text-gray-900">{student.discountType}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
