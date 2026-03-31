'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function SectionDFeeDiscount() {
  const {
    formData,
    errors,
    selectedClass,
    standardFee,
    setFormField,
  } = useStudentFormStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section D: Fee & Discount</CardTitle>
        <CardDescription>Fee structure and discount information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Fee (PKR)</label>
            <input
              type="number"
              min="0"
              value={formData.admissionFee}
              onChange={(e) => setFormField('admissionFee', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standard Fee (Monthly)</label>
            <input
              type="text"
              value={selectedClass ? `PKR ${standardFee.toLocaleString()}` : 'Select Class'}
              disabled
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 cursor-not-allowed text-sm"
              readOnly
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
            <select
              value={formData.discountType}
              onChange={(e) => setFormField('discountType', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
            >
              <option value="NONE">None</option>
              <option value="SIBLING">Sibling</option>
              <option value="STAFF">Staff</option>
              <option value="MERIT">Merit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discounted Fee {formData.discountType !== 'NONE' ? '*' : ''}
            </label>
            <input
              type="number"
              min="0"
              value={formData.discountType === 'NONE' ? standardFee.toString() : formData.discountedFee}
              onChange={(e) => setFormField('discountedFee', e.target.value)}
              disabled={formData.discountType === 'NONE' || !selectedClass}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.discountedFee ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'} ${formData.discountType === 'NONE' || !selectedClass ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.discountedFee && <p className="text-sm text-red-500 mt-1">{errors.discountedFee}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
