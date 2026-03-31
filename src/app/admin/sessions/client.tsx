'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Calendar, Plus, Search, X, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { AcademicSession, Class, Section, Student, School } from '@/types';
import { deleteSession } from '@/actions/sessions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SESSION_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'session', label: 'Session' },
  { id: 'description', label: 'Description' },
  { id: 'classes', label: 'Classes', className: 'text-center' },
  { id: 'sections', label: 'Sections', className: 'text-center' },
  { id: 'students', label: 'Students', className: 'text-center' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface SessionsClientProps {
  initialSessions: AcademicSession[];
  classes: Class[];
  sections: Section[];
  students: Student[]; // or User[] mapped
  school?: School;
}

export default function SessionsClient({
  initialSessions,
  classes,
  sections,
  students,
  school
}: SessionsClientProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<AcademicSession[]>(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string, name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;

    const query = searchQuery.toLowerCase();
    return sessions.filter(session =>
      session.name.toLowerCase().includes(query) ||
      (session.description && session.description.toLowerCase().includes(query))
    );
  }, [sessions, searchQuery]);

  const totalFiltered = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalFiltered, totalPages, page]);

  const sessionStats = useMemo(() => {
    const stats = new Map<string, { classes: number; sections: number; students: number }>();

    sessions.forEach(session => {
      // Count classes for this session
      const sessionClasses = classes.filter(c => c.sessionId === session.id && c.isActive);
      const classCount = sessionClasses.length;

      // Count sections for classes in this session
      const sessionClassIds = new Set(sessionClasses.map(c => c.id));
      const sectionCount = sections.filter(s => sessionClassIds.has(s.classId) && s.isActive).length;

      // Count students for this session (students use academicSession name, not ID - legacy)
      // Check if student.academicSession matches session.name
      const studentCount = students.filter(s => s.academicSession === session.name && s.isActive).length;

      stats.set(session.id, {
        classes: classCount,
        sections: sectionCount,
        students: studentCount,
      });
    });

    return stats;
  }, [sessions, classes, sections, students]);

  const hasActiveFilters = !!searchQuery;

  const clearFilters = () => {
    setSearchQuery('');
  };

  const confirmDelete = (id: string, name: string) => {
    setSessionToDelete({ id, name });
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    setDeletingId(sessionToDelete.id);
    try {
      const result = await deleteSession(sessionToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
        toast.success(`Session "${sessionToDelete.name}" deleted successfully`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session. Please try again.');
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setSessionToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredSessions.map((session) => {
      const stats = sessionStats.get(session.id) || { classes: 0, sections: 0, students: 0 };
      return {
        Name: session.name,
        Description: session.description || 'N/A',
        Classes: stats.classes,
        Sections: stats.sections,
        Students: stats.students,
      };
    });

    downloadCSV(csvData, 'sessions');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
          <p className="text-slate-700 mt-1">Manage academic sessions in your school</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700">{sessions.length} Sessions</span>
          </div>
          <Link href={ROUTES.ADMIN.SESSIONS_CREATE}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={
          hasActiveFilters
            ? `Showing ${totalFiltered} of ${sessions.length} sessions`
            : `All Sessions (${sessions.length})`
        }
        headerActions={
          filteredSessions.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          ) : null
        }
        columns={SESSION_TABLE_COLUMNS}
        isEmpty={filteredSessions.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {hasActiveFilters ? 'No sessions match your search' : 'No sessions added yet'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {hasActiveFilters ? 'Try adjusting your search' : 'Get started by creating your first academic session'}
            </p>
            {!hasActiveFilters && (
              <Link href={ROUTES.ADMIN.SESSIONS_CREATE}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Session
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
        {paginatedSessions.map((session) => {
          const stats = sessionStats.get(session.id) || { classes: 0, sections: 0, students: 0 };
          return (
            <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 min-w-10 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{session.name}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-slate-800">
                  {session.description || <span className="text-slate-800 italic">No description</span>}
                </p>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-sm font-medium text-slate-900">{stats.classes}</span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-sm font-medium text-slate-900">{stats.sections}</span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-sm font-medium text-slate-900">{stats.students}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Link href={ROUTES.ADMIN.SESSIONS_EDIT(session.id)}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                      <Edit className="w-4 h-4 text-slate-700" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => confirmDelete(session.id, session.name)}
                    disabled={deletingId === session.id}
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete session "{sessionToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
              {deletingId ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
