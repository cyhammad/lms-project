'use client';

import { useState } from 'react';
import { Clock, Calendar, Save, Edit, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateSchoolSettings } from '@/actions/schools';
import type { School } from '@/types';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

interface SchoolSettingsCardProps {
  school: School;
  onUpdate: (updated: Partial<School>) => void;
}

export function SchoolSettingsCard({ school, onUpdate }: SchoolSettingsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [workingDays, setWorkingDays] = useState<string[]>(
    school.workingDays && school.workingDays.length > 0
      ? school.workingDays
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  );
  const [schoolStartTime, setSchoolStartTime] = useState(school.schoolStartTime || '08:00');
  const [schoolEndTime, setSchoolEndTime] = useState(school.schoolEndTime || '14:00');
  const [periodDurationMins, setPeriodDurationMins] = useState(
    school.periodDurationMins?.toString() || '45'
  );
  const [lunchStartTime, setLunchStartTime] = useState(school.lunchStartTime || '12:00');
  const [lunchEndTime, setLunchEndTime] = useState(school.lunchEndTime || '12:45');
  const [hasLunchBreak, setHasLunchBreak] = useState(
    !!(school.lunchStartTime && school.lunchEndTime)
  );

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleDiscard = () => {
    setWorkingDays(
      school.workingDays && school.workingDays.length > 0
        ? school.workingDays
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    );
    setSchoolStartTime(school.schoolStartTime || '08:00');
    setSchoolEndTime(school.schoolEndTime || '14:00');
    setPeriodDurationMins(school.periodDurationMins?.toString() || '45');
    setLunchStartTime(school.lunchStartTime || '12:00');
    setLunchEndTime(school.lunchEndTime || '12:45');
    setHasLunchBreak(!!(school.lunchStartTime && school.lunchEndTime));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (workingDays.length === 0) {
      toast.error('Please select at least one working day.');
      return;
    }
    setLoading(true);
    try {
      const result = await updateSchoolSettings(school.id, {
        workingDays,
        schoolStartTime,
        schoolEndTime,
        periodDurationMins: periodDurationMins ? parseInt(periodDurationMins) : undefined,
        lunchStartTime: hasLunchBreak ? lunchStartTime : null,
        lunchEndTime: hasLunchBreak ? lunchEndTime : null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('School settings saved successfully!');
        onUpdate({
          workingDays,
          schoolStartTime,
          schoolEndTime,
          periodDurationMins: periodDurationMins ? parseInt(periodDurationMins) : undefined,
          lunchStartTime: hasLunchBreak ? lunchStartTime : undefined,
          lunchEndTime: hasLunchBreak ? lunchEndTime : undefined,
        });
        setIsEditing(false);
      }
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayDays = school.workingDays && school.workingDays.length > 0
    ? school.workingDays
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <Card className="border-slate-200 shadow-sm rounded-[18px]">
      <CardHeader className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-slate-800" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">School Operations</CardTitle>
              <p className="text-xs text-slate-700 mt-0.5">Working days, school hours & period settings</p>
            </div>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="rounded-lg text-xs font-semibold h-8 px-3"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="text-slate-700 text-xs font-semibold h-8 px-3"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold h-8 px-4 rounded-lg"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {loading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-7">
        {/* Working Days */}
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Working Days
          </p>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map(day => {
                const active = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${active
                      ? 'bg-slate-700 border-slate-700 text-white shadow-sm shadow-slate-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    {active
                      ? <CheckSquare className="w-3.5 h-3.5" />
                      : <Square className="w-3.5 h-3.5" />
                    }
                    {DAY_SHORT[day]}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map(day => {
                const active = displayDays.includes(day);
                return (
                  <span
                    key={day}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold border ${active
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-slate-50 border-slate-100 text-slate-300'
                      }`}
                  >
                    {DAY_SHORT[day]}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* School Hours */}
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            School Hours
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TimeField
              label="Start Time"
              value={schoolStartTime}
              editing={isEditing}
              onChange={setSchoolStartTime}
              icon={<Clock className="w-4 h-4 text-slate-700" />}
            />
            <TimeField
              label="End Time"
              value={schoolEndTime}
              editing={isEditing}
              onChange={setSchoolEndTime}
              icon={<Clock className="w-4 h-4 text-slate-800" />}
            />
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1.5">Period Duration</p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={periodDurationMins}
                    onChange={e => setPeriodDurationMins(e.target.value)}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                  />
                  <span className="text-sm text-slate-700 font-medium">minutes</span>
                </div>
              ) : (
                <p className="text-lg font-bold text-slate-900">
                  {school.periodDurationMins ?? 45}
                  <span className="text-sm font-medium text-slate-800 ml-1">min</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lunch Break */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lunch Break</p>
            {isEditing && (
              <button
                type="button"
                onClick={() => setHasLunchBreak(p => !p)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${hasLunchBreak
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
              >
                {hasLunchBreak ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                {hasLunchBreak ? 'Enabled' : 'Disabled'}
              </button>
            )}
          </div>

          {(!isEditing && !school.lunchStartTime) ? (
            <p className="text-sm text-slate-800 italic">No lunch break configured</p>
          ) : (isEditing && !hasLunchBreak) ? (
            <p className="text-sm text-slate-800 italic">Lunch break disabled</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TimeField
                label="Lunch Start"
                value={isEditing ? lunchStartTime : (school.lunchStartTime || '')}
                editing={isEditing}
                onChange={setLunchStartTime}
                icon={<Clock className="w-4 h-4 text-amber-500" />}
              />
              <TimeField
                label="Lunch End"
                value={isEditing ? lunchEndTime : (school.lunchEndTime || '')}
                editing={isEditing}
                onChange={setLunchEndTime}
                icon={<Clock className="w-4 h-4 text-amber-400" />}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(time: string): string {
  if (!time) return '—';
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

function TimeField({
  label, value, editing, onChange, icon,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-700 mb-1.5">{label}</p>
      {editing ? (
        <input
          type="time"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 w-full"
        />
      ) : (
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-lg font-bold text-slate-900">{formatTime(value)}</p>
        </div>
      )}
    </div>
  );
}
