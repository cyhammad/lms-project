'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { formatBForm, validateBForm, formatCNIC, validateCNIC, formatMobileNumber, validateMobileNumber } from '@/lib/validation';
import type { Student, Gender, Religion, PrimaryContact, Province, DiscountType, Class, Section, AcademicSession } from '@/types';
import { updateStudent } from '@/actions/students';
import { toast } from 'sonner';
import { getStorageUrl } from '@/lib/storage-url';

interface EditStudentClientProps {
  student: Student;
  initialClasses: Class[];
  initialSections: Section[];
  initialSessions: AcademicSession[];
  schoolId: string;
}

export default function EditStudentClient({
  student,
  initialClasses,
  initialSections,
  initialSessions,
  schoolId
}: EditStudentClientProps) {
  const router = useRouter();
  const { showError, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(false);

  // Initialize form data from student prop
  const [formData, setFormData] = useState({
    // Section A: Student Information
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    email: student.email || '',
    gender: (student.gender as Gender) || 'Male',
    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
    placeOfBirth: student.placeOfBirth || '',
    religion: (student.religion as Religion | '') || '',
    religionOther: student.religionOther || '',
    nationality: student.nationality || 'Pakistani',
    bFormCrc: student.bFormCrc || '',
    studentPhoto: student.studentPhoto || '',
    specialNeeds: student.specialNeeds || false,
    specialNeedsDetails: student.specialNeedsDetails || '',

    // Section B: Admission Details
    admissionDate: student.admissionDate
      ? new Date(student.admissionDate).toISOString().split('T')[0]
      : (student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : ''),
    academicSession: student.academicSession || '',
    classApplyingFor: student.classApplyingFor || student.classId || '',
    sectionId: student.sectionId || '',
    previousSchoolName: student.previousSchoolName || '',
    previousSchoolAddress: student.previousSchoolAddress || '',
    reasonForLeaving: student.reasonForLeaving || '',

    // Section C: Address Information
    addressLine1: student.addressLine1 || '',
    addressLine2: student.addressLine2 || '',
    city: student.city || '',
    province: (student.province as Province | '') || '',
    postalCode: student.postalCode || '',

    // Section D: Fee & Discount
    admissionFee: student.admissionFee?.toString() || '',
    discountType: (student.discountType as DiscountType) || 'NONE',
    discountedFee: student.discountedFee?.toString() || '',

    // Primary contact selection
    primaryContact: (student.primaryContact as PrimaryContact) || 'FATHER',

    isActive: student.isActive,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const classSections = formData.classApplyingFor
    ? initialSections.filter(s => s.classId === formData.classApplyingFor && s.isActive)
    : [];

  const selectedClass = formData.classApplyingFor
    ? initialClasses.find(c => c.id === formData.classApplyingFor)
    : null;
  const standardFee = selectedClass?.standardFee || 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Section A: Student Information
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.bFormCrc.trim()) {
      newErrors.bFormCrc = 'B-Form/CRC is required';
    } else if (!validateBForm(formData.bFormCrc)) {
      newErrors.bFormCrc = 'Invalid B-Form/CRC format. Use format: #####-#######-#';
    }
    if (formData.religion === 'Other' && !formData.religionOther.trim()) newErrors.religionOther = 'Please specify religion';
    if (formData.specialNeeds && !formData.specialNeedsDetails.trim()) newErrors.specialNeedsDetails = 'Please provide special needs details';

    // Section B: Admission Details
    if (!formData.admissionDate) newErrors.admissionDate = 'Admission date is required';
    if (!formData.academicSession) newErrors.academicSession = 'Please select an academic session';
    if (!formData.classApplyingFor) newErrors.classApplyingFor = 'Please select a class';
    if (!formData.sectionId) newErrors.sectionId = 'Please select a section';

    // Section C: Address Information
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
    if (!formData.addressLine2.trim()) newErrors.addressLine2 = 'Address line 2 is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province) newErrors.province = 'Province is required';

    // Section D: Fee & Discount
    if (!formData.classApplyingFor) newErrors.classApplyingFor = 'Class is required to determine fee';
    if (formData.discountedFee && formData.discountedFee.trim()) {
      const discountedFee = Number(formData.discountedFee);
      if (isNaN(discountedFee) || discountedFee < 0) newErrors.discountedFee = 'Must be a positive number';
      if (standardFee > 0 && discountedFee > standardFee) newErrors.discountedFee = 'Cannot be greater than standard fee';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !schoolId) return;

    setLoading(true);
    try {
      const studentData = {
        ...formData,
        schoolId,
        // Map Enums to Backend Format (UPPERCASE)
        gender: formData.gender.toUpperCase(),
        religion: formData.religion ? formData.religion.toUpperCase() : undefined,
        province: formData.province.toUpperCase(),
        discountType: formData.discountType.toUpperCase(),
        primaryContact: formData.primaryContact.toUpperCase(),
      };

      const result = await updateStudent(student.id, studentData);

      if (result.success) {
        toast.success('Student updated successfully');
        router.push(ROUTES.ADMIN.STUDENTS);
      } else {
        toast.error(result.error || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBForm(e.target.value);
    setFormData({ ...formData, bFormCrc: formatted });
    if (errors.bFormCrc) setErrors({ ...errors, bFormCrc: '' });
  };

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_DIMENSION = 800;
    const QUALITY = 0.7;

    const compressed = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
    setFormData({ ...formData, studentPhoto: compressed });
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, studentPhoto: '' });
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const photoSrc = getStorageUrl(formData.studentPhoto);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
        <p className="text-gray-600 mt-1">Update student information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A: Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Section A: Student Information</CardTitle>
            <CardDescription>Personal details of the student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName) setErrors({ ...errors, lastName: '' });
                  }}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => {
                    setFormData({ ...formData, dateOfBirth: e.target.value });
                    if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
                  }}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                <input
                  type="text"
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value as Religion | '', religionOther: e.target.value !== 'Other' ? '' : formData.religionOther })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
                >
                  <option value="">Select religion</option>
                  <option value="Islam">Islam</option>
                  <option value="Christian">Christian</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.religion === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specify Religion *</label>
                  <input
                    type="text"
                    required
                    value={formData.religionOther}
                    onChange={(e) => setFormData({ ...formData, religionOther: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.religionOther ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
                  />
                  {errors.religionOther && <p className="text-sm text-red-500 mt-1">{errors.religionOther}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">B-Form/CRC Number *</label>
              <input
                type="text"
                required
                value={formData.bFormCrc}
                onChange={handleBFormChange}
                maxLength={15}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 placeholder-gray-400 text-sm ${errors.bFormCrc ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
              />
              {errors.bFormCrc && <p className="text-sm text-red-500 mt-1">{errors.bFormCrc}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              {photoSrc ? (
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    <img
                      src={photoSrc}
                      alt="Student preview"
                      className="w-28 h-28 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#10b981] bg-[#10b981]/10 hover:bg-[#10b981]/20 rounded-lg transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#10b981] hover:bg-[#10b981]/5 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 min-w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
                  </div>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="specialNeeds" checked={formData.specialNeeds} onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.checked, specialNeedsDetails: e.target.checked ? formData.specialNeedsDetails : '' })} className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981]" />
                <label htmlFor="specialNeeds" className="text-sm font-medium text-gray-700">Has Special Needs</label>
              </div>
              {formData.specialNeeds && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs Details *</label>
                  <textarea required value={formData.specialNeedsDetails} onChange={(e) => setFormData({ ...formData, specialNeedsDetails: e.target.value })} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.specialNeedsDetails ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`} rows={3} />
                  {errors.specialNeedsDetails && <p className="text-sm text-red-500 mt-1">{errors.specialNeedsDetails}</p>}
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
                <input type="date" required value={formData.admissionDate} onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.admissionDate ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`} max={new Date().toISOString().split('T')[0]} />
                {errors.admissionDate && <p className="text-sm text-red-500 mt-1">{errors.admissionDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session *</label>
                <select required value={formData.academicSession} onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.academicSession ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}>
                  <option value="">Select academic session</option>
                  {initialSessions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                {errors.academicSession && <p className="text-sm text-red-500 mt-1">{errors.academicSession}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Applying For *</label>
                <select required value={formData.classApplyingFor} onChange={(e) => {
                  const newId = e.target.value;
                  setFormData({ ...formData, classApplyingFor: newId, sectionId: '', discountedFee: formData.discountType === 'NONE' ? '' : formData.discountedFee });
                }} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.classApplyingFor ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}>
                  <option value="">Select a class</option>
                  {initialClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.grade}</option>)}
                </select>
                {errors.classApplyingFor && <p className="text-sm text-red-500 mt-1">{errors.classApplyingFor}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                <select required value={formData.sectionId} onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })} disabled={!formData.classApplyingFor} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.sectionId ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}>
                  <option value="">Select a section</option>
                  {classSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.sectionId && <p className="text-sm text-red-500 mt-1">{errors.sectionId}</p>}
              </div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Previous School Name</label><input type="text" value={formData.previousSchoolName} onChange={(e) => setFormData({ ...formData, previousSchoolName: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Previous School Address</label><textarea value={formData.previousSchoolAddress} onChange={(e) => setFormData({ ...formData, previousSchoolAddress: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm" rows={2} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label><textarea value={formData.reasonForLeaving} onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm" rows={3} /></div>
          </CardContent>
        </Card>

        {/* Section C: Address */}
        <Card>
          <CardHeader><CardTitle>Section C: Address Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label><input type="text" required value={formData.addressLine1} onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.addressLine1 ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`} />{errors.addressLine1 && <p className="text-sm text-red-500 mt-1">{errors.addressLine1}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 *</label><input type="text" required value={formData.addressLine2} onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.addressLine2 ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`} />{errors.addressLine2 && <p className="text-sm text-red-500 mt-1">{errors.addressLine2}</p>}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.city ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`} />{errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                <select required value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value as Province })} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.province ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}>
                  <option value="">Select</option>
                  <option value="PUNJAB">Punjab</option>
                  <option value="SINDH">Sindh</option>
                  <option value="KP">KP</option>
                  <option value="BALOCHISTAN">Balochistan</option>
                  <option value="GB">GB</option>
                  <option value="ICT">ICT</option>
                </select>
                {errors.province && <p className="text-sm text-red-500 mt-1">{errors.province}</p>}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label><input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm" /></div>
          </CardContent>
        </Card>

        {/* Section D: Fee */}
        <Card>
          <CardHeader><CardTitle>Section D: Fee & Discount</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Admission Fee (PKR)</label><input type="number" min="0" value={formData.admissionFee} onChange={(e) => setFormData({ ...formData, admissionFee: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Fee (Monthly)</label>
                <input type="text" value={selectedClass ? `PKR ${standardFee.toLocaleString()}` : 'Select Class'} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 cursor-not-allowed text-sm" readOnly />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm">
                  <option value="NONE">None</option>
                  <option value="SIBLING">Sibling</option>
                  <option value="STAFF">Staff</option>
                  <option value="MERIT">Merit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Fee {formData.discountType !== 'NONE' ? '*' : ''}</label>
                <input type="number" min="0" value={formData.discountType === 'NONE' ? standardFee.toString() : formData.discountedFee} onChange={(e) => setFormData({ ...formData, discountedFee: e.target.value })} disabled={formData.discountType === 'NONE' || !selectedClass} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.discountedFee ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'} ${formData.discountType === 'NONE' || !selectedClass ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                {errors.discountedFee && <p className="text-sm text-red-500 mt-1">{errors.discountedFee}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push(ROUTES.ADMIN.STUDENTS)} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Student'}</Button>
        </div>
      </form>

      <AlertComponent />
    </div>
  );
}
