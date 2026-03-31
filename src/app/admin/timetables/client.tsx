'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Clock, Plus, Eye, BookOpen, Search, X, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { deleteTimetable } from '@/actions/timetables';
import { downloadCSV } from '@/lib/csv-export';
import type { Timetable, Class, Section } from '@/types';

const TIMETABLE_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'section', label: 'Section' },
  { id: 'class', label: 'Class' },
  { id: 'entries', label: 'Entries' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

const SECTIONS_MISSING_TIMETABLE_COLUMNS: DataTableColumn[] = [
  { id: 'section', label: 'Section' },
  { id: 'class', label: 'Class' },
  { id: 'action', label: 'Action', align: 'right' },
];

interface TimetablesClientProps {
  initialTimetables: Timetable[];
  classes: Class[];
  sections: Section[];
}

export default function TimetablesClient({ initialTimetables, classes, sections }: TimetablesClientProps) {
  const router = useRouter();
  const { showError, showConfirm, AlertComponent, ConfirmComponent } = useAlert();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [swPage, setSwPage] = useState(1);
  const [swPageSize, setSwPageSize] = useState(10);

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  const getClassCode = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.code : '';
  };

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : 'Unknown Section';
  };

  const getSectionClassId = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.classId : '';
  };

  const filteredTimetables = useMemo(() => {
    let filtered = [...initialTimetables];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(timetable => {
        const sectionName = getSectionName(timetable.sectionId);
        const classId = getSectionClassId(timetable.sectionId);
        const className = getClassName(classId);
        const classCode = getClassCode(classId);
        return (
          sectionName.toLowerCase().includes(query) ||
          className.toLowerCase().includes(query) ||
          classCode.toLowerCase().includes(query)
        );
      });
    }

    if (selectedClass) {
      filtered = filtered.filter(timetable => {
        const classId = getSectionClassId(timetable.sectionId);
        return classId === selectedClass;
      });
    }

    if (selectedSection) {
      filtered = filtered.filter(timetable => timetable.sectionId === selectedSection);
    }

    return filtered;
  }, [initialTimetables, searchQuery, selectedClass, selectedSection, classes, sections]);

  const totalFiltered = filteredTimetables.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const paginatedTimetables = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTimetables.slice(start, start + pageSize);
  }, [filteredTimetables, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedClass, selectedSection]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalFiltered, totalPages, page]);

  const isPrerequisiteEmpty = initialTimetables.length === 0 && classes.length === 0;

  const sectionsWithoutTimetables = useMemo(
    () => sections.filter((section) => !initialTimetables.some((t) => t.sectionId === section.id)),
    [sections, initialTimetables]
  );

  const swTotal = sectionsWithoutTimetables.length;
  const swTotalPages = Math.max(1, Math.ceil(swTotal / swPageSize));

  const paginatedSectionsWithoutTimetables = useMemo(() => {
    const start = (swPage - 1) * swPageSize;
    return sectionsWithoutTimetables.slice(start, start + swPageSize);
  }, [sectionsWithoutTimetables, swPage, swPageSize]);

  useEffect(() => {
    setSwPage(1);
  }, [sections.length, initialTimetables.length]);

  useEffect(() => {
    if (swTotal > 0 && swPage > swTotalPages) {
      setSwPage(swTotalPages);
    }
  }, [swTotal, swTotalPages, swPage]);

  const hasActiveFilters = searchQuery || selectedClass || selectedSection;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('');
    setSelectedSection('');
  };

  const handleDelete = async (id: string, className: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete the timetable for "${className}"? This action cannot be undone.`,
      'Delete Timetable',
      'Delete',
      'Cancel',
      'destructive'
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteTimetable(id);
      if (result.success) {
        // Router refresh handled by server action revalidatePath, 
        // but explicit refresh ensures client state is updated if needed
        router.refresh();
      } else {
        showError(result.error || 'Failed to delete timetable');
      }
    } catch (error) {
      console.error('Error deleting timetable:', error);
      showError('Failed to delete timetable. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredTimetables.map((timetable) => {
      const sectionName = getSectionName(timetable.sectionId);
      const classId = getSectionClassId(timetable.sectionId);
      const className = getClassName(classId);
      const classCode = getClassCode(classId);
      return {
        Section: sectionName,
        Class: className,
        'Class Code': classCode,
        'Number of Entries': timetable.entries.length,
      };
    });

    downloadCSV(csvData, 'timetables');
  };

  return (
    <div className="space-y-6">
      <AlertComponent />
      <ConfirmComponent />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetables</h1>
          <p className="text-slate-700 mt-1">Manage timetables for all sections</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">{initialTimetables.length} Timetables</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-slate-700">{sections.length} Sections</span>
            </div>
          </div>
          <Link href={ROUTES.ADMIN.TIMETABLES_CREATE}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Timetable
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                <input
                  type="text"
                  placeholder="Search by section, class name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection(''); // Reset section filter when class changes
                }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                disabled={!selectedClass}
              >
                <option value="">All Sections</option>
                {selectedClass && sections
                  .filter(s => s.classId === selectedClass)
                  .map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
              </select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={
          hasActiveFilters
            ? `Showing ${totalFiltered} of ${initialTimetables.length} timetables`
            : `All Timetables (${initialTimetables.length})`
        }
        headerActions={
          filteredTimetables.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          ) : null
        }
        columns={TIMETABLE_TABLE_COLUMNS}
        isEmpty={filteredTimetables.length === 0}
        emptyContent={
          isPrerequisiteEmpty ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-900 font-medium">No sections found</p>
              <p className="text-sm text-slate-700 mt-1">Please create classes and sections first before creating timetables</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-slate-900 font-medium">
                {hasActiveFilters ? 'No timetables match your filters' : 'No timetables created yet'}
              </p>
              <p className="text-sm text-slate-700 mt-1 mb-4">
                {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first timetable'}
              </p>
              {!hasActiveFilters && (
                <Link href={ROUTES.ADMIN.TIMETABLES_CREATE}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Timetable
                  </Button>
                </Link>
              )}
            </div>
          )
        }
        totalCount={totalFiltered}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedTimetables.map((timetable) => {
          const sectionName = getSectionName(timetable.sectionId);
          const classId = getSectionClassId(timetable.sectionId);
          const className = getClassName(classId);
          const classCode = getClassCode(classId);
          return (
            <tr key={timetable.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 min-w-10 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{sectionName}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{className}</p>
                  <p className="text-xs text-slate-700">{classCode}</p>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                  {timetable.entries.length} {timetable.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Link href={ROUTES.ADMIN.TIMETABLES_VIEW(timetable.id)}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
                      <Eye className="w-4 h-4 text-slate-700" />
                    </Button>
                  </Link>
                  <Link href={ROUTES.ADMIN.TIMETABLES_EDIT(timetable.id)}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                      <Edit className="w-4 h-4 text-slate-700" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDelete(timetable.id, `${sectionName} - ${className}`)}
                    disabled={deletingId === timetable.id}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </PaginatedDataTable>

      {sectionsWithoutTimetables.length > 0 && (
        <PaginatedDataTable
          title={
            <span>
              Sections Without Timetables
              <span className="block text-sm font-normal text-slate-700 mt-0.5 normal-case">
                {sectionsWithoutTimetables.length} sections need timetables
              </span>
            </span>
          }
          columns={SECTIONS_MISSING_TIMETABLE_COLUMNS}
          isEmpty={false}
          emptyContent={null}
          totalCount={swTotal}
          page={swPage}
          pageSize={swPageSize}
          onPageChange={setSwPage}
          onPageSizeChange={setSwPageSize}
          pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        >
          {paginatedSectionsWithoutTimetables.map((section) => {
            const className = getClassName(section.classId);
            const classCode = getClassCode(section.classId);
            return (
              <tr key={section.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 min-w-10 rounded-lg bg-slate-200 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{section.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{className}</p>
                    <p className="text-xs text-slate-700">{classCode}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end">
                    <Link href={`${ROUTES.ADMIN.TIMETABLES_CREATE}?sectionId=${section.id}`}>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Timetable
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </PaginatedDataTable>
      )}
    </div>
  );
}
