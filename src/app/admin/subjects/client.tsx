'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, BookMarked, Plus, Award, Search, X, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { Subject, Class } from '@/types';
import { deleteSubject } from '@/actions/subjects';

const SUBJECT_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'subject', label: 'Subject' },
  { id: 'class', label: 'Class' },
  { id: 'description', label: 'Description' },
  { id: 'marks', label: 'Total Marks' },
  { id: 'passing', label: 'Passing %' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface SubjectsClientProps {
  initialSubjects: Subject[];
  classes: Class[];
}

export default function SubjectsClient({ initialSubjects, classes }: SubjectsClientProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  const filteredSubjects = useMemo(() => {
    let filtered = [...subjects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(query) ||
        (subject.description && subject.description.toLowerCase().includes(query)) ||
        getClassName(subject.classId).toLowerCase().includes(query)
      );
    }

    if (selectedClass) {
      filtered = filtered.filter(subject => subject.classId === selectedClass);
    }

    return filtered;
  }, [subjects, searchQuery, selectedClass, classes]);

  const totalFiltered = filteredSubjects.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const paginatedSubjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedClass]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalFiltered, totalPages, page]);

  const hasActiveFilters = searchQuery || selectedClass;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('');
  };

  const handleDelete = (id: string, name: string) => {
    setSubjectToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    setDeletingId(subjectToDelete.id);
    try {
      const result = await deleteSubject(subjectToDelete.id);
      if (result.error) {
        alert(result.error);
      } else {
        setSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject. Please try again.');
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setSubjectToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredSubjects.map((subject) => ({
      Name: subject.name,
      Class: getClassName(subject.classId),
      Description: subject.description || 'N/A',
      'Total Marks': subject.totalMarks,
      'Passing Percentage': `${subject.passingPercentage}%`,
    }));

    downloadCSV(csvData, 'subjects');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-700 mt-1">Manage all subjects in your school</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <BookMarked className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-slate-700">{subjects.length} Subjects</span>
          </div>
          <Link href={ROUTES.ADMIN.SUBJECTS_CREATE}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
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
            ? `Showing ${totalFiltered} of ${subjects.length} subjects`
            : `All Subjects (${subjects.length})`
        }
        headerActions={
          filteredSubjects.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          ) : null
        }
        columns={SUBJECT_TABLE_COLUMNS}
        isEmpty={filteredSubjects.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookMarked className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {hasActiveFilters ? 'No subjects match your filters' : 'No subjects added yet'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first subject'}
            </p>
            {!hasActiveFilters && (
              <Link href={ROUTES.ADMIN.SUBJECTS_CREATE}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Subject
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
        {paginatedSubjects.map((subject) => (
          <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 min-w-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
                  <BookMarked className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{subject.name}</p>
                </div>
              </div>
            </td>
            <td className="py-3 px-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                {getClassName(subject.classId)}
              </span>
            </td>
            <td className="py-3 px-4">
              <p className="text-sm text-slate-800">
                {subject.description || <span className="text-slate-800 italic">No description</span>}
              </p>
            </td>
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-800" />
                <span className="text-sm font-semibold text-slate-900">{subject.totalMarks}</span>
              </div>
            </td>
            <td className="py-3 px-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold">
                {subject.passingPercentage}%
              </span>
            </td>
            <td className="py-3 px-4">
              <div className="flex items-center justify-end gap-1">
                <Link href={ROUTES.ADMIN.SUBJECTS_EDIT(subject.id)}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                    <Edit className="w-4 h-4 text-slate-700" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDelete(subject.id, subject.name)}
                  disabled={deletingId === subject.id}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>
      <ConfirmDialog
        open={deleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteDialogOpen(false); setSubjectToDelete(null); }}
        title="Delete subject"
        message={subjectToDelete ? `Are you sure you want to delete subject "${subjectToDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
