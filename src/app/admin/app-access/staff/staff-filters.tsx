'use client';

import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StaffType } from '@/types';

interface StaffFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedStaffType: StaffType | '';
  onStaffTypeChange: (value: StaffType | '') => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  staffTypes: StaffType[];
}

export const StaffFilters = ({
  searchQuery,
  onSearchChange,
  selectedStaffType,
  onStaffTypeChange,
  hasActiveFilters,
  onClearFilters,
  staffTypes,
}: StaffFiltersProps) => {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-800 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or staff type..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
            />
          </div>

          {/* Staff Type Filter */}
          <select
            value={selectedStaffType}
            onChange={(e) => onStaffTypeChange(e.target.value as StaffType | '')}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
          >
            <option value="">All Staff Types</option>
            {staffTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

