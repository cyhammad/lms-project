'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, Link2, X, Check } from 'lucide-react';
import { useStudentFormStore } from '@/stores/use-student-form-store';
import { PasswordInput } from '@/components/ui/password-input';

export default function SectionFParentAccount() {
  const {
    parentAccountOption,
    parentAccountData,
    parentGuardianTab,
    fatherInfo,
    motherInfo,
    guardianInfo,
    errors,
    parentSearchQuery,
    parentSearchResults,
    searchingParents,
    selectedParent,
    setParentAccountOption,
    setParentAccountField,
    setParentSearchQuery,
    setSelectedParent,
    setParentSearchResults,
  } = useStudentFormStore();

  const handleClearParentSelection = () => {
    setSelectedParent(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parent Account (Mobile App)</CardTitle>
        <CardDescription>Optionally create or connect a parent account for mobile app access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Option Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Parent Account Option</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setParentAccountOption('none');
                handleClearParentSelection();
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${parentAccountOption === 'none'
                ? 'border-slate-700 bg-slate-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <X className="w-4 h-4" />
                <span className="font-medium">Skip for Now</span>
              </div>
              <p className="text-xs text-gray-500">Don&apos;t create parent account now</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setParentAccountOption('create');
                handleClearParentSelection();
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${parentAccountOption === 'create'
                ? 'border-slate-700 bg-slate-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">Create New Account</span>
              </div>
              <p className="text-xs text-gray-500">Register a new parent account</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setParentAccountOption('connect');
                setParentSearchQuery('');
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${parentAccountOption === 'connect'
                ? 'border-slate-700 bg-slate-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="w-4 h-4" />
                <span className="font-medium">Connect Existing</span>
              </div>
              <p className="text-xs text-gray-500">Link to an existing parent account</p>
            </button>
          </div>
        </div>

        {/* Create New Parent Account Form */}
        {parentAccountOption === 'create' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900">Create Login Credentials</h4>
            <p className="text-sm text-gray-500">
              The parent details from Section E will be used. Just provide login credentials below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Type *</label>
                <select
                  value={parentAccountData.parentType}
                  onChange={(e) =>
                    setParentAccountField('parentType', e.target.value as 'FATHER' | 'MOTHER' | 'GUARDIAN')
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all text-gray-900 text-sm"
                >
                  {parentGuardianTab === 'parents' ? (
                    <>
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                    </>
                  ) : (
                    <option value="GUARDIAN">Guardian</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username *</label>
                <input
                  type="text"
                  value={parentAccountData.emailOrUsername}
                  onChange={(e) => setParentAccountField('emailOrUsername', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all text-gray-900 text-sm ${errors.parentEmailOrUsername ? 'border-red-500' : 'border-gray-200'
                    }`}
                  placeholder="email@example.com or username"
                />
                {errors.parentEmailOrUsername && (
                  <p className="text-sm text-red-500 mt-1">{errors.parentEmailOrUsername}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <PasswordInput
                  value={parentAccountData.password}
                  onChange={(e) => setParentAccountField('password', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all text-gray-900 text-sm ${errors.parentPassword ? 'border-red-500' : 'border-gray-200'
                    }`}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                />
                {errors.parentPassword && <p className="text-sm text-red-500 mt-1">{errors.parentPassword}</p>}
              </div>
            </div>

            {/* Preview of parent info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
              <strong>Will create account for:</strong>{' '}
              {parentAccountData.parentType === 'FATHER' && fatherInfo.name}
              {parentAccountData.parentType === 'MOTHER' && motherInfo.name}
              {parentAccountData.parentType === 'GUARDIAN' && guardianInfo.name} ({parentAccountData.parentType})
            </div>
          </div>
        )}

        {/* Connect Existing Parent */}
        {parentAccountOption === 'connect' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900">Search Existing Parent</h4>
            <p className="text-sm text-gray-500">Search by name, email, username, phone, or CNIC</p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={parentSearchQuery}
                onChange={(e) => setParentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all text-gray-900 text-sm"
                placeholder="Search parents..."
              />
            </div>

            {searchingParents && <p className="text-sm text-gray-500">Searching...</p>}

            {parentSearchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parentSearchResults.map((parent) => (
                  <button
                    key={parent.id}
                    type="button"
                    onClick={() => {
                      setSelectedParent(parent);
                      setParentSearchQuery('');
                      setParentSearchResults([]);
                    }}
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-slate-700 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{parent.name}</p>
                        <p className="text-xs text-gray-500">
                          {parent.email || parent.username} • {parent.phone || 'No phone'}
                        </p>
                        {parent.students && parent.students.length > 0 && (
                          <p className="text-xs text-slate-800 mt-1">
                            Already linked to: {parent.students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">{parent.parentType}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedParent && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-slate-800" />
                    <div>
                      <p className="font-medium text-slate-900">{selectedParent.name}</p>
                      <p className="text-xs text-slate-700">
                        {selectedParent.email || selectedParent.username} • {selectedParent.parentType}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearParentSelection}
                    className="text-slate-800 hover:text-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
