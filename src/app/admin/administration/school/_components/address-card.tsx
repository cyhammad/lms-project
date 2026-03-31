import React from 'react';
import { MapPin } from 'lucide-react';
import { Province } from '@/types';

interface AddressCardProps {
  isEditing?: boolean;
  street?: string;
  area?: string;
  city?: string;
  province?: string;
  country?: string;
  onChange?: (field: string, value: string) => void;
}

const PROVINCES: Province[] = ['PUNJAB', 'SINDH', 'KP', 'BALOCHISTAN', 'GB', 'ICT'];

interface AddressFieldProps {
  label: string;
  value?: string;
  field: string;
  type?: string;
  isEditing?: boolean;
  onChange?: (field: string, value: string) => void;
}

const AddressField = ({ label, value, field, type = 'text', isEditing, onChange }: AddressFieldProps) => (
  <div className="flex flex-col w-full group">
    <p className="text-xs font-medium text-slate-800 uppercase tracking-widest transition-colors group-hover:text-slate-700">
      {label}
    </p>
    {isEditing ? (
      field === 'province' ? (
        <select
          value={value}
          onChange={(e) => onChange?.(field, e.target.value)}
          className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-slate-700/10 focus:border-slate-700 outline-none transition-all"
        >
          <option value="">Select Province</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange?.(field, e.target.value)}
          className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-slate-700/10 focus:border-slate-700 outline-none transition-all"
          placeholder={`Enter ${label}`}
        />
      )
    ) : (
      <p className="font-semibold text-slate-800">
        {value || 'N/A'}
      </p>
    )}
  </div>
);

export function AddressCard({
  isEditing,
  street,
  area,
  city,
  province,
  country,
  onChange
}: AddressCardProps) {
  return (
    <div className="bg-[#f8fafc] border border-slate-200 rounded-[14px] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-slate-800" />
        <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Complete Address</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 ">
        <AddressField label="Street" value={street} field="street" isEditing={isEditing} onChange={onChange} />
        <AddressField label="Area" value={area} field="area" isEditing={isEditing} onChange={onChange} />
        <AddressField label="City" value={city} field="city" isEditing={isEditing} onChange={onChange} />
        <AddressField label="Province" value={province} field="province" isEditing={isEditing} onChange={onChange} />
        <AddressField label="Country" value={country || 'Pakistan'} field="country" isEditing={isEditing} onChange={onChange} />
      </div>
    </div>
  );
}
