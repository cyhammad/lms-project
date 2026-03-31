'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Check, User, FileText, Users, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { validateBForm, validateCNIC, validateMobileNumber } from '@/lib/validation';
import type { Class, Section, AcademicSession } from '@/types';
import { createStudent } from '@/actions/students';
import { createParent, searchParents, connectParentToStudent } from '@/actions/parents';
import { toast } from 'sonner';
import { useStudentFormStore } from '@/stores/use-student-form-store';
import BulkUploadDialog from '../bulk-upload-dialog';
import StepBasicInfo from './components/step-basic-info';
import StepAdditionalDetails from './components/step-additional-details';
import SectionEParentGuardian from './components/section-e-parent-guardian';
import SectionFParentAccount from './components/section-f-parent-account';

interface CreateStudentClientProps {
  initialClasses: Class[];
  initialSections: Section[];
  initialSessions: AcademicSession[];
  schoolId: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Details', icon: FileText },
  { id: 3, title: 'Parents', icon: Users },
];

export default function CreateStudentClient({
  initialClasses,
  initialSections,
  initialSessions,
  schoolId
}: CreateStudentClientProps) {
  const router = useRouter();
  const { showError, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const {
    formData,
    currentStep,
    parentGuardianTab,
    fatherInfo,
    motherInfo,
    guardianInfo,
    fatherSearchQuery,
    selectedFatherParent,
    motherSearchQuery,
    selectedMotherParent,
    parentAccountOption,
    parentAccountData,
    parentSearchQuery,
    selectedParent,
    standardFee,
    setCurrentStep,
    setErrors,
    setFatherSearchResults,
    setSearchingFather,
    setMotherSearchResults,
    setSearchingMother,
    setParentSearchResults,
    setSearchingParents,
    setInitialData,
    reset,
  } = useStudentFormStore();

  useEffect(() => {
    setInitialData(initialClasses, initialSections, initialSessions);
    return () => reset();
  }, [initialClasses, initialSections, initialSessions, setInitialData, reset]);

  // Parent search effects
  const handleFatherSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setFatherSearchResults([]); return; }
    setSearchingFather(true);
    try {
      const result = await searchParents(query);
      if (result.success && result.parents) {
        setFatherSearchResults(result.parents.filter(p => (p.parentType || '').toUpperCase() === 'FATHER'));
      }
    } catch { /* ignore */ } finally { setSearchingFather(false); }
  }, [setFatherSearchResults, setSearchingFather]);

  const handleMotherSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setMotherSearchResults([]); return; }
    setSearchingMother(true);
    try {
      const result = await searchParents(query);
      if (result.success && result.parents) {
        setMotherSearchResults(result.parents.filter(p => (p.parentType || '').toUpperCase() === 'MOTHER'));
      }
    } catch { /* ignore */ } finally { setSearchingMother(false); }
  }, [setMotherSearchResults, setSearchingMother]);

  const handleParentSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setParentSearchResults([]); return; }
    setSearchingParents(true);
    try {
      const result = await searchParents(query);
      if (result.success && result.parents) {
        setParentSearchResults(result.parents);
      }
    } catch { /* ignore */ } finally { setSearchingParents(false); }
  }, [setParentSearchResults, setSearchingParents]);

  useEffect(() => {
    const t = setTimeout(() => { if (fatherSearchQuery) handleFatherSearch(fatherSearchQuery); }, 300);
    return () => clearTimeout(t);
  }, [fatherSearchQuery, handleFatherSearch]);

  useEffect(() => {
    const t = setTimeout(() => { if (motherSearchQuery) handleMotherSearch(motherSearchQuery); }, 300);
    return () => clearTimeout(t);
  }, [motherSearchQuery, handleMotherSearch]);

  useEffect(() => {
    const t = setTimeout(() => { if (parentSearchQuery) handleParentSearch(parentSearchQuery); }, 300);
    return () => clearTimeout(t);
  }, [parentSearchQuery, handleParentSearch]);

  // --- Validation ---
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.academicSession) newErrors.academicSession = 'Please select an academic session';
    if (!formData.classApplyingFor) newErrors.classApplyingFor = 'Please select a class';
    if (!formData.sectionId) newErrors.sectionId = 'Please select a section';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.bFormCrc && !validateBForm(formData.bFormCrc)) {
      newErrors.bFormCrc = 'Invalid B-Form/CRC format. Use format: #####-#######-#';
    }
    if (formData.religion === 'Other' && !formData.religionOther.trim()) {
      newErrors.religionOther = 'Please specify religion';
    }
    if (formData.discountedFee && formData.discountedFee.trim()) {
      const discountedFee = Number(formData.discountedFee);
      if (isNaN(discountedFee) || discountedFee < 0) newErrors.discountedFee = 'Must be a positive number';
      if (standardFee > 0 && discountedFee > standardFee) newErrors.discountedFee = 'Cannot be greater than standard fee';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (parentGuardianTab === 'parents') {
      if (!selectedFatherParent) {
        if (fatherInfo.cnic && !validateCNIC(fatherInfo.cnic)) {
          newErrors.fatherCnic = 'Invalid CNIC format. Use format: #####-#######-#';
        }
        if (fatherInfo.mobile && !validateMobileNumber(fatherInfo.mobile)) {
          newErrors.fatherMobile = 'Invalid mobile format';
        }
      }
      if (!selectedMotherParent) {
        if (motherInfo.cnic && !validateCNIC(motherInfo.cnic)) {
          newErrors.motherCnic = 'Invalid CNIC format';
        }
        if (motherInfo.mobile && !validateMobileNumber(motherInfo.mobile)) {
          newErrors.motherMobile = 'Invalid mobile format';
        }
      }
    } else {
      if (guardianInfo.cnic && !validateCNIC(guardianInfo.cnic)) {
        newErrors.guardianCnic = 'Invalid CNIC format. Use format: #####-#######-#';
      }
      if (guardianInfo.mobile && !validateMobileNumber(guardianInfo.mobile)) {
        newErrors.guardianMobile = 'Invalid mobile format';
      }
    }
    if (parentAccountOption === 'create') {
      if (!parentAccountData.emailOrUsername.trim()) {
        newErrors.parentEmailOrUsername = 'Email or username is required for account creation';
      } else if (parentAccountData.emailOrUsername.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentAccountData.emailOrUsername)) {
        newErrors.parentEmailOrUsername = 'Invalid email format';
      } else if (!parentAccountData.emailOrUsername.includes('@') && parentAccountData.emailOrUsername.length < 3) {
        newErrors.parentEmailOrUsername = 'Username must be at least 3 characters';
      }
      if (!parentAccountData.password) {
        newErrors.parentPassword = 'Password is required';
      } else if (parentAccountData.password.length < 6) {
        newErrors.parentPassword = 'Password must be at least 6 characters';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;

    if (!schoolId) return;
    setLoading(true);

    try {
      const studentData: Record<string, any> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        academicSession: formData.academicSession,
        classApplyingFor: formData.classApplyingFor,
        sectionId: formData.sectionId || undefined,
        schoolId,
        gender: formData.gender ? formData.gender.toUpperCase() : undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        placeOfBirth: formData.placeOfBirth || undefined,
        religion: formData.religion ? formData.religion.toUpperCase() : undefined,
        religionOther: formData.religionOther || undefined,
        nationality: formData.nationality || undefined,
        bFormCrc: formData.bFormCrc || undefined,
        studentPhoto: formData.studentPhoto || undefined,
        specialNeeds: formData.specialNeeds || undefined,
        specialNeedsDetails: formData.specialNeedsDetails || undefined,
        admissionDate: formData.admissionDate || undefined,
        previousSchoolName: formData.previousSchoolName || undefined,
        previousSchoolAddress: formData.previousSchoolAddress || undefined,
        reasonForLeaving: formData.reasonForLeaving || undefined,
        primaryContact: (parentGuardianTab === 'guardian' ? 'GUARDIAN' : formData.primaryContact).toUpperCase(),
        addressLine1: formData.addressLine1 || undefined,
        addressLine2: formData.addressLine2 || undefined,
        city: formData.city || undefined,
        province: formData.province ? formData.province.toUpperCase() : undefined,
        postalCode: formData.postalCode || undefined,
        admissionFee: formData.admissionFee ? Number(formData.admissionFee) : undefined,
        discountedFee: formData.discountedFee ? Number(formData.discountedFee) : undefined,
        discountType: formData.discountType ? formData.discountType.toUpperCase() : undefined,
        email: formData.email || undefined,
      };

      Object.keys(studentData).forEach(key => {
        if (studentData[key] === undefined) delete studentData[key];
      });

      const result = await createStudent(studentData);

      if (result.success && result.student) {
        const studentId = result.student.id;
        const parentCreationResults: string[] = [];

        // Only process parents if we're on step 3 and user filled in data
        if (currentStep === 3) {
          if (parentGuardianTab === 'parents') {
            if (selectedFatherParent) {
              const cr = await connectParentToStudent(selectedFatherParent.id, studentId);
              if (cr.success) parentCreationResults.push('Father (connected)');
            } else if (fatherInfo.name.trim()) {
              const isEmailFather = parentAccountOption === 'create' && parentAccountData.parentType === 'FATHER'
                && parentAccountData.emailOrUsername.includes('@');
              const fatherData = {
                email: parentAccountOption === 'create' && parentAccountData.parentType === 'FATHER' && isEmailFather
                  ? parentAccountData.emailOrUsername : fatherInfo.email || undefined,
                username: parentAccountOption === 'create' && parentAccountData.parentType === 'FATHER' && !isEmailFather
                  ? parentAccountData.emailOrUsername : undefined,
                password: parentAccountOption === 'create' && parentAccountData.parentType === 'FATHER'
                  ? parentAccountData.password : undefined,
                name: fatherInfo.name,
                phone: fatherInfo.mobile || undefined,
                cnic: fatherInfo.cnic || undefined,
                parentType: 'FATHER' as const,
                occupation: fatherInfo.occupation || undefined,
                monthlyIncome: fatherInfo.monthlyIncome ? Number(fatherInfo.monthlyIncome) : undefined,
                studentIds: [studentId],
              };
              const fr = await createParent(fatherData);
              if (fr.success) parentCreationResults.push('Father');
            }

            if (selectedMotherParent) {
              const cr = await connectParentToStudent(selectedMotherParent.id, studentId);
              if (cr.success) parentCreationResults.push('Mother (connected)');
            } else if (motherInfo.name.trim()) {
              const isEmailMother = parentAccountOption === 'create' && parentAccountData.parentType === 'MOTHER'
                && parentAccountData.emailOrUsername.includes('@');
              const motherData = {
                email: parentAccountOption === 'create' && parentAccountData.parentType === 'MOTHER' && isEmailMother
                  ? parentAccountData.emailOrUsername : undefined,
                username: parentAccountOption === 'create' && parentAccountData.parentType === 'MOTHER' && !isEmailMother
                  ? parentAccountData.emailOrUsername : undefined,
                password: parentAccountOption === 'create' && parentAccountData.parentType === 'MOTHER'
                  ? parentAccountData.password : undefined,
                name: motherInfo.name,
                phone: motherInfo.mobile || undefined,
                cnic: motherInfo.cnic || undefined,
                parentType: 'MOTHER' as const,
                studentIds: [studentId],
              };
              const mr = await createParent(motherData);
              if (mr.success) parentCreationResults.push('Mother');
            }
          } else if (guardianInfo.name.trim()) {
            const isEmailGuardian = parentAccountOption === 'create' && parentAccountData.emailOrUsername.includes('@');
            const guardianData = {
              email: parentAccountOption === 'create' && isEmailGuardian ? parentAccountData.emailOrUsername : undefined,
              username: parentAccountOption === 'create' && !isEmailGuardian ? parentAccountData.emailOrUsername : undefined,
              password: parentAccountOption === 'create' ? parentAccountData.password : undefined,
              name: guardianInfo.name,
              phone: guardianInfo.mobile || undefined,
              cnic: guardianInfo.cnic || undefined,
              parentType: 'GUARDIAN' as const,
              guardianRelation: guardianInfo.relation || undefined,
              studentIds: [studentId],
            };
            const gr = await createParent(guardianData);
            if (gr.success) parentCreationResults.push('Guardian');
          }

          if (parentAccountOption === 'connect' && selectedParent) {
            const alreadyConnected =
              (selectedFatherParent && selectedFatherParent.id === selectedParent.id) ||
              (selectedMotherParent && selectedMotherParent.id === selectedParent.id);
            if (!alreadyConnected) {
              const cr = await connectParentToStudent(selectedParent.id, studentId);
              if (cr.success) parentCreationResults.push(`${selectedParent.parentType} (connected via account)`);
            }
          }
        }

        const msg = parentCreationResults.length > 0
          ? `Student enrolled successfully. ${parentCreationResults.join(', ')}`
          : 'Student enrolled successfully';
        toast.success(msg);
        router.push(ROUTES.ADMIN.STUDENTS);
      } else {
        showError(result.error || 'Failed to create student');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      showError('Failed to create student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enroll New Student</h1>
          <p className="text-gray-600 mt-1">Fill in the required details to register a student</p>
        </div>
        {currentStep === 1 && (
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        )}
      </div>

      {/* Step Indicator */}
      <nav className="flex items-center justify-center">
        <ol className="flex items-center w-full max-w-xl">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;
            return (
              <li key={step.id} className={`flex items-center ${idx < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep) {
                      setErrors({});
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'bg-[#10b981] text-white shadow-sm'
                      : isCompleted
                        ? 'text-[#10b981] hover:bg-[#10b981]/10 cursor-pointer'
                        : 'text-gray-400 cursor-default'
                  }`}
                >
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? 'bg-white/20'
                      : isCompleted
                        ? 'bg-[#10b981]/10'
                        : 'bg-gray-100'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </span>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${isCompleted ? 'bg-[#10b981]' : 'bg-gray-200'}`} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <div>
        {currentStep === 1 && <StepBasicInfo />}
        {currentStep === 2 && <StepAdditionalDetails />}
        {currentStep === 3 && (
          <div className="space-y-6">
            <SectionEParentGuardian />
            <SectionFParentAccount />
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}
          {currentStep === 1 && (
            <Button type="button" variant="outline" onClick={() => router.push(ROUTES.ADMIN.STUDENTS)} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 3 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              variant="outline"
              className="border-[#10b981] text-[#10b981] hover:bg-[#10b981]/5"
            >
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          )}
          {currentStep < 3 && (
            <Button type="button" onClick={handleNext} disabled={loading}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {currentStep === 3 && (
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          )}
        </div>
      </div>

      <AlertComponent />

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        classes={initialClasses}
        sections={initialSections}
        sessions={initialSessions}
        onSuccess={() => router.push(ROUTES.ADMIN.STUDENTS)}
      />
    </div>
  );
}
