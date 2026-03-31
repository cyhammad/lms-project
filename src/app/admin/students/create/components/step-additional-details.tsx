'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBForm } from '@/lib/validation';
import type { Gender, Religion, Province } from '@/types';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function StepAdditionalDetails() {
  const {
    formData,
    errors,
    selectedClass,
    standardFee,
    setFormField,
    clearError,
  } = useStudentFormStore();

  const handleBFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBForm(e.target.value);
    setFormField('bFormCrc', formatted);
    if (errors.bFormCrc) clearError('bFormCrc');
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${hasError ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'}`;

  const defaultInputClass =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm';

  return (
    <div className="space-y-6">
      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>Additional personal information (all fields are optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormField('gender', e.target.value as Gender)}
                className={defaultInputClass}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormField('dateOfBirth', e.target.value)}
                className={defaultInputClass}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
              <input
                type="text"
                value={formData.placeOfBirth}
                onChange={(e) => setFormField('placeOfBirth', e.target.value)}
                className={defaultInputClass}
                placeholder="City, Province"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormField('nationality', e.target.value)}
                className={defaultInputClass}
                placeholder="Pakistani"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
              <select
                value={formData.religion}
                onChange={(e) => {
                  const value = e.target.value as Religion | '';
                  setFormField('religion', value);
                  if (value !== 'Other') setFormField('religionOther', '');
                }}
                className={defaultInputClass}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Specify Religion</label>
                <input
                  type="text"
                  value={formData.religionOther}
                  onChange={(e) => setFormField('religionOther', e.target.value)}
                  className={inputClass(!!errors.religionOther)}
                  placeholder="Enter religion"
                />
                {errors.religionOther && <p className="text-sm text-red-500 mt-1">{errors.religionOther}</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">B-Form/CRC Number</label>
            <input
              type="text"
              value={formData.bFormCrc}
              onChange={handleBFormChange}
              maxLength={15}
              className={inputClass(!!errors.bFormCrc)}
              placeholder="#####-#######-#"
            />
            {errors.bFormCrc && <p className="text-sm text-red-500 mt-1">{errors.bFormCrc}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="specialNeeds"
                checked={formData.specialNeeds}
                onChange={(e) => {
                  setFormField('specialNeeds', e.target.checked);
                  if (!e.target.checked) setFormField('specialNeedsDetails', '');
                }}
                className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981]"
              />
              <label htmlFor="specialNeeds" className="text-sm font-medium text-gray-700">Has Special Needs</label>
            </div>
            {formData.specialNeeds && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs Details</label>
                <textarea
                  value={formData.specialNeedsDetails}
                  onChange={(e) => setFormField('specialNeedsDetails', e.target.value)}
                  className={defaultInputClass}
                  rows={2}
                  placeholder="Describe special needs requirements"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>Residential address (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormField('addressLine1', e.target.value)}
                className={defaultInputClass}
                placeholder="House/Flat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormField('addressLine2', e.target.value)}
                className={defaultInputClass}
                placeholder="Street/Area"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormField('city', e.target.value)}
                className={defaultInputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <select
                value={formData.province}
                onChange={(e) => setFormField('province', e.target.value as Province)}
                className={defaultInputClass}
              >
                <option value="">Select</option>
                <option value="PUNJAB">Punjab</option>
                <option value="SINDH">Sindh</option>
                <option value="KP">KP</option>
                <option value="BALOCHISTAN">Balochistan</option>
                <option value="GB">GB</option>
                <option value="ICT">ICT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormField('postalCode', e.target.value)}
                className={defaultInputClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee & Discount */}
      <Card>
        <CardHeader>
          <CardTitle>Fee & Discount</CardTitle>
          <CardDescription>Fee structure and discount information (optional)</CardDescription>
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
                className={defaultInputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Fee (Monthly)</label>
              <input
                type="text"
                value={selectedClass ? `PKR ${standardFee.toLocaleString()}` : 'Select Class first'}
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
                className={defaultInputClass}
              >
                <option value="NONE">None</option>
                <option value="SIBLING">Sibling</option>
                <option value="STAFF">Staff</option>
                <option value="MERIT">Merit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Fee</label>
              <input
                type="number"
                min="0"
                value={formData.discountType === 'NONE' ? standardFee.toString() : formData.discountedFee}
                onChange={(e) => setFormField('discountedFee', e.target.value)}
                disabled={formData.discountType === 'NONE' || !selectedClass}
                className={`${inputClass(!!errors.discountedFee)} ${formData.discountType === 'NONE' || !selectedClass ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.discountedFee && <p className="text-sm text-red-500 mt-1">{errors.discountedFee}</p>}
            </div>
          </div>

          {/* Previous School */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Previous School (if any)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={formData.previousSchoolName}
                  onChange={(e) => setFormField('previousSchoolName', e.target.value)}
                  className={defaultInputClass}
                  placeholder="Name of previous school"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
                <input
                  type="text"
                  value={formData.reasonForLeaving}
                  onChange={(e) => setFormField('reasonForLeaving', e.target.value)}
                  className={defaultInputClass}
                  placeholder="Reason for leaving"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
