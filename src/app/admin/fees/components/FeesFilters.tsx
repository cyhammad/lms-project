import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaymentStatus, Class, Section } from '@/types';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface FeesFiltersProps {
  selectedClassId: string;
  selectedSectionId: string;
  selectedStatus: PaymentStatus | '';
  selectedYear: string;
  selectedMonth: string;
  onClassChange: (id: string) => void;
  onSectionChange: (id: string) => void;
  onStatusChange: (status: PaymentStatus | '') => void;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  schoolClasses: Class[];
  schoolSections: Section[];
  availableYears: number[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FeesFilters({
  selectedClassId,
  selectedSectionId,
  selectedStatus,
  selectedYear,
  selectedMonth,
  onClassChange,
  onSectionChange,
  onStatusChange,
  onYearChange,
  onMonthChange,
  schoolClasses,
  schoolSections,
  availableYears,
  hasActiveFilters,
  onClearFilters,
}: FeesFiltersProps) {
  return (
    <div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-700" />
          <span className="text-sm font-semibold text-slate-700">Filters</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="ml-auto">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => {
              onClassChange(e.target.value);
            }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
          >
            <option value="">All Classes</option>
            {schoolClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSectionId}
            onChange={(e) => onSectionChange(e.target.value)}
            disabled={!selectedClassId}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all disabled:opacity-50"
          >
            <option value="">All Sections</option>
            {schoolSections
              .filter((s) => !selectedClassId || s.classId === selectedClassId)
              .map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as PaymentStatus | '')}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
          >
            <option value="">All Years</option>
            {availableYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
          >
            <option value="">All Months</option>
            {MONTH_NAMES.map((month, index) => (
              <option key={index + 1} value={(index + 1).toString()}>
                {month.substring(0, 3)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

