'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentFormStore } from '@/stores/use-student-form-store';
import FatherInformation from './section-e-parent-guardian/father-information';
import MotherInformation from './section-e-parent-guardian/mother-information';
import GuardianInformation from './section-e-parent-guardian/guardian-information';
import PrimaryContactSelector from './section-e-parent-guardian/primary-contact-selector';

export default function SectionEParentGuardian() {
  const {
    parentGuardianTab,
    setParentGuardianTab,
  } = useStudentFormStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parent / Guardian Information</CardTitle>
        <CardDescription>Connect a parent or guardian to this student (optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Selection */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setParentGuardianTab('parents')}
            className={`px-6 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${parentGuardianTab === 'parents'
              ? 'border-slate-700 text-slate-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Parents (Father & Mother)
          </button>
          <button
            type="button"
            onClick={() => setParentGuardianTab('guardian')}
            className={`px-6 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${parentGuardianTab === 'guardian'
              ? 'border-slate-700 text-slate-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Guardian
          </button>
        </div>

        {/* Parents Tab Content */}
        {parentGuardianTab === 'parents' && (
          <div className="space-y-6">
            <FatherInformation />
            <MotherInformation />
            <PrimaryContactSelector />
          </div>
        )}

        {/* Guardian Tab Content */}
        {parentGuardianTab === 'guardian' && (
          <GuardianInformation />
        )}
      </CardContent>
    </Card>
  );
}
