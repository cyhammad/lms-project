'use client';

import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ParentsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedClass: string;
  onClassChange: (value: string) => void;
  selectedSection: string;
  onSectionChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  classes: { id: string; name: string }[];
  sections: { id: string; name: string; classId?: string }[];
}

export const ParentsFilters = ({
  searchQuery,
  onSearchChange,
  selectedClass,
  onClassChange,
  selectedSection,
  onSectionChange,
  hasActiveFilters,
  onClearFilters,
  classes,
  sections,
}: ParentsFiltersProps) => {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-800 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, ID, or parent name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Section Filter */}
          {selectedClass && (
            <select
              value={selectedSection}
              onChange={(e) => onSectionChange(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white"
            >
              <option value="">All Sections</option>
              {sections
                .filter((s) => s.classId === selectedClass)
                .map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
            </select>
          )}

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

