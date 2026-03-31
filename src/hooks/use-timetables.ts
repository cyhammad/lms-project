import { useState, useEffect } from 'react';
import type { Timetable } from '@/types';
import { 
  getTimetables, 
  addTimetable, 
  updateTimetable, 
  deleteTimetable as deleteTimetableStorage 
} from '@/lib/timetable-storage';

export function useTimetables() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimetables = () => {
      try {
        const data = getTimetables();
        setTimetables(data);
      } catch (error) {
        console.error('Error loading timetables:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimetables();
  }, []);

  const createTimetable = (timetableData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTimetable = addTimetable(timetableData);
    setTimetables(prev => [...prev, newTimetable]);
    return newTimetable;
  };

  const updateTimetableById = (id: string, updates: Partial<Timetable>) => {
    const updated = updateTimetable(id, updates);
    if (updated) {
      setTimetables(prev => prev.map(t => t.id === id ? updated : t));
    }
    return updated;
  };

  const deleteTimetable = (id: string) => {
    const success = deleteTimetableStorage(id);
    if (success) {
      setTimetables(prev => prev.filter(t => t.id !== id));
    }
    return success;
  };

  return {
    timetables,
    loading,
    createTimetable,
    updateTimetableById,
    deleteTimetable,
  };
}
