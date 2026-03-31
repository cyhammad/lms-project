'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Edit,
  School as SchoolIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Calendar,
  FileText,
  Building2,
  Save,
  X,
  Plus,
  Trash2,
  Shield
} from 'lucide-react';
import type { School, SchoolType, SchoolLevel, Province } from '@/types';
import { toast } from 'sonner';
import { updateSchool } from '@/actions/schools';
import { ContactSection } from './_components/contact-section';
import { SchoolSettingsCard } from './_components/school-settings-card';

const SCHOOL_TYPES: SchoolType[] = ['Government', 'Private', 'Semi-Government'];
const SCHOOL_LEVELS: SchoolLevel[] = ['Primary', 'Middle', 'Secondary', 'Higher Secondary', 'O & A Levels'];

interface SchoolClientProps {
  initialSchool: School | null;
}

export default function SchoolClient({ initialSchool }: SchoolClientProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [school, setSchool] = useState<School | null>(initialSchool);
  const [logoError, setLogoError] = useState(false);
  const [formData, setFormData] = useState({
    name: school?.name || '',
    campusName: school?.campusName || '',
    logo: school?.logo || '',
    schoolType: school?.schoolType || '' as SchoolType | '',
    level: school?.level || '' as SchoolLevel | '',
    yearOfEstablishment: school?.yearOfEstablishment?.toString() || '',
    registrationNumber: school?.registrationNumber || '',
    street: school?.street || '',
    area: school?.area || '',
    city: school?.city || '',
    province: school?.province || '' as Province | '',
    country: school?.country || 'Pakistan',
    phone: school?.phone || '',
    phoneNumbers: school?.phoneNumbers && school?.phoneNumbers.length > 0
      ? school?.phoneNumbers
      : [school?.phone || ''],
    email: school?.email || '',
    website: school?.website || '',
    whatsappNumber: school?.whatsappNumber || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id) return;

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => data.append(key, v));
        } else {
          data.append(key, value);
        }
      });

      const addressParts = [
        formData.street,
        formData.area,
        formData.city,
        formData.province,
        formData.country
      ].filter(p => p);
      data.append('address', addressParts.join(', '));

      const result = await updateSchool(school.id, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('School details updated successfully!');
        setIsEditing(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating school:', error);
      toast.error('Failed to update school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!school) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-700 font-medium">
          No school associated with your account.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">School Settings</h1>
          <p className="text-slate-700 text-[14px] mt-0.5">
            {isEditing ? 'Modify your school information below' : 'View and manage your school information'}
          </p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-[#10b981] hover:bg-[#059669] text-white rounded-lg px-6 py-2 h-auto text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Details
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsEditing(false)}
              variant="ghost"
              className="text-slate-700 hover:text-slate-700 font-semibold"
            >
              Discard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#10b981] hover:bg-[#059669] text-white rounded-lg px-6 py-2 h-auto text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col w-full gap-5">
        {/* Banner Card */}
        <div className="bg-[#10b981] rounded-[20px] p-6 flex flex-col md:flex-row items-center gap-6 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 pointer-events-none" />

          <div className="size-32 bg-white rounded-[24px] flex items-center justify-center shadow-xl shadow-black/5 flex-shrink-0 z-10 transition-transform hover:scale-105 duration-300 relative overflow-hidden">
            {isEditing ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center group/logo cursor-pointer">
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  placeholder="Logo URL"
                />
                {formData.logo ? (
                  <img src={formData.logo} alt="Preview" className="w-[85%] h-[85%] object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Plus className="w-6 h-6 text-slate-700" />
                    <span className="text-[10px] font-bold text-slate-800 uppercase">Logo URL</span>
                  </div>
                )}
              </div>
            ) : (
              school.logo && !logoError ? (
                <img
                  src={school.logo}
                  alt="Logo"
                  className="w-[85%] h-[85%] object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <SchoolIcon className="w-[60px] h-[60px] text-[#10b981]" />
              )
            )}
          </div>

          <div className="flex-1 text-center md:text-left z-10 w-full">
            {isEditing ? (
              <div className="space-y-3 max-w-2xl">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-[32px] font-bold w-full outline-none focus:bg-white/20 transition-all placeholder:text-white/40"
                  placeholder="School Name"
                />
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-white/80" />
                  <input
                    type="text"
                    value={formData.campusName}
                    onChange={(e) => setFormData({ ...formData, campusName: e.target.value })}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white/90 text-lg font-semibold outline-none focus:bg-white/20 transition-all placeholder:text-white/40 flex-1"
                    placeholder="Campus Name"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[32px] font-bold text-white leading-tight tracking-tight drop-shadow-sm">{school.name}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2 group/campus">
                  <Building2 className="w-5 h-5 text-white/80 group-hover/campus:text-white transition-colors" />
                  <p className="text-white/90 text-lg font-semibold tracking-tight">{school.campusName || 'Main Campus'} {school.city && <span className="text-white/60 font-medium ml-1">· {school.city}</span>}</p>
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
              {isEditing ? (
                <>
                  <select
                    value={formData.schoolType}
                    onChange={(e) => setFormData({ ...formData, schoolType: e.target.value as SchoolType })}
                    className="px-4 py-1.5 bg-black/10 backdrop-blur-md rounded-full text-white text-[13px] font-semibold border border-white/20 outline-none focus:bg-black/30 transition-all"
                  >
                    {SCHOOL_TYPES.map(t => <option key={t} value={t} className="text-slate-900">{t}</option>)}
                  </select>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as SchoolLevel })}
                    className="px-4 py-1.5 bg-black/10 backdrop-blur-md rounded-full text-white text-[13px] font-semibold border border-white/20 outline-none focus:bg-black/30 transition-all"
                  >
                    {SCHOOL_LEVELS.map(l => <option key={l} value={l} className="text-slate-900">{l}</option>)}
                  </select>
                </>
              ) : (
                [school.schoolType || 'Private', school.level || 'Secondary'].map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-5 py-2 bg-black/10 backdrop-blur-md rounded-full text-white text-[13px] font-semibold border border-white/20 hover:bg-black/20 transition-all cursor-default"
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm rounded-[18px] transition-all hover:shadow-md hover:border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 min-w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                  <Calendar className="w-5 h-5 transition-transform hover:scale-110" />
                </div>
                <span className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">Year of Establishment</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.yearOfEstablishment}
                  onChange={(e) => setFormData({ ...formData, yearOfEstablishment: e.target.value })}
                  className="text-[32px] font-bold text-slate-900 tracking-tighter w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-1 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              ) : (
                <p className="text-[32px] font-bold text-slate-900 tracking-tighter">{school.yearOfEstablishment || 'N/A'}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-[18px] transition-all hover:shadow-md hover:border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 min-w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                  <FileText className="w-5 h-5 transition-transform hover:scale-110" />
                </div>
                <span className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">Registration Number</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="text-[24px] font-bold text-slate-900 font-mono tracking-tight w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-1 outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500"
                />
              ) : (
                <p className="text-[24px] font-bold text-slate-900 font-mono tracking-tight">{school.registrationNumber || 'Pending'}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Section Component */}
        <ContactSection
          school={school}
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
        />

        {/* School Operations Settings */}
        {!isEditing && (
          <SchoolSettingsCard
            school={school}
            onUpdate={(updated) => setSchool(prev => prev ? { ...prev, ...updated } : prev)}
          />
        )}

        {isEditing && (
          <div className="flex items-center gap-3 justify-end pt-4">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="rounded-xl px-8 h-12 font-bold text-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#10b981] hover:bg-[#059669] text-white rounded-xl px-12 h-12 font-bold shadow-lg shadow-slate-700/20"
              disabled={loading}
            >
              {loading ? 'Saving Changes...' : 'Save All Details'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
