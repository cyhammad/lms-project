'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Province } from '@/types';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function SectionCAddress() {
  const {
    formData,
    errors,
    setFormField,
  } = useStudentFormStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section C: Address Information</CardTitle>
        <CardDescription>Residential address of the student</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <input
            type="text"
            required
            value={formData.addressLine1}
            onChange={(e) => setFormField('addressLine1', e.target.value)}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.addressLine1 ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            placeholder="House/Flat"
          />
          {errors.addressLine1 && <p className="text-sm text-red-500 mt-1">{errors.addressLine1}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 *</label>
          <input
            type="text"
            required
            value={formData.addressLine2}
            onChange={(e) => setFormField('addressLine2', e.target.value)}
            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.addressLine2 ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            placeholder="Street/Area"
          />
          {errors.addressLine2 && <p className="text-sm text-red-500 mt-1">{errors.addressLine2}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormField('city', e.target.value)}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.city ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            />
            {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
            <select
              required
              value={formData.province}
              onChange={(e) => setFormField('province', e.target.value as Province)}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.province ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`}
            >
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => setFormField('postalCode', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
