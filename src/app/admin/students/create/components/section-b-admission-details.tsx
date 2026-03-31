'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function SectionBAdmissionDetails() {
  const {
    formData,
    errors,
    initialSessions,
    initialClasses,
    classSections,
    setFormField,
  } = useStudentFormStore();
  
  const handleClassChange = (classId: string) => {
    setFormField('classApplyingFor', classId);
    setFormField('sectionId', '');
    if (formData.discountType !== 'NONE') {
      setFormField('discountedFee', '');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section B: Admission Details</CardTitle>
        <CardDescription>Admission and academic information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
            <input
              type="date"
              required
              value={formData.admissionDate}
              onChange={(e) => setFormField('admissionDate', e.target.value)}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.admissionDate ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.admissionDate && <p className="text-sm text-red-500 mt-1">{errors.admissionDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session *</label>
            <select
              required
              value={formData.academicSession}
              onChange={(e) => setFormField('academicSession', e.target.value)}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.academicSession ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            >
              <option value="">Select academic session</option>
              {initialSessions.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.academicSession && <p className="text-sm text-red-500 mt-1">{errors.academicSession}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Applying For *</label>
            <select
              required
              value={formData.classApplyingFor}
              onChange={(e) => handleClassChange(e.target.value)}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.classApplyingFor ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            >
              <option value="">Select a class</option>
              {initialClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.grade}
                </option>
              ))}
            </select>
            {errors.classApplyingFor && <p className="text-sm text-red-500 mt-1">{errors.classApplyingFor}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
            <select
              required
              value={formData.sectionId}
              onChange={(e) => setFormField('sectionId', e.target.value)}
              disabled={!formData.classApplyingFor}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.sectionId ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            >
              <option value="">Select a section</option>
              {classSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.sectionId && <p className="text-sm text-red-500 mt-1">{errors.sectionId}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Previous School Name</label>
          <input
            type="text"
            value={formData.previousSchoolName}
            onChange={(e) => setFormField('previousSchoolName', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
            placeholder="Name of previous school"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Previous School Address</label>
          <textarea
            value={formData.previousSchoolAddress}
            onChange={(e) => setFormField('previousSchoolAddress', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
            rows={2}
            placeholder="Address of previous school"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
          <textarea
            value={formData.reasonForLeaving}
            onChange={(e) => setFormField('reasonForLeaving', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
            rows={3}
            placeholder="Reason for leaving"
          />
        </div>
      </CardContent>
    </Card>
  );
}
