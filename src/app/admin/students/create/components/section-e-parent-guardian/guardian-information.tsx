'use client';

import { formatCNIC, formatMobileNumber } from '@/lib/validation';
import type { GuardianRelation } from '@/types';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function GuardianInformation() {
  const {
    guardianInfo,
    errors,
    setGuardianField,
  } = useStudentFormStore();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Guardian Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
          <input
            type="text"
            value={guardianInfo.name}
            onChange={(e) => setGuardianField('name', e.target.value)}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${
              errors.guardianName ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
            }`}
            placeholder="Enter guardian's name"
          />
          {errors.guardianName && <p className="text-sm text-red-500 mt-1">{errors.guardianName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
          <select
            value={guardianInfo.relation}
            onChange={(e) => setGuardianField('relation', e.target.value as GuardianRelation)}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${
              errors.guardianRelation ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
            }`}
          >
            <option value="">Select Relation</option>
            <option value="GRANDFATHER">Grandfather</option>
            <option value="GRANDMOTHER">Grandmother</option>
            <option value="UNCLE">Uncle</option>
            <option value="AUNT">Aunt</option>
            <option value="BROTHER">Brother</option>
            <option value="SISTER">Sister</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.guardianRelation && <p className="text-sm text-red-500 mt-1">{errors.guardianRelation}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guardian CNIC</label>
          <input
            type="text"
            value={guardianInfo.cnic}
            onChange={(e) => setGuardianField('cnic', formatCNIC(e.target.value))}
            maxLength={15}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${
              errors.guardianCnic ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
            }`}
            placeholder="#####-#######-#"
          />
          {errors.guardianCnic && <p className="text-sm text-red-500 mt-1">{errors.guardianCnic}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Mobile</label>
          <input
            type="text"
            value={guardianInfo.mobile}
            onChange={(e) => setGuardianField('mobile', formatMobileNumber(e.target.value))}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${
              errors.guardianMobile ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
            }`}
            placeholder="+92xxxxxxxxxxx"
          />
          {errors.guardianMobile && <p className="text-sm text-red-500 mt-1">{errors.guardianMobile}</p>}
        </div>
      </div>
    </div>
  );
}

