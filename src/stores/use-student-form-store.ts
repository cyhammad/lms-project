'use client';

import { create } from 'zustand';
import type { Gender, Religion, PrimaryContact, GuardianRelation, Province, DiscountType, Class, Section, AcademicSession, Parent } from '@/types';

interface StudentFormData {
  // Section A: Student Information
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender;
  dateOfBirth: string;
  placeOfBirth: string;
  religion: Religion | '';
  religionOther: string;
  nationality: string;
  bFormCrc: string;
  studentPhoto: string;
  specialNeeds: boolean;
  specialNeedsDetails: string;

  // Section B: Admission Details
  admissionDate: string;
  academicSession: string;
  classApplyingFor: string;
  sectionId: string;
  previousSchoolName: string;
  previousSchoolAddress: string;
  reasonForLeaving: string;

  // Primary Contact preference
  primaryContact: PrimaryContact;

  // Section C: Address Information
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: Province | '';
  postalCode: string;

  // Section D: Fee & Discount
  admissionFee: string;
  discountType: DiscountType;
  discountedFee: string;

  isActive: boolean;
}

interface FatherInfo {
  name: string;
  cnic: string;
  mobile: string;
  email: string;
  occupation: string;
  monthlyIncome: string;
}

interface MotherInfo {
  name: string;
  cnic: string;
  mobile: string;
}

interface GuardianInfo {
  name: string;
  cnic: string;
  mobile: string;
  relation: GuardianRelation | '';
}

interface ParentAccountData {
  parentType: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  emailOrUsername: string;
  password: string;
}

interface StudentFormStore {
  // Wizard step (1-based)
  currentStep: number;

  // Form data
  formData: StudentFormData;
  
  // Errors
  errors: Record<string, string>;
  
  // Section E: Parent/Guardian Information
  parentGuardianTab: 'parents' | 'guardian';
  fatherInfo: FatherInfo;
  motherInfo: MotherInfo;
  guardianInfo: GuardianInfo;
  
  // Parent search state for Section E
  fatherSearchQuery: string;
  fatherSearchResults: Parent[];
  selectedFatherParent: Parent | null;
  searchingFather: boolean;
  
  motherSearchQuery: string;
  motherSearchResults: Parent[];
  selectedMotherParent: Parent | null;
  searchingMother: boolean;
  
  // Section F: Parent Account State
  parentAccountOption: 'none' | 'create' | 'connect';
  parentAccountData: ParentAccountData;
  parentSearchQuery: string;
  parentSearchResults: Parent[];
  selectedParent: Parent | null;
  searchingParents: boolean;
  
  // Initial data (from props)
  initialClasses: Class[];
  initialSections: Section[];
  initialSessions: AcademicSession[];
  
  // Computed values
  classSections: Section[];
  selectedClass: Class | null;
  standardFee: number;
  
  // Actions
  setCurrentStep: (step: number) => void;
  setFormData: (data: Partial<StudentFormData>) => void;
  setFormField: (field: keyof StudentFormData, value: any) => void;
  setErrors: (errors: Record<string, string>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  
  setParentGuardianTab: (tab: 'parents' | 'guardian') => void;
  setFatherInfo: (info: Partial<FatherInfo>) => void;
  setFatherField: (field: keyof FatherInfo, value: any) => void;
  setMotherInfo: (info: Partial<MotherInfo>) => void;
  setMotherField: (field: keyof MotherInfo, value: any) => void;
  setGuardianInfo: (info: Partial<GuardianInfo>) => void;
  setGuardianField: (field: keyof GuardianInfo, value: any) => void;
  
  setFatherSearchQuery: (query: string) => void;
  setFatherSearchResults: (results: Parent[]) => void;
  setSelectedFatherParent: (parent: Parent | null) => void;
  setSearchingFather: (searching: boolean) => void;
  
  setMotherSearchQuery: (query: string) => void;
  setMotherSearchResults: (results: Parent[]) => void;
  setSelectedMotherParent: (parent: Parent | null) => void;
  setSearchingMother: (searching: boolean) => void;
  
  setParentAccountOption: (option: 'none' | 'create' | 'connect') => void;
  setParentAccountData: (data: Partial<ParentAccountData>) => void;
  setParentAccountField: (field: keyof ParentAccountData, value: any) => void;
  setParentSearchQuery: (query: string) => void;
  setParentSearchResults: (results: Parent[]) => void;
  setSelectedParent: (parent: Parent | null) => void;
  setSearchingParents: (searching: boolean) => void;
  
  setInitialData: (classes: Class[], sections: Section[], sessions: AcademicSession[]) => void;
  
  reset: () => void;
}

const initialFormData: StudentFormData = {
  firstName: '',
  lastName: '',
  email: '',
  gender: 'Male',
  dateOfBirth: '',
  placeOfBirth: '',
  religion: '' as Religion | '',
  religionOther: '',
  nationality: 'Pakistani',
  bFormCrc: '',
  studentPhoto: '',
  specialNeeds: false,
  specialNeedsDetails: '',
  admissionDate: new Date().toISOString().split('T')[0],
  academicSession: '',
  classApplyingFor: '',
  sectionId: '',
  previousSchoolName: '',
  previousSchoolAddress: '',
  reasonForLeaving: '',
  primaryContact: 'FATHER',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '' as Province | '',
  postalCode: '',
  admissionFee: '',
  discountType: 'NONE',
  discountedFee: '',
  isActive: true,
};

const initialFatherInfo: FatherInfo = {
  name: '',
  cnic: '',
  mobile: '',
  email: '',
  occupation: '',
  monthlyIncome: '',
};

const initialMotherInfo: MotherInfo = {
  name: '',
  cnic: '',
  mobile: '',
};

const initialGuardianInfo: GuardianInfo = {
  name: '',
  cnic: '',
  mobile: '',
  relation: '' as GuardianRelation | '',
};

const initialParentAccountData: ParentAccountData = {
  parentType: 'FATHER',
  emailOrUsername: '',
  password: '',
};

export const useStudentFormStore = create<StudentFormStore>((set, get) => ({
  // Initial state
  currentStep: 1,
  formData: initialFormData,
  errors: {},
  parentGuardianTab: 'parents',
  fatherInfo: initialFatherInfo,
  motherInfo: initialMotherInfo,
  guardianInfo: initialGuardianInfo,
  fatherSearchQuery: '',
  fatherSearchResults: [],
  selectedFatherParent: null,
  searchingFather: false,
  motherSearchQuery: '',
  motherSearchResults: [],
  selectedMotherParent: null,
  searchingMother: false,
  parentAccountOption: 'none',
  parentAccountData: initialParentAccountData,
  parentSearchQuery: '',
  parentSearchResults: [],
  selectedParent: null,
  searchingParents: false,
  initialClasses: [],
  initialSections: [],
  initialSessions: [],
  classSections: [],
  selectedClass: null,
  standardFee: 0,
  
  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  setFormField: (field, value) => set((state) => {
    const newFormData = { ...state.formData, [field]: value };
    
    // Update computed values if classApplyingFor changed
    let classSections = state.classSections;
    let selectedClass = state.selectedClass;
    let standardFee = state.standardFee;
    
    if (field === 'classApplyingFor') {
      const classId = value as string;
      classSections = classId
        ? state.initialSections.filter(s => s.classId === classId && s.isActive)
        : [];
      selectedClass = classId
        ? state.initialClasses.find(c => c.id === classId) || null
        : null;
      standardFee = selectedClass?.standardFee || 0;
    }
    
    return { 
      formData: newFormData,
      classSections,
      selectedClass,
      standardFee,
    };
  }),
  setErrors: (errors) => set({ errors }),
  setError: (field, error) => set((state) => ({ 
    errors: { ...state.errors, [field]: error } 
  })),
  clearError: (field) => set((state) => {
    const newErrors = { ...state.errors };
    delete newErrors[field];
    return { errors: newErrors };
  }),
  
  setParentGuardianTab: (tab) => set({ parentGuardianTab: tab }),
  
  setFatherInfo: (info) => set((state) => ({ fatherInfo: { ...state.fatherInfo, ...info } })),
  setFatherField: (field, value) => set((state) => ({ 
    fatherInfo: { ...state.fatherInfo, [field]: value } 
  })),
  
  setMotherInfo: (info) => set((state) => ({ motherInfo: { ...state.motherInfo, ...info } })),
  setMotherField: (field, value) => set((state) => ({ 
    motherInfo: { ...state.motherInfo, [field]: value } 
  })),
  
  setGuardianInfo: (info) => set((state) => ({ guardianInfo: { ...state.guardianInfo, ...info } })),
  setGuardianField: (field, value) => set((state) => ({ 
    guardianInfo: { ...state.guardianInfo, [field]: value } 
  })),
  
  setFatherSearchQuery: (query) => set({ fatherSearchQuery: query }),
  setFatherSearchResults: (results) => set({ fatherSearchResults: results }),
  setSelectedFatherParent: (parent) => set({ selectedFatherParent: parent }),
  setSearchingFather: (searching) => set({ searchingFather: searching }),
  
  setMotherSearchQuery: (query) => set({ motherSearchQuery: query }),
  setMotherSearchResults: (results) => set({ motherSearchResults: results }),
  setSelectedMotherParent: (parent) => set({ selectedMotherParent: parent }),
  setSearchingMother: (searching) => set({ searchingMother: searching }),
  
  setParentAccountOption: (option) => set({ parentAccountOption: option }),
  setParentAccountData: (data) => set((state) => ({ 
    parentAccountData: { ...state.parentAccountData, ...data } 
  })),
  setParentAccountField: (field, value) => set((state) => ({ 
    parentAccountData: { ...state.parentAccountData, [field]: value } 
  })),
  setParentSearchQuery: (query) => set({ parentSearchQuery: query }),
  setParentSearchResults: (results) => set({ parentSearchResults: results }),
  setSelectedParent: (parent) => set({ selectedParent: parent }),
  setSearchingParents: (searching) => set({ searchingParents: searching }),
  
  setInitialData: (classes, sections, sessions) => {
    const state = get();
    const classSections = state.formData.classApplyingFor
      ? sections.filter(s => s.classId === state.formData.classApplyingFor && s.isActive)
      : [];
    const selectedClass = state.formData.classApplyingFor
      ? classes.find(c => c.id === state.formData.classApplyingFor) || null
      : null;
    const standardFee = selectedClass?.standardFee || 0;
    set({ 
      initialClasses: classes, 
      initialSections: sections, 
      initialSessions: sessions,
      classSections,
      selectedClass,
      standardFee,
    });
  },
  
  reset: () => set({
    currentStep: 1,
    formData: initialFormData,
    errors: {},
    parentGuardianTab: 'parents',
    fatherInfo: initialFatherInfo,
    motherInfo: initialMotherInfo,
    guardianInfo: initialGuardianInfo,
    fatherSearchQuery: '',
    fatherSearchResults: [],
    selectedFatherParent: null,
    searchingFather: false,
    motherSearchQuery: '',
    motherSearchResults: [],
    selectedMotherParent: null,
    searchingMother: false,
    parentAccountOption: 'none',
    parentAccountData: initialParentAccountData,
    parentSearchQuery: '',
    parentSearchResults: [],
    selectedParent: null,
    searchingParents: false,
    classSections: [],
    selectedClass: null,
    standardFee: 0,
  }),
}));


