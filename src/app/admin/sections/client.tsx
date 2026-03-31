'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Users, Plus, Layers, Search, X, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { Section, Class, Student } from '@/types';
import { deleteSection } from '@/actions/sections';

const SECTION_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'section', label: 'Section' },
  { id: 'class', label: 'Class' },
  { id: 'description', label: 'Description' },
  { id: 'students', label: 'Students' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface SectionsClientProps {
  initialSections: Section[];
  classes: Class[];
  students: Student[];
}

export default function SectionsClient({ initialSections, classes, students }: SectionsClientProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getStudentCount = (sectionId: string) => {
    return students.filter(s => s.sectionId === sectionId).length;
  };

  const getClassStudentCount = (classId: string) => {
    return students.filter(s => s.classId === classId || s.classApplyingFor === classId).length;
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  const filteredSections = useMemo(() => {
    let filtered = [...sections];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(section =>
        section.name.toLowerCase().includes(query) ||
        (section.description && section.description.toLowerCase().includes(query)) ||
        getClassName(section.classId).toLowerCase().includes(query)
      );
    }

    if (selectedClass) {
      filtered = filtered.filter(section => section.classId === selectedClass);
    }

    return filtered;
  }, [sections, searchQuery, selectedClass, classes]);

  const totalFiltered = filteredSections.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const paginatedSections = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSections.slice(start, start + pageSize);
  }, [filteredSections, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedClass]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalFiltered, totalPages, page]);

  const totalStudents = useMemo(() => {
    return sections.reduce((sum, section) => sum + getStudentCount(section.id), 0);
  }, [sections, students]);

  const hasActiveFilters = searchQuery || selectedClass;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('');
  };

  const handleDelete = (id: string, name: string) => {
    setSectionToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sectionToDelete) return;
    setDeletingId(sectionToDelete.id);
    try {
      const result = await deleteSection(sectionToDelete.id);
      if (result.error) {
        alert(result.error);
      } else {
        setSections(prev => prev.filter(s => s.id !== sectionToDelete.id));
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section. Please try again.');
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredSections.map((section) => {
      const sectionStudentCount = getStudentCount(section.id);
      const classStudentCount = getClassStudentCount(section.classId);
      return {
        Name: section.name,
        Class: getClassName(section.classId),
        Description: section.description || 'N/A',
        'Students in Section': sectionStudentCount,
        'Total Students in Class': classStudentCount,
        Status: section.isActive ? 'Active' : 'Inactive',
      };
    });

    downloadCSV(csvData, 'sections');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
          <p className="text-slate-700 mt-1">Manage all sections in your school</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-700">{sections.length} Sections</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Users className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">{totalStudents} Students</span>
            </div>
          </div>
          <Link href={ROUTES.ADMIN.SECTIONS_CREATE}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
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
                  placeholder="Search by name, description, or class..."
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
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
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
            ? `Showing ${totalFiltered} of ${sections.length} sections`
            : `All Sections (${sections.length})`
        }
        headerActions={
          filteredSections.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          ) : null
        }
        columns={SECTION_TABLE_COLUMNS}
        isEmpty={filteredSections.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {hasActiveFilters ? 'No sections match your filters' : 'No sections added yet'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first section'}
            </p>
            {!hasActiveFilters && (
              <Link href={ROUTES.ADMIN.SECTIONS_CREATE}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Section
                </Button>
              </Link>
            )}
          </div>
        }
        totalCount={totalFiltered}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedSections.map((section) => {
          const sectionStudentCount = getStudentCount(section.id);
          const classStudentCount = getClassStudentCount(section.classId);
          return (
            <tr key={section.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 min-w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{section.name}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                  {getClassName(section.classId)}
                </span>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-slate-800">
                  {section.description || <span className="text-slate-800 italic">No description</span>}
                </p>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-800" />
                  <span className="text-sm font-semibold text-slate-900">{sectionStudentCount}</span>
                  <span className="text-sm text-slate-700">/ {classStudentCount}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Link href={ROUTES.ADMIN.SECTIONS_EDIT(section.id)}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                      <Edit className="w-4 h-4 text-slate-700" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDelete(section.id, section.name)}
                    disabled={deletingId === section.id}
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
      <ConfirmDialog
        open={deleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteDialogOpen(false); setSectionToDelete(null); }}
        title="Delete section"
        message={sectionToDelete ? `Are you sure you want to delete section "${sectionToDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
