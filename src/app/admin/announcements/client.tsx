'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Bell,
  Users,
  Search,
  X,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  GraduationCap,
  UserCog,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';
import { ROUTES } from '@/constants/routes';
import type { Announcement, AnnouncementRecipientType } from '@/types';
import { useAlert } from '@/hooks/use-alert';
import { deleteAnnouncement } from '@/actions/announcements';
import { useRouter } from 'next/navigation';

const formatDateTime = (date: Date | string) => {
  const d = new Date(date);
  const now = new Date();
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (diffInHours < 168) {
    // Less than a week
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const getRecipientTypeConfig = (type: AnnouncementRecipientType) => {
  switch (type) {
    case 'all':
      return { label: 'Everyone', icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'teachers':
      return {
        label: 'All Teachers',
        icon: GraduationCap,
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'parents':
      return {
        label: 'All Parents',
        icon: UserCog,
        color: 'bg-slate-50 text-slate-700 border-slate-200',
      };
    case 'students':
      return {
        label: 'All Students',
        icon: Users,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'specific':
      return {
        label: 'Specific People',
        icon: UserCheck,
        color: 'bg-slate-50 text-slate-700 border-slate-200',
      };
    default:
      return { label: type, icon: Users, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

const ANNOUNCEMENT_COLUMNS: DataTableColumn[] = [
  { id: 'announcement', label: 'Announcement' },
  { id: 'recipients', label: 'Recipients' },
  { id: 'status', label: 'Status' },
  { id: 'datetime', label: 'Date & Time' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

interface AnnouncementsClientProps {
  initialAnnouncements: Announcement[];
}

export default function AnnouncementsClient({ initialAnnouncements }: AnnouncementsClientProps) {
  const router = useRouter();
  const { showError, showConfirm, AlertComponent, ConfirmComponent } = useAlert();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingAnnouncement, setViewingAnnouncement] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery) return announcements;

    const query = searchQuery.toLowerCase();
    return announcements.filter((announcement) => {
      const config = getRecipientTypeConfig(announcement.recipientType);
      return (
        announcement.title.toLowerCase().includes(query) ||
        announcement.message.toLowerCase().includes(query) ||
        config.label.toLowerCase().includes(query)
      );
    });
  }, [announcements, searchQuery]);

  const totalFiltered = filteredAnnouncements.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const paginatedAnnouncements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAnnouncements.slice(start, start + pageSize);
  }, [filteredAnnouncements, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (totalFiltered > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalFiltered, totalPages, page]);

  const viewedAnnouncement = useMemo(
    () => (viewingAnnouncement ? announcements.find((a) => a.id === viewingAnnouncement) : null),
    [viewingAnnouncement, announcements],
  );

  const hasActiveFilters = !!searchQuery;

  const clearFilters = () => {
    setSearchQuery('');
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete announcement "${title}"? This action cannot be undone.`,
      'Delete Announcement',
      'Delete',
      'Cancel',
      'destructive',
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteAnnouncement(id);
      if (result.error) {
        showError(result.error);
      } else {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showError('Failed to delete announcement. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-700 mt-1.5">
            Manage announcements and notifications for your school community
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm">
            <Bell className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">
              {announcements.length} Total
            </span>
          </div>
          <Link href={ROUTES.ADMIN.ANNOUNCEMENTS_CREATE}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                <input
                  type="text"
                  placeholder="Search by title, message, or recipient type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-slate-300 hover:bg-slate-50"
              >
                <X className="w-4 h-4 mr-1.5" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PaginatedDataTable
        title={
          hasActiveFilters
            ? `Showing ${totalFiltered} of ${announcements.length} announcements`
            : `All Announcements (${announcements.length})`
        }
        columns={ANNOUNCEMENT_COLUMNS}
        isEmpty={filteredAnnouncements.length === 0}
        emptyContent={
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-slate-900 font-semibold text-lg">
              {hasActiveFilters ? 'No announcements match your search' : 'No announcements created yet'}
            </p>
            <p className="text-sm text-slate-700 mt-1 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first announcement'}
            </p>
            {!hasActiveFilters && (
              <Link href={ROUTES.ADMIN.ANNOUNCEMENTS_CREATE}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Announcement
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
        {paginatedAnnouncements.map((announcement) => {
          const recipientConfig = getRecipientTypeConfig(announcement.recipientType);
          const RecipientIcon = recipientConfig.icon;

          return (
            <tr key={announcement.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 min-w-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-shadow">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {announcement.title}
                    </h3>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex flex-col gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${recipientConfig.color} w-fit`}
                  >
                    <RecipientIcon className="w-3.5 h-3.5" />
                    {recipientConfig.label}
                  </span>
                  {announcement.recipientType === 'specific' &&
                    announcement.recipientIds &&
                    announcement.recipientIds.length > 0 && (
                      <span className="text-xs text-slate-700 font-medium">
                        {announcement.recipientIds.length} recipient
                        {announcement.recipientIds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                </div>
              </td>
              <td className="py-4 px-6">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${announcement.isActive ? 'bg-slate-50 text-slate-700' : 'bg-slate-100 text-slate-800'
                    }`}
                >
                  {announcement.isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Inactive
                    </>
                  )}
                </span>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Clock className="w-4 h-4 text-slate-800" />
                  <span className="font-medium">{formatDateTime(announcement.createdAt)}</span>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 transition-opacity hover:bg-indigo-50 hover:text-indigo-600"
                    onClick={() => setViewingAnnouncement(announcement.id)}
                    title="View announcement details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 transition-opacity hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(announcement.id, announcement.title)}
                    disabled={deletingId === announcement.id}
                    title="Delete announcement"
                  >
                    <Trash2
                      className={`w-4 h-4 ${deletingId === announcement.id ? 'animate-pulse' : ''}`}
                    />
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </PaginatedDataTable>

      {/* View Announcement Modal */}
      {viewedAnnouncement && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingAnnouncement(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 min-w-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Announcement Details</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewingAnnouncement(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {viewedAnnouncement.title}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {(() => {
                    const recipientConfig = getRecipientTypeConfig(viewedAnnouncement.recipientType);
                    const RecipientIcon = recipientConfig.icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${recipientConfig.color}`}
                      >
                        <RecipientIcon className="w-3.5 h-3.5" />
                        {recipientConfig.label}
                      </span>
                    );
                  })()}
                  {viewedAnnouncement.recipientType === 'specific' &&
                    viewedAnnouncement.recipientIds &&
                    viewedAnnouncement.recipientIds.length > 0 && (
                      <span className="text-xs text-slate-700 font-medium">
                        {viewedAnnouncement.recipientIds.length} recipient
                        {viewedAnnouncement.recipientIds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${viewedAnnouncement.isActive
                      ? 'bg-slate-50 text-slate-700'
                      : 'bg-slate-100 text-slate-800'
                      }`}
                  >
                    {viewedAnnouncement.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Inactive
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(viewedAnnouncement.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Message</h4>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {viewedAnnouncement.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertComponent />
      <ConfirmComponent />
    </div>
  );
}

