'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, User, BookOpen, Edit, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { Timetable, TimetableEntry, DayOfWeek, Class, Section, Subject, Teacher, School } from '@/types';

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimetableViewClientProps {
  timetable: Timetable;
  initialClasses: Class[];
  initialSections: Section[];
  initialSubjects: Subject[];
  initialTeachers: Teacher[];
  school: School | null;
}

export default function TimetableViewClient({
  timetable,
  initialClasses,
  initialSections,
  initialSubjects,
  initialTeachers,
  school,
}: TimetableViewClientProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const classes = initialClasses;
  const sections = initialSections;
  const subjects = initialSubjects;
  const teachers = initialTeachers;

  const sectionData = useMemo(() => {
    return sections.find(s => s.id === timetable.sectionId);
  }, [timetable, sections]);

  const classData = useMemo(() => {
    if (!sectionData) return null;
    return classes.find(c => c.id === sectionData.classId);
  }, [sectionData, classes]);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return null;
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : null;
  };

  // Get all unique time slots from entries, sorted
  const timeSlots = useMemo(() => {
    const slots = new Map<string, { start: string; end: string }>();

    timetable.entries.forEach(entry => {
      const key = `${entry.startTime}-${entry.endTime}`;
      if (!slots.has(key)) {
        slots.set(key, { start: entry.startTime, end: entry.endTime });
      }
    });

    return Array.from(slots.values()).sort((a, b) =>
      a.start.localeCompare(b.start)
    );
  }, [timetable]);

  // Get entry for a specific day and time slot
  const getEntryForSlot = (day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    return timetable.entries.find(e =>
      e.dayOfWeek === day &&
      e.startTime === timeSlot.start &&
      e.endTime === timeSlot.end
    ) || null;
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Download timetable as PDF with minimal grid design
  const handleDownloadPDF = async () => {
    if (!timetable || timeSlots.length === 0) return;

    try {
      setDownloading(true);
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF('landscape', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      let yPos = margin;

      const blackColor = [0, 0, 0];
      const grayColor = [120, 120, 120];
      const headerBgColor = [245, 245, 245]; // Light gray for header

      // Header
      if (school) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.text(school.name, pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;

        if (school.campusName) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          pdf.text(school.campusName, pageWidth / 2, yPos, { align: 'center' });
          yPos += 5;
        }

        pdf.setFontSize(9);
        if (school.address) {
          pdf.text(school.address, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
        }

        if (school.phone) {
          pdf.text(`Phone: ${school.phone}`, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
        }
      }

      yPos += 4;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.text('WEEKLY TIMETABLE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 7;

      // Section/Class Info
      if (sectionData && classData) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${sectionData.name} - ${classData.name} ${classData.code ? `(${classData.code})` : ''}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      }

      yPos += 2;

      // Table setup - minimal grid design
      const timeColWidth = 30;
      const colWidth = (pageWidth - 2 * margin - timeColWidth) / 7;
      const rowHeight = 12;
      const headerHeight = 10;
      const cellPadding = 3;

      // Helper function to draw header on new page
      const drawTableHeader = (startY: number) => {
        // Time column header
        pdf.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
        pdf.rect(margin, startY, timeColWidth, headerHeight, 'F');
        pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, startY, timeColWidth, headerHeight, 'S');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.text('Time', margin + timeColWidth / 2, startY + headerHeight / 2 + 2, { align: 'center' });

        // Day headers
        DAYS_OF_WEEK.forEach((day, index) => {
          const xPos = margin + timeColWidth + (index * colWidth);
          pdf.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
          pdf.rect(xPos, startY, colWidth, headerHeight, 'F');
          pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
          pdf.setLineWidth(0.5);
          pdf.rect(xPos, startY, colWidth, headerHeight, 'S');
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
          pdf.text(day, xPos + colWidth / 2, startY + headerHeight / 2 + 2, { align: 'center' });
        });
      };

      // Draw table header
      drawTableHeader(yPos);
      yPos += headerHeight;

      // Draw header border
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);

      // Draw table rows
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      timeSlots.forEach((slot, slotIndex) => {
        // Check if we need a new page
        if (yPos + rowHeight > pageHeight - margin - 10) {
          pdf.addPage();
          yPos = margin;
          drawTableHeader(yPos);
          yPos += headerHeight;
          pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
        }

        // Time cell - white background with border
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin, yPos, timeColWidth, rowHeight, 'F');
        pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, yPos, timeColWidth, rowHeight, 'S');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.text(`${formatTime(slot.start)} - ${formatTime(slot.end)}`, margin + timeColWidth / 2, yPos + rowHeight / 2 + 2, { align: 'center' });

        // Day cells - minimal grid design
        DAYS_OF_WEEK.forEach((day, dayIndex) => {
          const xPos = margin + timeColWidth + (dayIndex * colWidth);
          const entry = getEntryForSlot(day, slot);

          // White background with border
          pdf.setFillColor(255, 255, 255);
          pdf.rect(xPos, yPos, colWidth, rowHeight, 'F');
          pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
          pdf.setLineWidth(0.5);
          pdf.rect(xPos, yPos, colWidth, rowHeight, 'S');

          if (entry) {
            let textY = yPos + 4;
            // Subject name - bold, larger
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
            const subjectName = getSubjectName(entry.subjectId);
            const maxWidth = colWidth - 2 * cellPadding;
            const subjectLines = pdf.splitTextToSize(subjectName, maxWidth);
            pdf.text(subjectLines[0], xPos + cellPadding, textY);
            textY += 4;

            // Teacher name - normal, smaller
            if (entry.teacherId) {
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
              const teacherName = getTeacherName(entry.teacherId) || '';
              const teacherLines = pdf.splitTextToSize(teacherName, maxWidth);
              if (textY + 3 < yPos + rowHeight) {
                pdf.text(teacherLines[0], xPos + cellPadding, textY);
                textY += 3.5;
              }
            }

            // Room - smallest
            if (entry.room && textY + 2.5 < yPos + rowHeight) {
              pdf.setFontSize(7.5);
              pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
              pdf.text(entry.room, xPos + cellPadding, textY);
            }
          }
        });

        yPos += rowHeight;
        pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
      });

      // Footer
      yPos = pageHeight - 12;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.text('This is a computer-generated timetable. No signature required.', pageWidth / 2, yPos, { align: 'center' });

      // Download PDF
      const sectionName = sectionData?.name || 'Section';
      const className = classData?.name || '';
      const fileName = `Timetable-${sectionName.replace(/[^a-zA-Z0-9]/g, '_')}${className ? `-${className.replace(/[^a-zA-Z0-9]/g, '_')}` : ''}.pdf`;
      pdf.save(fileName);

      setDownloading(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={ROUTES.ADMIN.TIMETABLES}>
              <Button variant="outline" size="sm" className="h-9">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">View Timetable</h1>
              <p className="text-sm text-gray-500 mt-1.5">
                {sectionData && classData
                  ? `${sectionData.name} • ${classData.name} ${classData.code ? `(${classData.code})` : ''}`
                  : sectionData
                    ? `${sectionData.name} • Section Timetable`
                    : 'Section Timetable'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading || timeSlots.length === 0}
              variant="outline"
              className="h-9"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Link href={ROUTES.ADMIN.TIMETABLES_EDIT(timetable.id)}>
              <Button className="h-9 bg-[#10b981] hover:bg-[#059669]">
                <Edit className="w-4 h-4 mr-2" />
                Edit Timetable
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="text-xs text-gray-500 mt-0.5">Complete timetable for the selected section</p>
        </div>

        {timeSlots.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No timetable entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                      Time
                    </th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day} className="min-w-[140px] px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                        {day.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, slotIndex) => (
                    <tr key={slotIndex} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-2 py-2 text-xs font-medium text-gray-600 bg-gray-50/50 w-32">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[11px]">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                          </div>
                        </div>
                      </td>
                      {DAYS_OF_WEEK.map(day => {
                        const entry = getEntryForSlot(day, slot);

                        return (
                          <td key={day} className="px-2 py-2 align-top">
                            {entry ? (
                              <div className="w-full min-h-[80px] p-2.5 border-2 border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                                <div className="text-left h-full flex flex-col justify-between overflow-hidden">
                                  <div className="flex-shrink-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <BookOpen className="w-3 h-3 text-[#10b981] flex-shrink-0" />
                                      <span className="text-xs font-semibold text-gray-900 truncate">
                                        {getSubjectName(entry.subjectId)}
                                      </span>
                                    </div>
                                    {entry.teacherId && (
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                        <span className="text-[10px] text-gray-600 truncate">
                                          {getTeacherName(entry.teacherId)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0 mt-auto">
                                    {entry.room && (
                                      <div className="flex items-center gap-1 mb-0">
                                        <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-[10px] text-gray-500 truncate">
                                          {entry.room}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full min-h-[80px] p-2.5 border-2 border-dashed border-gray-200 rounded-lg bg-white">
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{timetable.entries.length}</p>
            </div>
            <div className="w-10 h-10 min-w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(timetable.entries.map(e => e.subjectId)).size}
              </p>
            </div>
            <div className="w-10 h-10 min-w-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-slate-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Active Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(timetable.entries.map(e => e.dayOfWeek)).size}
              </p>
            </div>
            <div className="w-10 h-10 min-w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Teachers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(timetable.entries.filter(e => e.teacherId).map(e => e.teacherId)).size}
              </p>
            </div>
            <div className="w-10 h-10 min-w-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
