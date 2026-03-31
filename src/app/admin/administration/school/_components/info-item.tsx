import React from 'react';
import { cn } from '@/lib/utils';

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconColorClass: string;
  iconBgClass: string;
  valueClass?: string;
  isEditing?: boolean;
  onEditChange?: (value: string) => void;
  inputType?: string;
  inputValue?: string;
}

export function InfoItem({
  icon: Icon,
  label,
  value,
  iconColorClass,
  iconBgClass,
  valueClass = "text-slate-900",
  isEditing,
  onEditChange,
  inputType = 'text',
  inputValue
}: InfoItemProps) {
  return (
    <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-500">
      <div className={cn(
        "size-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110",
        iconBgClass,
        iconColorClass
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="space-y-3 flex-1">
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wide leading-none">{label}</p>
        <div className={cn("text-sm font-semibold", valueClass)}>
          {isEditing && onEditChange ? (
            <input
              type={inputType}
              value={inputValue !== undefined ? inputValue : (typeof value === 'string' ? value : '')}
              onChange={(e) => onEditChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-slate-700/10 focus:border-slate-700 outline-none transition-all"
              placeholder={`Enter ${label}`}
            />
          ) : value}
        </div>
      </div>
    </div>
  );
}
