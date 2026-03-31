'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Edit, Check, X, Clipboard, PlusCircle, BookOpen, User, MapPin, Copy, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/use-alert';
import { ROUTES } from '@/constants/routes';
import { updateTimetable } from '@/actions/timetables';
import type { Timetable, TimetableEntry, DayOfWeek, Class, Section, Subject, Teacher } from '@/types';

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface EditTimetableClientProps {
  timetable: Timetable;
  initialClasses: Class[];
  initialSections: Section[];
  initialSubjects: Subject[];
  initialTeachers: Teacher[];
  allTimetables: Timetable[];
}

export default function EditTimetableClient({
  timetable,
  initialClasses,
  initialSections,
  initialSubjects,
  initialTeachers,
  allTimetables,
}: EditTimetableClientProps) {
  const router = useRouter();
  const { showError, showSuccess, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(false);
  const [sectionId, setSectionId] = useState(timetable.sectionId);
  const [entries, setEntries] = useState<Omit<TimetableEntry, 'id'>[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{ day: DayOfWeek; timeSlot: { start: string; end: string }; entryIndex: number } | null>(null);
  const [originalEntry, setOriginalEntry] = useState<Omit<TimetableEntry, 'id'> | null>(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState<number | null>(null);
  const [originalTimeSlots, setOriginalTimeSlots] = useState<{ start: string; end: string }[] | null>(null);
  const [draggedEntry, setDraggedEntry] = useState<{ day: DayOfWeek; timeSlot: { start: string; end: string }; entry: Omit<TimetableEntry, 'id'> } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: DayOfWeek; timeSlot: { start: string; end: string } } | null>(null);
  const [copiedEntry, setCopiedEntry] = useState<Omit<TimetableEntry, 'id'> | null>(null);
  const [timeDuration, setTimeDuration] = useState<number>(30);
  const [numberOfRows, setNumberOfRows] = useState<number>(4);
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string }[]>([]);

  const classes = initialClasses;
  const sections = initialSections;
  const subjects = initialSubjects;
  const teachers = initialTeachers.filter(t => t.isActive);

  const schoolSections = sections.filter(s => s.isActive);
  const schoolTeachers = teachers;

  const selectedSection = sections.find(s => s.id === sectionId);
  const sectionClassId = selectedSection?.classId || '';

  const classSubjects = sectionClassId 
    ? subjects.filter(s => s.classId === sectionClassId)
    : [];

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : 'Unknown Section';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : '';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : '';
  };

  // Generate time slots based on duration and number of rows
  const generateTimeSlots = (startTime: string, duration: number, count: number) => {
    const slots: { start: string; end: string }[] = [];
    let [currentHour, currentMin] = startTime.split(':').map(Number);
    
    for (let i = 0; i < count; i++) {
      const start = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      let endHour = currentHour;
      let endMin = currentMin + duration;
      if (endMin >= 60) {
        endHour += Math.floor(endMin / 60);
        endMin = endMin % 60;
      }
      
      const end = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      slots.push({ start, end });
      
      // Move to next slot start time
      currentHour = endHour;
      currentMin = endMin;
    }
    
    return slots;
  };

  // Load timetable data on mount
  useEffect(() => {
    if (timetable) {
      setSectionId(timetable.sectionId);
      setEntries(timetable.entries.map(entry => ({
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId || '',
        room: entry.room || '',
      })));

      // Extract unique time slots from entries
      const uniqueSlots = new Map<string, { start: string; end: string }>();
      timetable.entries.forEach(entry => {
        const key = `${entry.startTime}-${entry.endTime}`;
        if (!uniqueSlots.has(key)) {
          uniqueSlots.set(key, { start: entry.startTime, end: entry.endTime });
        }
      });
      
      const sortedSlots = Array.from(uniqueSlots.values()).sort((a, b) => 
        a.start.localeCompare(b.start)
      );
      
      if (sortedSlots.length > 0) {
        setTimeSlots(sortedSlots);
        // Calculate duration from first slot
        const [startHour, startMin] = sortedSlots[0].start.split(':').map(Number);
        const [endHour, endMin] = sortedSlots[0].end.split(':').map(Number);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        setTimeDuration(duration > 0 ? duration : 30);
        setNumberOfRows(sortedSlots.length);
      } else {
        // Default slots if no entries
        setTimeSlots(generateTimeSlots('08:00', 30, 4));
      }
    }
  }, [timetable]);

  // Update time slots when duration or number of rows changes
  // Be careful not to fight with the initial load effect
  useEffect(() => {
    // Only running this logic if we have timeSlots loaded (which happens in first effect)
    // checking if entries match current slots is tricky.
    // Let's simplify: if user changes duration or rows, we regenerate.
    // We should only regenerate if user explicitly changes controls.
    // But 'useEffect' runs on mount too.
    // We can rely on 'timeSlots' being set.
    // The issue is that the first effect sets timeSlots based on data.
    // This effect might overwrite it if defaults (30, 4) are different from data.
    // We should only use this effect if we are NOT in initial load phase?
    // Actually, we can check if current timeSlots match the generated ones.
    // Simplest approach: don't run this effect on first render?
    // Or, make sure state variables (duration, rows) are synchronized with loaded data in the first effect.
    // I did setTimeDuration and setNumberOfRows in first effect.
    // So this effect will run again.
    
    // To solve this, we can rely on user interaction to trigger regeneration,
    // or just checking if timeSlots needs update.
    // For now, let's just let it run, as it should generate same slots if duration/rows match.
    if (sectionId && timeSlots.length > 0) { // Ensure we have loaded data first
       // This is imperfect but 'generateTimeSlots' is deterministic.
       // However, if the existing timetable has irregular slots, they might be overwritten.
       // The original code had this issue too potentially, or 'useMemo' logic.
       // Original code:
       // useEffect(() => { if (sectionId && timeSlots.length > 0) ... }, [timeDuration, numberOfRows, sectionId]);
       // so it depends on those values.
    }
  }, [timeDuration, numberOfRows, sectionId]); 
  
  // Actually, better to remove this effect side-effect on entries and just use a function 'handleGridSettingChange' passed to the Selects.
  // But to stick to original logic:
  const handleGridConfigChange = (newDuration?: number, newRows?: number) => {
    const d = newDuration ?? timeDuration;
    const r = newRows ?? numberOfRows;
    if (newDuration) setTimeDuration(newDuration);
    if (newRows) setNumberOfRows(newRows);
    
    // Regenerate
    const newSlots = generateTimeSlots('08:00', d, r);
    setTimeSlots(newSlots);
    
    // Adjust entries
    setEntries(prevEntries => {
      return prevEntries
        .map(entry => {
          const matchingSlot = newSlots.find(s => 
            entry.startTime === s.start && entry.endTime === s.end
          );
          if (matchingSlot) {
            return entry;
          }
          return null;
        })
        .filter((entry): entry is Omit<TimetableEntry, 'id'> => entry !== null);
    });
  };

  // Get entry for a specific day and time slot
  const getEntryForSlot = (day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    return entries.findIndex(e => 
      e.dayOfWeek === day && 
      e.startTime === timeSlot.start && 
      e.endTime === timeSlot.end
    );
  };

  // Get entry data for a slot
  const getEntryData = (day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    const index = getEntryForSlot(day, timeSlot);
    if (index >= 0) {
      return { ...entries[index], index };
    }
    return {
      dayOfWeek: day,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      subjectId: '',
      teacherId: '',
      room: '',
      index: -1,
    };
  };

  // Update entry
  const updateEntry = (index: number, field: keyof TimetableEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  // Add or update entry for a time slot
  const saveEntryForSlot = (day: DayOfWeek, timeSlot: { start: string; end: string }, entry: Omit<TimetableEntry, 'id'>) => {
    const existingIndex = getEntryForSlot(day, timeSlot);
    if (existingIndex >= 0) {
      const updated = [...entries];
      updated[existingIndex] = entry;
      setEntries(updated);
    } else {
      setEntries([...entries, entry]);
    }
    setEditingCell(null);
    setOriginalEntry(null);
  };

  // Remove entry for a time slot
  const removeEntryForSlot = (day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    const index = getEntryForSlot(day, timeSlot);
    if (index >= 0) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...timeSlots];
    const oldSlot = timeSlots[index];
    updated[index] = { ...updated[index], [field]: value };
    const newSlot = updated[index];
    
    if (field === 'end' && index < timeSlots.length - 1) {
      updated[index + 1] = {
        ...updated[index + 1],
        start: newSlot.end,
      };
    }
    
    if (field === 'start' && index > 0) {
      updated[index - 1] = {
        ...updated[index - 1],
        end: newSlot.start,
      };
    }
    
    const updatedEntries = entries.map(entry => {
      if (entry.startTime === oldSlot.start && entry.endTime === oldSlot.end) {
        return {
          ...entry,
          startTime: newSlot.start,
          endTime: newSlot.end,
        };
      }
      if (field === 'end' && index < timeSlots.length - 1) {
        const nextOldSlot = timeSlots[index + 1];
        if (entry.startTime === nextOldSlot.start && entry.endTime === nextOldSlot.end) {
          return {
            ...entry,
            startTime: updated[index + 1].start,
            endTime: updated[index + 1].end,
          };
        }
      }
      if (field === 'start' && index > 0) {
        const prevOldSlot = timeSlots[index - 1];
        if (entry.startTime === prevOldSlot.start && entry.endTime === prevOldSlot.end) {
          return {
            ...entry,
            startTime: updated[index - 1].start,
            endTime: updated[index - 1].end,
          };
        }
      }
      return entry;
    });
    
    setTimeSlots(updated);
    setEntries(updatedEntries);
  };

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const [lastHour, lastMin] = lastSlot.end.split(':').map(Number);
    let newHour = lastHour;
    let newMin = lastMin + timeDuration;
    if (newMin >= 60) {
      newHour += Math.floor(newMin / 60);
      newMin = newMin % 60;
    }
    const newStart = `${String(lastHour).padStart(2, '0')}:${String(lastMin).padStart(2, '0')}`;
    const newEnd = `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
    setTimeSlots([...timeSlots, { start: newStart, end: newEnd }]);
  };

  const removeTimeSlot = (index: number) => {
    const slot = timeSlots[index];
    const filtered = entries.filter(e => 
      !(e.startTime === slot.start && e.endTime === slot.end)
    );
    setEntries(filtered);
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const doTimeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    return start1Min < end2Min && start2Min < end1Min;
  };

  const getAvailableTeachers = (day: DayOfWeek, startTime: string, endTime: string, excludeIndex?: number) => {
    if (!day || !startTime || !endTime) {
      return schoolTeachers;
    }

    const conflictingTeacherIds = new Set<string>();

    allTimetables.forEach(t => {
      if (t.id === timetable.id) return; // Skip current timetable
      t.entries.forEach(entry => {
        if (
          entry.dayOfWeek === day &&
          entry.teacherId &&
          doTimeRangesOverlap(entry.startTime, entry.endTime, startTime, endTime)
        ) {
          conflictingTeacherIds.add(entry.teacherId);
        }
      });
    });

    entries.forEach((entry, index) => {
      if (
        index !== excludeIndex &&
        entry.dayOfWeek === day &&
        entry.teacherId &&
        doTimeRangesOverlap(entry.startTime, entry.endTime, startTime, endTime)
      ) {
        conflictingTeacherIds.add(entry.teacherId);
      }
    });

    return schoolTeachers.filter(teacher => !conflictingTeacherIds.has(teacher.id));
  };

  const isTeacherAvailable = (teacherId: string, day: DayOfWeek, startTime: string, endTime: string, excludeEntryIndex?: number) => {
    if (!teacherId || !day || !startTime || !endTime) return true;

    for (const t of allTimetables) {
      if (t.id === timetable.id) continue;
      for (const entry of t.entries) {
        if (
          entry.dayOfWeek === day &&
          entry.teacherId === teacherId &&
          doTimeRangesOverlap(entry.startTime, entry.endTime, startTime, endTime)
        ) {
          return false;
        }
      }
    }

    for (let i = 0; i < entries.length; i++) {
      if (i === excludeEntryIndex) continue;
      const entry = entries[i];
      if (
        entry.dayOfWeek === day &&
        entry.teacherId === teacherId &&
        doTimeRangesOverlap(entry.startTime, entry.endTime, startTime, endTime)
      ) {
        return false;
      }
    }

    return true;
  };

  const isValidDropTarget = (day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    if (!draggedEntry) return false;
    
    if (draggedEntry.day === day && 
        draggedEntry.timeSlot.start === timeSlot.start && 
        draggedEntry.timeSlot.end === timeSlot.end) {
      return false;
    }

    if (draggedEntry.entry.teacherId) {
      const entryIndex = getEntryForSlot(draggedEntry.day, draggedEntry.timeSlot);
      return isTeacherAvailable(draggedEntry.entry.teacherId, day, timeSlot.start, timeSlot.end, entryIndex);
    }

    return true;
  };

  const handleDragStart = (e: React.DragEvent, day: DayOfWeek, timeSlot: { start: string; end: string }, entry: Omit<TimetableEntry, 'id'>) => {
    setDraggedEntry({ day, timeSlot, entry });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragEnd = () => {
    setDraggedEntry(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isValidDropTarget(day, timeSlot) ? 'move' : 'none';
    setDragOverCell({ day, timeSlot });
  };

  const handleDrop = (e: React.DragEvent, day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    e.preventDefault();
    
    if (!draggedEntry) return;

    if (!isValidDropTarget(day, timeSlot)) {
      setDraggedEntry(null);
      setDragOverCell(null);
      return;
    }

    const originalIndex = getEntryForSlot(draggedEntry.day, draggedEntry.timeSlot);
    
    if (originalIndex >= 0) {
      // Filter out existing from target slot if simpler logic (overwrite) is desired.
      // But we just append new entry location.
      
      const updatedEntries = entries.filter((_, i) => i !== originalIndex);
      
      // Also remove any entry that exists at target location to overwrite
      const filteredEntries = updatedEntries.filter(e => 
         !(e.dayOfWeek === day && e.startTime === timeSlot.start && e.endTime === timeSlot.end)
      );

      const newEntry: Omit<TimetableEntry, 'id'> = {
        ...draggedEntry.entry,
        dayOfWeek: day,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
      };
      
      setEntries([...filteredEntries, newEntry]);
    }

    setDraggedEntry(null);
    setDragOverCell(null);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleCopy = (e: React.MouseEvent, entry: Omit<TimetableEntry, 'id'>) => {
    e.stopPropagation();
    setCopiedEntry({ ...entry });
  };

  const handlePaste = (day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    if (!copiedEntry) return;

    if (copiedEntry.teacherId && !isTeacherAvailable(copiedEntry.teacherId, day, timeSlot.start, timeSlot.end)) {
      return;
    }

    const existingIndex = getEntryForSlot(day, timeSlot);
    
    if (existingIndex >= 0) {
      const updated = [...entries];
      updated[existingIndex] = {
        ...copiedEntry,
        dayOfWeek: day,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
      };
      setEntries(updated);
    } else {
      setEntries([...entries, {
        ...copiedEntry,
        dayOfWeek: day,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
      }]);
    }
  };

  const canPaste = (day: DayOfWeek, timeSlot: { start: string; end: string }) => {
    if (!copiedEntry) return false;
    
    if (copiedEntry.teacherId) {
      return isTeacherAvailable(copiedEntry.teacherId, day, timeSlot.start, timeSlot.end);
    }
    
    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!sectionId) {
      newErrors.sectionId = 'Please select a section';
    }

    if (entries.length === 0) {
      newErrors.entries = 'Please add at least one timetable entry';
    }

    entries.forEach((entry, index) => {
      if (!entry.subjectId) {
        newErrors[`entry-${index}-subject`] = 'Subject is required';
      }
      if (!entry.teacherId) {
        newErrors[`entry-${index}-teacher`] = 'Teacher is required';
      }
      if (!entry.startTime || !entry.endTime) {
        newErrors[`entry-${index}-time`] = 'Start and end times are required';
      } else if (entry.startTime >= entry.endTime) {
        newErrors[`entry-${index}-time`] = 'End time must be after start time';
      } else {
        const hasOverlap = entries.some((e, i) => 
          i !== index &&
          e.dayOfWeek === entry.dayOfWeek &&
          doTimeRangesOverlap(e.startTime, e.endTime, entry.startTime, entry.endTime)
        );
        if (hasOverlap) {
          newErrors[`entry-${index}-time`] = 'This time slot overlaps with another entry';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const timetableEntries: TimetableEntry[] = entries.map(entry => ({
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dayOfWeek: entry.dayOfWeek.toUpperCase() as DayOfWeek, // Convert Monday -> MONDAY for backend
        startTime: entry.startTime,
        endTime: entry.endTime,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId || undefined,
        room: entry.room || undefined,
      }));

      const updates = {
        sectionId,
        entries: timetableEntries,
      };

      const result = await updateTimetable(timetable.id, updates);

      if (result.success) {
        showSuccess('Timetable updated successfully');
      } else {
        showError(result.error || 'Failed to update timetable');
      }
    } catch (error) {
      console.error('Error updating timetable:', error);
      showError('Failed to update timetable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Edit Timetable</h1>
        <p className="text-sm text-gray-500 mt-1.5">Update the weekly schedule using the grid below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label htmlFor="sectionId" className="block text-sm font-medium text-gray-900 mb-3">
            Section
          </label>
          <select
            id="sectionId"
            required
            value={sectionId}
            onChange={(e) => {
              // Should not happen as disabled
              setSectionId(e.target.value);
            }}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            disabled
          >
            <option value="">{getSectionName(sectionId)}</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">Section cannot be changed after creation</p>
        </div>

        {sectionId && classSubjects.length === 0 && (
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              No subjects found for this class. Add subjects first.
            </p>
          </div>
        )}

        {/* Timetable Grid */}
        {sectionId && classSubjects.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900">Weekly Schedule</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click on a cell to add or edit a class, click time to edit time slot</p>
            </div>

            {/* Schedule Options */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Time Duration (minutes)
                  </label>
                  <select
                    value={timeDuration}
                    onChange={(e) => handleGridConfigChange(Number(e.target.value), undefined)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">Duration for each time slot</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Number of Rows
                  </label>
                  <select
                    value={numberOfRows}
                    onChange={(e) => handleGridConfigChange(undefined, Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981]"
                  >
                    <option value={4}>4 rows</option>
                    <option value={6}>6 rows</option>
                    <option value={8}>8 rows</option>
                    <option value={10}>10 rows</option>
                    <option value={12}>12 rows</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">Total number of time slots</p>
                </div>
              </div>
            </div>

            {errors.entries && (
              <p className="text-xs text-red-600 mb-4">{errors.entries}</p>
            )}

            {/* Copy Status Indicator */}
            {copiedEntry && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-blue-900">
                      Class copied: {getSubjectName(copiedEntry.subjectId)} - {getTeacherName(copiedEntry.teacherId || '')}
                    </p>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      Click on any empty cell to paste (conflicts will be highlighted)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCopiedEntry(null)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  title="Clear copy"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="overflow-x-auto min-h-[500px]">
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
                          {editingTimeSlot === slotIndex ? (
                            <div className="space-y-1.5">
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[9px] font-medium text-gray-600 mb-0.5">Start</label>
                                  <input
                                    type="time"
                                    value={slot.start}
                                    onChange={(e) => updateTimeSlot(slotIndex, 'start', e.target.value)}
                                    className="w-full px-1.5 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-medium text-gray-600 mb-0.5">End</label>
                                  <input
                                    type="time"
                                    value={slot.end}
                                    onChange={(e) => updateTimeSlot(slotIndex, 'end', e.target.value)}
                                    className="w-full px-1.5 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTimeSlot(null);
                                    setOriginalTimeSlots(null);
                                  }}
                                  className="flex-1 px-1.5 py-1 bg-[#10b981] text-white rounded hover:bg-[#059669] flex items-center justify-center"
                                  title="Save"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (originalTimeSlots) {
                                      setTimeSlots([...originalTimeSlots]);
                                      setEntries(prevEntries => {
                                        return prevEntries.filter(entry => {
                                          return originalTimeSlots.some(slot =>
                                            entry.startTime === slot.start && entry.endTime === slot.end
                                          );
                                        });
                                      });
                                    }
                                    setEditingTimeSlot(null);
                                    setOriginalTimeSlots(null);
                                  }}
                                  className="px-1.5 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center justify-center"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-[11px]">
                                  {formatTime(slot.start)} - {formatTime(slot.end)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOriginalTimeSlots([...timeSlots]);
                                    setEditingTimeSlot(slotIndex);
                                  }}
                                  className="p-1 text-gray-400 hover:text-[#10b981] hover:bg-[#10b981]/10 rounded transition-colors"
                                  title="Edit time"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                {timeSlots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(slotIndex)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete time slot"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        {DAYS_OF_WEEK.map(day => {
                          const entryData = getEntryData(day, slot);
                          const isEditing = editingCell?.day === day && 
                            editingCell?.timeSlot.start === slot.start && 
                            editingCell?.timeSlot.end === slot.end;
                          const hasEntry = entryData.index >= 0;

                          return (
                            <td key={day} className="px-2 py-2 align-top relative">
                              {isEditing ? (
                                <div className="absolute left-2 right-2 top-2 z-50 p-3 border-2 border-[#10b981] rounded-lg bg-white shadow-lg space-y-2.5 min-w-[200px] max-w-[280px]">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>
                                      <span className="text-[10px] font-semibold text-gray-700">Add Class</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (originalEntry) {
                                          const existingIndex = getEntryForSlot(day, slot);
                                          if (existingIndex >= 0) {
                                            const updated = [...entries];
                                            updated[existingIndex] = originalEntry;
                                            setEntries(updated);
                                          } else {
                                            setEntries([...entries, originalEntry]);
                                          }
                                        } else if (hasEntry) {
                                          removeEntryForSlot(day, slot);
                                        }
                                        setEditingCell(null);
                                        setOriginalEntry(null);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-gray-700 mb-1.5">
                                        <BookOpen className="w-3 h-3 text-gray-400" />
                                        Subject <span className="text-red-500">*</span>
                                      </label>
                                      <select
                                        value={entryData.subjectId}
                                        onChange={(e) => {
                                          if (entryData.index >= 0) {
                                            updateEntry(entryData.index, 'subjectId', e.target.value);
                                          }
                                        }}
                                        className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-colors"
                                        autoFocus
                                      >
                                        <option value="">Choose subject</option>
                                        {classSubjects.map(s => (
                                          <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-gray-700 mb-1.5">
                                        <User className="w-3 h-3 text-gray-400" />
                                        Teacher <span className="text-red-500">*</span>
                                      </label>
                                      <select
                                        value={entryData.teacherId || ''}
                                        onChange={(e) => {
                                          if (entryData.index >= 0) {
                                            updateEntry(entryData.index, 'teacherId', e.target.value);
                                          }
                                        }}
                                        className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-colors"
                                        required
                                      >
                                        <option value="">Choose teacher</option>
                                        {getAvailableTeachers(day, slot.start, slot.end, entryData.index).map(t => (
                                          <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-gray-700 mb-1.5">
                                        <MapPin className="w-3 h-3 text-gray-400" />
                                        Room
                                      </label>
                                      <input
                                        type="text"
                                        value={entryData.room || ''}
                                        onChange={(e) => {
                                          if (entryData.index >= 0) {
                                            updateEntry(entryData.index, 'room', e.target.value);
                                          }
                                        }}
                                        className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-colors"
                                        placeholder="e.g., Room 101"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    {hasEntry && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          removeEntryForSlot(day, slot);
                                          setEditingCell(null);
                                          setOriginalEntry(null);
                                        }}
                                        className="h-8 px-3 text-xs font-medium border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Delete
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        if (entryData.subjectId && entryData.teacherId) {
                                          saveEntryForSlot(day, slot, {
                                            dayOfWeek: day,
                                            startTime: slot.start,
                                            endTime: slot.end,
                                            subjectId: entryData.subjectId,
                                            teacherId: entryData.teacherId,
                                            room: entryData.room || '',
                                          });
                                        }
                                      }}
                                      disabled={!entryData.subjectId || !entryData.teacherId}
                                      className={`h-8 text-xs font-medium bg-[#10b981] hover:bg-[#059669] text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors ${hasEntry ? 'flex-1' : 'w-full'}`}
                                    >
                                      <Save className="w-3.5 h-3.5 mr-1.5" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  draggable={hasEntry}
                                  onDragStart={(e) => hasEntry && handleDragStart(e, day, slot, entryData)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleDragOver(e, day, slot)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, day, slot)}
                                  className={`w-full min-h-[80px] transition-all ${
                                    draggedEntry && draggedEntry.day === day && draggedEntry.timeSlot.start === slot.start && draggedEntry.timeSlot.end === slot.end
                                      ? 'opacity-50'
                                      : ''
                                  }`}
                                >
                                  {hasEntry ? (
                                    <div className="relative group h-full">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const data = getEntryData(day, slot);
                                          if (data.index >= 0) {
                                            setOriginalEntry({ ...entries[data.index] });
                                            setEditingCell({ day, timeSlot: slot, entryIndex: data.index });
                                          }
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, day, slot, entryData)}
                                        onDragEnd={handleDragEnd}
                                        className={`w-full h-full min-h-[80px] p-2.5 border-2 border-dashed rounded-lg transition-all cursor-pointer overflow-hidden ${
                                          dragOverCell?.day === day && dragOverCell?.timeSlot.start === slot.start && dragOverCell?.timeSlot.end === slot.end
                                            ? isValidDropTarget(day, slot)
                                              ? 'border-[#10b981] bg-[#10b981]/10 shadow-lg scale-105'
                                              : 'border-red-300 bg-red-50/50 opacity-50'
                                            : draggedEntry && !isValidDropTarget(day, slot) && dragOverCell?.day === day && dragOverCell?.timeSlot.start === slot.start
                                              ? 'border-gray-200 bg-gray-100 opacity-40'
                                              : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-[#10b981] hover:shadow-md hover:scale-[1.02]'
                                        }`}
                                      >
                                        <div className="text-left h-full flex flex-col justify-between overflow-hidden">
                                          <div className="flex-shrink-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                              <BookOpen className="w-3 h-3 text-[#10b981] flex-shrink-0" />
                                              <span className="text-xs font-semibold text-gray-900 truncate">
                                                {getSubjectName(entryData.subjectId)}
                                              </span>
                                            </div>
                                            {entryData.teacherId && (
                                              <div className="flex items-center gap-1.5 mb-1">
                                                <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                                <span className="text-[10px] text-gray-600 truncate">
                                                  {getTeacherName(entryData.teacherId)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-shrink-0 mt-auto">
                                            {entryData.room && (
                                              <div className="flex items-center gap-1 mb-0">
                                                <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                                <span className="text-[10px] text-gray-500 truncate">
                                                  {entryData.room}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                                            <span className="text-[8px] text-[#10b981] font-medium text-center bg-transparent px-1.5 py-0.5 rounded whitespace-nowrap">Drag to move or click to edit</span>
                                          </div>
                                        </div>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleCopy(e, entryData)}
                                        className="absolute top-1 right-1 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm opacity-0 group-hover:opacity-100 hover:bg-gray-50 hover:border-[#10b981] transition-all z-10"
                                        title="Copy class"
                                      >
                                        <Copy className="w-3 h-3 text-gray-600 hover:text-[#10b981]" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (copiedEntry && canPaste(day, slot)) {
                                          handlePaste(day, slot);
                                          return;
                                        }
                                        
                                        const data = getEntryData(day, slot);
                                        if (data.index >= 0) {
                                          setOriginalEntry({ ...entries[data.index] });
                                          setEditingCell({ day, timeSlot: slot, entryIndex: data.index });
                                        } else {
                                          setOriginalEntry(null);
                                          setEntries([...entries, {
                                            dayOfWeek: day,
                                            startTime: slot.start,
                                            endTime: slot.end,
                                            subjectId: '',
                                            teacherId: '',
                                            room: '',
                                          }]);
                                          const newIndex = entries.length;
                                          setEditingCell({ day, timeSlot: slot, entryIndex: newIndex });
                                        }
                                      }}
                                      onDragOver={(e) => handleDragOver(e, day, slot)}
                                      onDragLeave={handleDragLeave}
                                      onDrop={(e) => handleDrop(e, day, slot)}
                                      className={`w-full min-h-[80px] p-2.5 border-2 border-dashed rounded-lg transition-all group relative overflow-hidden cursor-pointer ${
                                        dragOverCell?.day === day && dragOverCell?.timeSlot.start === slot.start && dragOverCell?.timeSlot.end === slot.end
                                          ? isValidDropTarget(day, slot)
                                            ? 'border-[#10b981] bg-[#10b981]/10 shadow-lg scale-105'
                                            : 'border-red-300 bg-red-50/50'
                                          : copiedEntry && canPaste(day, slot)
                                            ? 'border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                                            : copiedEntry && !canPaste(day, slot)
                                              ? 'border-gray-200 bg-gray-100 opacity-40'
                                              : draggedEntry && !isValidDropTarget(day, slot)
                                                ? 'border-gray-200 bg-gray-100 opacity-40'
                                                : 'border-gray-200 bg-white hover:border-[#10b981] hover:bg-gradient-to-br hover:from-[#10b981]/5 hover:to-white hover:shadow-md hover:scale-[1.02]'
                                      }`}
                                    >
                                      {copiedEntry && (
                                        <div className="absolute top-1 right-1 p-1 bg-blue-500 text-white rounded-full shadow-sm">
                                          <Clipboard className="w-2.5 h-2.5" />
                                        </div>
                                      )}
                                      <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-[#10b981] transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#10b981]/10 flex items-center justify-center mb-1.5 transition-colors">
                                          {copiedEntry && canPaste(day, slot) ? (
                                            <Clipboard className="w-4 h-4 text-blue-500" />
                                          ) : (
                                            <PlusCircle className="w-4 h-4" />
                                          )}
                                        </div>
                                        <span className="text-[10px] font-medium">
                                          {draggedEntry 
                                            ? 'Drop here' 
                                            : copiedEntry && canPaste(day, slot)
                                              ? 'Click to paste'
                                              : copiedEntry
                                                ? 'Cannot paste (conflict)'
                                                : 'Add class'}
                                        </span>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Add Time Slot Row */}
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-4 bg-gray-50/50">
                        <button
                          type="button"
                          onClick={addTimeSlot}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#10b981] hover:text-[#10b981] hover:bg-[#10b981]/5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Time Slot
                        </button>
                      </td>
                      {DAYS_OF_WEEK.map(day => (
                        <td key={day} className="px-2 py-2"></td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.ADMIN.TIMETABLES)}
            disabled={loading}
            className="h-10 px-4 text-sm border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || entries.length === 0}
            className="h-10 px-6 text-sm bg-[#10b981] hover:bg-[#059669] text-white"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <AlertComponent />
    </div>
  );
}
