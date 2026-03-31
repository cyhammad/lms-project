'use client';

import type { PrimaryContact } from '@/types';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function PrimaryContactSelector() {
  const {
    formData,
    setFormField,
  } = useStudentFormStore();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact *</label>
      <select
        value={formData.primaryContact}
        onChange={(e) => setFormField('primaryContact', e.target.value as PrimaryContact)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
      >
        <option value="FATHER">Father</option>
        <option value="MOTHER">Mother</option>
      </select>
    </div>
  );
}

