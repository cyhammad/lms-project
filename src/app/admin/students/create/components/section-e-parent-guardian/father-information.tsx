'use client';

import { formatCNIC, formatMobileNumber } from '@/lib/validation';
import { Search, Check } from 'lucide-react';
import { useStudentFormStore } from '@/stores/use-student-form-store';

export default function FatherInformation() {
  const {
    fatherInfo,
    errors,
    selectedFatherParent,
    fatherSearchQuery,
    fatherSearchResults,
    searchingFather,
    setFatherField,
    setFatherSearchQuery,
    setSelectedFatherParent,
    setFatherSearchResults,
    clearError,
  } = useStudentFormStore();

  const handleFatherParentSelect = (parent: typeof selectedFatherParent) => {
    if (!parent) return;
    setSelectedFatherParent(parent);
    setFatherField('name', parent.name);
    setFatherField('cnic', parent.cnic || '');
    setFatherField('mobile', parent.phone || '');
    setFatherField('email', parent.email || '');
    setFatherField('occupation', parent.occupation || '');
    setFatherField('monthlyIncome', parent.monthlyIncome?.toString() || '');
    setFatherSearchQuery('');
    setFatherSearchResults([]);
  };

  const handleClearFatherSelection = () => {
    setSelectedFatherParent(null);
    setFatherField('name', '');
    setFatherField('cnic', '');
    setFatherField('mobile', '');
    setFatherField('email', '');
    setFatherField('occupation', '');
    setFatherField('monthlyIncome', '');
    setFatherSearchQuery('');
    setFatherSearchResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex-1">
          Father Information
        </h3>
        {selectedFatherParent && (
          <button
            type="button"
            onClick={handleClearFatherSelection}
            className="text-sm text-slate-800 hover:text-slate-800 ml-4"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Search Existing Father */}
      {!selectedFatherParent && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Search Existing Father</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={fatherSearchQuery}
              onChange={(e) => setFatherSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all text-gray-900 text-sm"
              placeholder="Search by name, email, phone, or CNIC..."
            />
          </div>
          {searchingFather && <p className="text-sm text-gray-500">Searching...</p>}
          {fatherSearchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
              {fatherSearchResults.map((parent) => (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => handleFatherParentSelect(parent)}
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

      {selectedFatherParent && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-slate-800" />
              <div>
                <p className="font-medium text-slate-900">Selected: {selectedFatherParent.name}</p>
                <p className="text-xs text-slate-700">
                  {selectedFatherParent.email || selectedFatherParent.username} •{' '}
                  {selectedFatherParent.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show form fields if no existing parent is selected */}
      {!selectedFatherParent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label>
              <input
                type="text"
                value={fatherInfo.name}
                onChange={(e) => {
                  setFatherField('name', e.target.value);
                  clearError('fatherName');
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.fatherName ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                  }`}
                placeholder="Enter father's name"
              />
              {errors.fatherName && <p className="text-sm text-red-500 mt-1">{errors.fatherName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father CNIC</label>
              <input
                type="text"
                value={fatherInfo.cnic}
                onChange={(e) => setFatherField('cnic', formatCNIC(e.target.value))}
                maxLength={15}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.fatherCnic ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                  }`}
                placeholder="#####-#######-#"
              />
              {errors.fatherCnic && <p className="text-sm text-red-500 mt-1">{errors.fatherCnic}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father Mobile</label>
              <input
                type="text"
                value={fatherInfo.mobile}
                onChange={(e) => setFatherField('mobile', formatMobileNumber(e.target.value))}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all text-gray-900 text-sm ${errors.fatherMobile ? 'border-red-500' : 'border-gray-200 focus:border-[#10b981]'
                  }`}
                placeholder="+92xxxxxxxxxxx"
              />
              {errors.fatherMobile && <p className="text-sm text-red-500 mt-1">{errors.fatherMobile}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father Email</label>
              <input
                type="email"
                value={fatherInfo.email}
                onChange={(e) => setFatherField('email', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
                placeholder="father@email.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input
                type="text"
                value={fatherInfo.occupation}
                onChange={(e) => setFatherField('occupation', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (PKR)</label>
              <input
                type="number"
                min="0"
                value={fatherInfo.monthlyIncome}
                onChange={(e) => setFatherField('monthlyIncome', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all text-gray-900 text-sm"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

