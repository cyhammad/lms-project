'use client';

import { formatCNIC, formatMobileNumber } from '@/lib/validation';
import { Search, Check } from 'lucide-react';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function MotherInformation() {
  const {
    motherInfo,
    errors,
    selectedMotherParent,
    motherSearchQuery,
    motherSearchResults,
    searchingMother,
    setMotherField,
    setMotherSearchQuery,
    setSelectedMotherParent,
    setMotherSearchResults,
    clearError,
  } = useStudentFormStore();

  const handleMotherParentSelect = (parent: typeof selectedMotherParent) => {
    if (!parent) return;
    setSelectedMotherParent(parent);
    setMotherField('name', parent.name);
    setMotherField('cnic', parent.cnic || '');
    setMotherField('mobile', parent.phone || '');
    setMotherSearchQuery('');
    setMotherSearchResults([]);
  };

  const handleClearMotherSelection = () => {
    setSelectedMotherParent(null);
    setMotherField('name', '');
    setMotherField('cnic', '');
    setMotherField('mobile', '');
    setMotherSearchQuery('');
    setMotherSearchResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex-1">
          Mother Information
        </h3>
        {selectedMotherParent && (
          <button
            type="button"
            onClick={handleClearMotherSelection}
            className="text-sm text-slate-800 hover:text-slate-800 ml-4"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Search Existing Mother */}
      {!selectedMotherParent && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Search Existing Mother</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={motherSearchQuery}
              onChange={(e) => setMotherSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all text-gray-900 text-sm"
              placeholder="Search by name, email, phone, or CNIC..."
            />
          </div>
          {searchingMother && <p className="text-sm text-gray-500">Searching...</p>}
          {motherSearchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
              {motherSearchResults.map((parent) => (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => handleMotherParentSelect(parent)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-slate-700 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{parent.name}</p>
                      <p className="text-xs text-gray-500">
                        {parent.email || parent.username} • {parent.phone || 'No phone'} •{' '}
                        {parent.cnic || 'No CNIC'}
                      </p>
                      {parent.students && parent.students.length > 0 && (
                        <p className="text-xs text-slate-800 mt-1">
                          Already linked to:{' '}
                          {parent.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedMotherParent && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-slate-800" />
              <div>
                <p className="font-medium text-slate-900">Selected: {selectedMotherParent.name}</p>
                <p className="text-xs text-slate-700">
                  {selectedMotherParent.email || selectedMotherParent.username} •{' '}
                  {selectedMotherParent.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show form fields if no existing parent is selected */}
      {!selectedMotherParent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name</label>
              <input
                type="text"
                value={motherInfo.name}
                onChange={(e) => {
                  setMotherField('name', e.target.value);
                  clearError('motherName');
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.motherName ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                  }`}
                placeholder="Enter mother's name"
              />
              {errors.motherName && <p className="text-sm text-red-500 mt-1">{errors.motherName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother CNIC</label>
              <input
                type="text"
                value={motherInfo.cnic}
                onChange={(e) => setMotherField('cnic', formatCNIC(e.target.value))}
                maxLength={15}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.motherCnic ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                  }`}
                placeholder="#####-#######-#"
              />
              {errors.motherCnic && <p className="text-sm text-red-500 mt-1">{errors.motherCnic}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mother Mobile</label>
            <input
              type="text"
              value={motherInfo.mobile}
              onChange={(e) => setMotherField('mobile', formatMobileNumber(e.target.value))}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.motherMobile ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                }`}
              placeholder="+92xxxxxxxxxxx"
            />
            {errors.motherMobile && <p className="text-sm text-red-500 mt-1">{errors.motherMobile}</p>}
          </div>
        </>
      )}
    </div>
  );
}

