'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, Filter, Eye, X, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import type { Student, Class, Section, User } from '@/types';
import { StudentAvatar } from '../../components/StudentAvatar';

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

const STUDENT_COLUMNS: DataTableColumn[] = [
  { id: 'details', label: 'Student Details' },
  { id: 'standard', label: 'Standard Fee', align: 'right' },
  { id: 'discounted', label: 'Discounted Fee', align: 'right' },
  { id: 'actions', label: 'Actions' },
];

interface FeeHistoryClientPageProps {
  initialUser: User | null;
  initialStudents: Student[];
  initialClasses: Class[];
  initialSections: Section[];
}

export function FeeHistoryClientPage({
  initialUser,
  initialStudents,
  initialClasses,
  initialSections,
}: FeeHistoryClientPageProps) {
  const user = initialUser;
  const students = initialStudents;
  const classes = initialClasses;
  const sections = initialSections;

  // Filter states
  const [historyClassId, setHistoryClassId] = useState('');
  const [historySectionId, setHistorySectionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const schoolStudents = useMemo(() => {
    return user?.schoolId
      ? students.filter((s) => s.schoolId === user.schoolId && s.isActive)
      : students.filter((s) => s.isActive);
  }, [students, user?.schoolId]);

  const schoolClasses = useMemo(() => {
    return user?.schoolId
      ? classes.filter((c) => c.schoolId === user.schoolId && c.isActive)
      : classes.filter((c) => c.isActive);
  }, [classes, user?.schoolId]);

  const schoolSections = useMemo(() => {
    return user?.schoolId
      ? sections.filter((s) => s.schoolId === user.schoolId && s.isActive)
      : sections.filter((s) => s.isActive);
  }, [sections, user?.schoolId]);

  const getStudentName = (student: Student) =>
    student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';

  const getClassName = (student: Student) => {
    const classId = student.classId || student.classApplyingFor;
    if (!classId) return 'N/A';
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : 'N/A';
  };

  const getSectionName = (student: Student) => {
    if (!student.sectionId) return 'N/A';
    const section = sections.find((s) => s.id === student.sectionId);
    return section ? section.name : 'N/A';
  };

  const getStandardFee = (student: Student) => {
    const classId = student.classId || student.classApplyingFor;
    if (!classId) return 0;
    const cls = classes.find((c) => c.id === classId);
    return cls?.standardFee || 0;
  };

  // Filtered students for Fee History
  const filteredHistoryStudents = useMemo(() => {
    let filtered = [...schoolStudents];

    if (historyClassId) {
      filtered = filtered.filter(
        (s) => s.classId === historyClassId || s.classApplyingFor === historyClassId,
      );
    }

    if (historySectionId) {
      filtered = filtered.filter((s) => s.sectionId === historySectionId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const name = getStudentName(s).toLowerCase();
        const className = getClassName(s).toLowerCase();
        const sectionName = getSectionName(s).toLowerCase();
        return name.includes(query) || className.includes(query) || sectionName.includes(query);
      });
    }

    return filtered;
  }, [schoolStudents, historyClassId, historySectionId, searchQuery, classes, sections]);

  const totalFiltered = filteredHistoryStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistoryStudents.slice(start, start + pageSize);
  }, [filteredHistoryStudents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [historyClassId, historySectionId, searchQuery]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) setPage(totalPages);
  }, [totalFiltered, totalPages, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee History</h1>
        <p className="text-slate-700 mt-1">View fee history for all students</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
            {(historyClassId || historySectionId || searchQuery) && (
              <button
                onClick={() => {
                  setHistoryClassId('');
                  setHistorySectionId('');
                  setSearchQuery('');
                }}
                className="ml-auto flex items-center gap-1 text-xs text-slate-800 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-800" />
              <input
                type="text"
                placeholder="Search by name, class, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all"
              />
            </div>
            <select
              value={historyClassId}
              onChange={(e) => {
                setHistoryClassId(e.target.value);
                setHistorySectionId('');
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
              value={historySectionId}
              onChange={(e) => setHistorySectionId(e.target.value)}
              disabled={!historyClassId}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 focus:bg-white transition-all disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {schoolSections
                .filter((s) => !historyClassId || s.classId === historyClassId)
                .map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={`Students (${filteredHistoryStudents.length})`}
        columns={STUDENT_COLUMNS}
        loading={false}
        isEmpty={filteredHistoryStudents.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-900 font-medium">No students found</p>
            <p className="text-sm text-slate-700 mt-1">Try adjusting your filters</p>
          </div>
        }
        totalCount={totalFiltered}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedStudents.map((student) => {
          const standardFee = getStandardFee(student);
          const discountedFee = student.discountedFee || standardFee;
          const displayName = getStudentName(student);

          return (
            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <StudentAvatar student={student} displayName={displayName} />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{displayName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {getClassName(student)} • {getSectionName(student)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-sm font-medium text-gray-900">{formatCurrency(standardFee)}</span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-sm font-medium text-gray-900">{formatCurrency(discountedFee)}</span>
              </td>
              <td className="py-4 px-4 text-center">
                <Link href={ROUTES.ADMIN.FEES.STUDENT(student.id)}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View History
                  </button>
                </Link>
              </td>
            </tr>
          );
        })}
      </PaginatedDataTable>
    </div>
  );
}

