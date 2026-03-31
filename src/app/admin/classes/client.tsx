'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, BookOpen, Plus, Users, GraduationCap, Search, X, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { Class, AcademicSession, Student } from '@/types';
import { deleteClass } from '@/actions/classes';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAdminSession } from '@/contexts/AdminSessionContext';

const CLASS_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'class', label: 'Class' },
  { id: 'level', label: 'Level & Grade' },
  { id: 'session', label: 'Session' },
  { id: 'students', label: 'Students' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface ClassesClientProps {
  initialClasses: Class[];
  sessions: AcademicSession[];
  students: Student[];
}

export default function ClassesClient({ initialClasses, sessions, students }: ClassesClientProps) {
  const router = useRouter();
  const { sessionId: globalSessionId } = useAdminSession();
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<{ id: string, name: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getSessionName = (sessionId?: string) => {
    if (!sessionId) return 'N/A';
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.name : 'Unknown';
  };

  const getStudentCount = (classId: string) => {
    return students.filter(s => s.classId === classId || s.classApplyingFor === classId).length;
  };

  const filteredClasses = useMemo(() => {
    let filtered = [...classes];

    if (globalSessionId) {
      filtered = filtered.filter(cls => cls.sessionId === globalSessionId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(query) ||
        cls.code.toLowerCase().includes(query) ||
        (cls.description && cls.description.toLowerCase().includes(query))
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter(cls => cls.educationLevel === selectedLevel);
    }

    return filtered;
  }, [classes, searchQuery, globalSessionId, selectedLevel]);

  const totalFiltered = filteredClasses.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const paginatedClasses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClasses.slice(start, start + pageSize);
  }, [filteredClasses, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedLevel, globalSessionId]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalFiltered, totalPages, page]);

  const totalStudents = useMemo(() => {
    return classes.reduce((sum, cls) => sum + getStudentCount(cls.id), 0);
  }, [classes, students]);

  const educationLevels = useMemo(() => {
    const levels = new Set(classes.map(c => c.educationLevel).filter(Boolean));
    return Array.from(levels) as string[];
  }, [classes]);

  const hasActiveFilters = searchQuery || selectedLevel;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('');
  };

  const handleDelete = (id: string, name: string) => {
    setClassToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;

    setDeletingId(classToDelete.id);
    try {
      const result = await deleteClass(classToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Class "${classToDelete.name}" deleted successfully`);
        setClasses(prev => prev.filter(c => c.id !== classToDelete.id));
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class. Please try again.');
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredClasses.map((cls) => {
      const studentCount = getStudentCount(cls.id);
      return {
        Name: cls.name,
        Code: cls.code,
        'Education Level': cls.educationLevel || 'N/A',
        Grade: cls.grade || 'N/A',
        Session: getSessionName(cls.sessionId),
        'Student Count': studentCount,
        Description: cls.description || 'N/A',
        Status: cls.isActive ? 'Active' : 'Inactive',
      };
    });

    downloadCSV(csvData, 'classes');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-700 mt-1">Manage all classes in your school</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-slate-700">{classes.length} Classes</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <GraduationCap className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">{totalStudents} Students</span>
            </div>
          </div>
          <Link href={ROUTES.ADMIN.CLASSES_CREATE}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
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
                  placeholder="Search by name, code, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter dropdowns (session is set globally in header) */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Levels</option>
                {educationLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
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
            ? `Showing ${totalFiltered} of ${classes.length} classes`
            : `All Classes (${classes.length})`
        }
        headerActions={
          filteredClasses.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          ) : null
        }
        columns={CLASS_TABLE_COLUMNS}
        isEmpty={filteredClasses.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {hasActiveFilters ? 'No classes match your filters' : 'No classes added yet'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first class'}
            </p>
            {!hasActiveFilters && (
              <Link href={ROUTES.ADMIN.CLASSES_CREATE}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Class
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
        {paginatedClasses.map((cls) => {
          const studentCount = getStudentCount(cls.id);
          return (
            <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 min-w-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{cls.name}</p>
                    <p className="text-xs text-slate-700">{cls.code}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col gap-1">
                  {cls.educationLevel && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium w-fit">
                      {cls.educationLevel}
                    </span>
                  )}
                  <span className="text-sm text-slate-800">Grade {cls.grade}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-slate-700">{getSessionName(cls.sessionId)}</p>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-800" />
                  <span className="text-sm font-semibold text-slate-900">{studentCount}</span>
                  <span className="text-sm text-slate-700">students</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Link href={ROUTES.ADMIN.CLASSES_EDIT(cls.id)}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                      <Edit className="w-4 h-4 text-slate-700" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDelete(cls.id, cls.name)}
                    disabled={deletingId === cls.id}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete class "{classToDelete?.name}"? all students in this class will be unassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={!!deletingId}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={!!deletingId}>
              {deletingId ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
