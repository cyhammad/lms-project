'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Edit, Trash2, GraduationCap, Eye, X, UserPlus, Users, Search, Download, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { downloadCSV } from '@/lib/csv-export';
import { apiClient } from '@/lib/api-client';
import type { Student, Class, Section, AcademicSession } from '@/types';
import { deleteStudent } from '@/actions/students';
import BulkUploadDialog from './bulk-upload-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import { getStorageUrl } from '@/lib/storage-url';

interface StudentRowProps {
  student: Student;
  displayName: string;
  displayStudentId: string;
  displayClass: string;
  displaySection: string;
  displaySession: string;
  studentClass?: Class;
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
}

const StudentRow = ({ student, displayName, displayStudentId, displayClass, displaySection, displaySession, studentClass, onDelete, deletingId }: StudentRowProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {student.studentPhoto && !imageError ? (
            <img
              src={getStorageUrl(student.studentPhoto) || undefined}
              alt={displayName}
              className="w-9 h-9 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-slate-700/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-700">{studentClass?.grade ? `Grade ${studentClass.grade}` : ''}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
          {displayStudentId}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-slate-700">{displayClass}</td>
      <td className="py-3 px-4 text-sm text-slate-700">{displaySection}</td>
      <td className="py-3 px-4 text-sm text-slate-700">{displaySession}</td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-1">
          <Link href={ROUTES.ADMIN.STUDENTS_VIEW(student.id)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
              <Eye className="w-4 h-4 text-slate-700" />
            </Button>
          </Link>
          <Link href={ROUTES.ADMIN.STUDENTS_EDIT(student.id)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
              <Edit className="w-4 h-4 text-slate-700" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onDelete(student.id, displayName)}
            disabled={deletingId === student.id}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

const STUDENT_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'student', label: 'Student' },
  { id: 'id', label: 'ID' },
  { id: 'class', label: 'Class' },
  { id: 'section', label: 'Section' },
  { id: 'session', label: 'Session' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface StudentsClientProps {
  classes: Class[];
  sections: Section[];
  sessions: AcademicSession[];
  schoolId: string;
}

export default function StudentsClient({ classes, sections, sessions, schoolId }: StudentsClientProps) {
  const { showError, AlertComponent } = useAlert();
  const { sessionId: globalSessionId } = useAdminSession();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Debounced from searchQuery

  // Filter states (session is global from header)
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  // Backend pagination: data from API
  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search input -> searchQuery
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch students from backend with pagination and filters
  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (globalSessionId) params.set('sessionId', globalSessionId);
      if (selectedClass) params.set('classId', selectedClass);
      if (selectedSection) params.set('sectionId', selectedSection);

      const response = await apiClient<{ students: Student[]; total?: number; pagination?: { total: number } }>(
        `/students?${params.toString()}`
      );
      const list = response.students || [];
      const total = response.total ?? response.pagination?.total ?? list.length;
      setStudents(list);
      setTotalCount(total);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
      setTotalCount(0);
    } finally {
      setLoadingStudents(false);
    }
  }, [page, pageSize, searchQuery, globalSessionId, selectedClass, selectedSection]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset to page 1 when filters change (search is already debounced)
  useEffect(() => {
    setPage(1);
  }, [searchInput, selectedClass, selectedSection]);

  // Clear section when class changes (section belongs to a class)
  useEffect(() => {
    if (selectedClass && selectedSection) {
      const sectionBelongsToClass = sections.some(
        (s) => s.id === selectedSection && s.classId === selectedClass
      );
      if (!sectionBelongsToClass) setSelectedSection('');
    } else if (!selectedClass) {
      setSelectedSection('');
    }
  }, [selectedClass, selectedSection, sections]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Keep page in valid range when total shrinks
  useEffect(() => {
    if (totalCount > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, totalCount, page]);

  const hasActiveFilters = selectedClass || selectedSection || searchInput;

  // Classes for current global session only
  const classesForSession = useMemo(() => {
    if (!globalSessionId) return classes;
    return classes.filter((c) => c.sessionId === globalSessionId);
  }, [classes, globalSessionId]);

  // Only show sections that belong to the selected class (avoids duplicate "Section A/B/C" across classes)
  const sectionsForSelectedClass = useMemo(() => {
    if (!selectedClass) return [];
    return sections.filter((s) => s.classId === selectedClass);
  }, [sections, selectedClass]);

  const clearFilters = () => {
    setSelectedClass('');
    setSelectedSection('');
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setStudentToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    setDeletingId(studentToDelete.id);
    try {
      const result = await deleteStudent(studentToDelete.id);
      if (result.success) {
        toast.success(`Student "${studentToDelete.name}" deleted successfully`);
        await fetchStudents();
      } else {
        toast.error(result.error || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student. Please try again.');
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = students.map((student) => {
      const displayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';
      const displayStudentId = student.studentId || student.bFormCrc || student.id.substring(0, 8).toUpperCase();
      const studentClass = classes.find(c => c.id === (student.classId || student.classApplyingFor));
      const displayClass = studentClass?.name || 'Unassigned';
      const displaySection = student.sectionId
        ? sections.find(s => s.id === student.sectionId)?.name || 'N/A'
        : 'N/A';
      const displaySession = student.academicSession || 'N/A';

      return {
        Name: displayName,
        'Student ID': displayStudentId,
        Class: displayClass,
        Section: displaySection,
        Session: displaySession,
        Email: student.email || 'N/A',
        Phone: student.phone || 'N/A',
        'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
        Status: student.isActive ? 'Active' : 'Inactive',
      };
    });

    downloadCSV(csvData, 'students');
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      // We don't have full school object here easily without passing it. 
      // For now, let's skip strict school details in PDF or fetch/pass school data if critical.
      // But we have schoolId. We can't use getSchoolById(storage) as access to localStorage/mock data is deprecated.
      // Let's just use generic header for now or passed school name if available.

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const footerHeight = 20;
      const maxY = pageHeight - footerHeight;
      let yPos = margin;
      let currentPage = 1;

      const blackColor = [0, 0, 0];
      const grayColor = [100, 100, 100];

      const checkNewPage = (requiredSpace: number = 10) => {
        if (yPos + requiredSpace > maxY) {
          pdf.addPage();
          currentPage++;
          yPos = margin;
        }
      };

      // Header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STUDENTS REPORT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      checkNewPage(15);

      // Table Header using simple text for now or similar logic
      const colWidths = [45, 30, 25, 25, 25];
      const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2], margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]];

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');

      pdf.setFontSize(8);
      pdf.text('Name', colX[0], yPos);
      pdf.text('Student ID', colX[1], yPos);
      pdf.text('Class', colX[2], yPos);
      pdf.text('Section', colX[3], yPos);
      pdf.text('Session', colX[4], yPos);

      yPos += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);

      students.forEach((student) => {
        checkNewPage(7);
        const studentClass = classes.find(c => c.id === (student.classId || student.classApplyingFor));
        const section = sections.find(s => s.id === student.sectionId);
        const displayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';
        const displayStudentId = student.studentId || student.id.substring(0, 8).toUpperCase();
        const displayClass = studentClass?.name || 'N/A';
        const displaySection = section?.name || 'N/A';
        const displaySession = student.academicSession || 'N/A';

        pdf.text(displayName.substring(0, 25), colX[0], yPos);
        pdf.text(displayStudentId.substring(0, 12), colX[1], yPos);
        pdf.text(displayClass.substring(0, 15), colX[2], yPos);
        pdf.text(displaySection.substring(0, 15), colX[3], yPos);
        pdf.text(displaySession.substring(0, 15), colX[4], yPos);

        yPos += 6;
      });

      const fileName = `Students-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-700 mt-1">Manage all students in your school</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-semibold text-slate-700">{totalCount} Students</span>
          </div>
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Link href={ROUTES.ADMIN.STUDENTS_CREATE}>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll Student
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
                  placeholder="Search by name or ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter dropdowns (session is set globally in header) */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              >
                <option value="">All Classes</option>
                {classesForSession.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Sections</option>
                {sectionsForSelectedClass.map((section) => (
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
            ? `Showing ${students.length} of ${totalCount} students`
            : `All Students (${totalCount})`
        }
        headerActions={
          students.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          ) : null
        }
        columns={STUDENT_TABLE_COLUMNS}
        loading={loadingStudents}
        loadingIcon={<GraduationCap className="w-8 h-8 text-slate-800" />}
        loadingContent={<p className="text-slate-800">Loading students...</p>}
        isEmpty={students.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">
              {hasActiveFilters ? 'No students match your filters' : 'No students enrolled yet'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by enrolling your first student'}
            </p>
            {!hasActiveFilters && (
              <Link href={ROUTES.ADMIN.STUDENTS_CREATE}>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll First Student
                </Button>
              </Link>
            )}
          </div>
        }
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {students.map((student) => {
          const displayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';
          const displayStudentId = student.studentId || student.bFormCrc || student.id.substring(0, 8).toUpperCase();
          const studentClass = classes.find((c) => c.id === (student.classId || student.classApplyingFor));
          const displayClass = studentClass?.name || 'Unassigned';
          const displaySection = student.sectionId
            ? sections.find((s) => s.id === student.sectionId)?.name || 'N/A'
            : 'N/A';
          const displaySession = student.academicSession || 'N/A';

          return (
            <StudentRow
              key={student.id}
              student={student}
              displayName={displayName}
              displayStudentId={displayStudentId}
              displayClass={displayClass}
              displaySection={displaySection}
              displaySession={displaySession}
              studentClass={studentClass}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          );
        })}
      </PaginatedDataTable>

      <AlertComponent />

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        classes={classes}
        sections={sections}
        sessions={sessions}
        onSuccess={fetchStudents}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete student "{studentToDelete?.name}"? This action cannot be undone.
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
