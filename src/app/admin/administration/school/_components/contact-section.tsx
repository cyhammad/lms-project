import React from 'react';
import { Phone, Mail, Globe, MessageCircle, MapPin, Plus, Trash2 } from 'lucide-react';
import { AddressCard } from './address-card';
import { InfoItem } from './info-item';
import type { School } from '@/types';
import { Button } from '@/components/ui/button';

interface ContactSectionProps {
  school: School;
  isEditing?: boolean;
  formData?: any;
  setFormData?: (data: any) => void;
}

export function ContactSection({ school, isEditing, formData, setFormData }: ContactSectionProps) {
  const handleAddressChange = (field: string, value: string) => {
    setFormData?.({ ...formData, [field]: value });
  };

  const currentData = isEditing ? formData : school;

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#10b981]" />
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Contact Information</h3>
        </div>
        <p className="text-slate-700 text-[14px] ml-7">Complete address and contact details</p>
      </div>

      <AddressCard
        isEditing={isEditing}
        street={currentData.street}
        area={currentData.area}
        city={currentData.city}
        province={currentData.province}
        country={currentData.country}
        onChange={handleAddressChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
        <InfoItem
          icon={Phone}
          label="Phone Number(s)"
          iconBgClass="bg-slate-50"
          iconColorClass="text-slate-700"
          isEditing={false} // Handled custom below
          value={
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-800 font-bold uppercase">Add / Remove Numbers</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-800 hover:text-slate-700 font-bold p-0 h-auto text-xs"
                      onClick={() => setFormData?.({ ...formData, phoneNumbers: [...(formData.phoneNumbers || []), ''] })}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {(formData.phoneNumbers || []).map((phone: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const newPhones = [...formData.phoneNumbers];
                          newPhones[index] = e.target.value;
                          setFormData?.({ ...formData, phoneNumbers: newPhones });
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-700/10 focus:border-slate-700"
                        placeholder="+92-xx-xxxxxxx"
                      />
                      {formData.phoneNumbers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 p-2 h-9"
                          onClick={() => {
                            const newPhones = formData.phoneNumbers.filter((_: any, i: number) => i !== index);
                            setFormData?.({ ...formData, phoneNumbers: newPhones });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="space-y-1">
                  {school.phoneNumbers && school.phoneNumbers.length > 0 ? (
                    school.phoneNumbers.map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <p>{school.phone || 'N/A'}</p>
                  )}
                </div>
              )}
            </div>
          }
        />

        <InfoItem
          icon={Mail}
          label="Official Email"
          iconBgClass="bg-blue-50"
          iconColorClass="text-blue-500"
          isEditing={isEditing}
          onEditChange={(val) => setFormData?.({ ...formData, email: val })}
          inputType="email"
          value={<p className="break-all">{currentData.email || 'N/A'}</p>}
          inputValue={currentData.email || ''}
        />

        <InfoItem
          icon={Globe}
          label="Website"
          iconBgClass="bg-indigo-50"
          iconColorClass="text-indigo-500"
          valueClass={!isEditing ? "text-slate-700 hover:text-slate-800 transition-colors" : ""}
          isEditing={isEditing}
          onEditChange={(val) => setFormData?.({ ...formData, website: val })}
          inputType="url"
          inputValue={currentData.website || ''}
          value={
            (
              <a href={school.website} target="_blank" className="underline underline-offset-4 decoration-2">
                {school.website || 'N/A'}
              </a>
            )
          }
        />

        <InfoItem
          icon={MessageCircle}
          label="WhatsApp"
          iconBgClass="bg-green-50"
          iconColorClass="text-green-500"
          isEditing={isEditing}
          onEditChange={(val) => setFormData?.({ ...formData, whatsappNumber: val })}
          inputType="tel"
          inputValue={currentData.whatsappNumber || ''}
          value={
            isEditing ? currentData.whatsappNumber : (
              <a
                href={school.whatsappNumber ? `https://wa.me/${school.whatsappNumber.replace(/[^0-9]/g, '')}` : '#'}
                target="_blank"
                className="hover:text-green-600 transition-colors"
              >
                {school.whatsappNumber || 'N/A'}
              </a>
            )
          }
        />
      </div>
    </div>
  );
}
