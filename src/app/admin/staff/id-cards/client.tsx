'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { CreditCard, School } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSchools } from '@/hooks/use-schools';
import type { Teacher, StaffType } from '@/types';
import { apiClient } from '@/lib/api-client';

type TemplateId = 'professional-blue' | 'classic-green';

interface Template {
  id: TemplateId;
  name: string;
  description: string;
  icon: React.ElementType;
  preview: string;
}

const templates: Template[] = [
  { id: 'professional-blue', name: 'Professional Blue', description: 'Clean vertical design with blue accent stripe', icon: CreditCard, preview: 'bg-gradient-to-br from-blue-600 to-blue-700' },
  { id: 'classic-green', name: 'Classic Green', description: 'Clean design with punch hole and green accents', icon: CreditCard, preview: 'bg-gradient-to-br from-green-500 to-green-600' },
];

const STAFF_TYPE_OPTIONS: { value: '' | StaffType; label: string }[] = [
  { value: '', label: 'All staff' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'IT', label: 'IT' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'OTHER', label: 'Other' },
];

function formatStaffType(t?: StaffType): string {
  if (!t) return 'Staff';
  const opt = STAFF_TYPE_OPTIONS.find(o => o.value === t);
  return opt ? opt.label : t.replace(/_/g, ' ');
}

interface StaffIDCardsClientProps {
  user: { schoolId?: string };
}

export default function StaffIDCardsClient({ user }: StaffIDCardsClientProps) {
  const { schools } = useSchools();
  const [staff, setStaff] = useState<Teacher[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaffType, setSelectedStaffType] = useState<'' | StaffType>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('professional-blue');
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingStaff(true);
        const res = await apiClient<{ staff: Teacher[] }>('/staff?limit=1000');
        setStaff(res.staff || []);
      } catch (e) {
        console.error('Error loading staff:', e);
        setStaff([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    load();
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      if (!s.isActive) return false;
      if (!selectedStaffType) return true;
      return s.staffType === selectedStaffType;
    });
  }, [staff, selectedStaffType]);

  const selectedStaffList = useMemo(() => filteredStaff.filter(s => selectedStaffIds.has(s.id)), [filteredStaff, selectedStaffIds]);
  const previewStaff = useMemo(() => selectedStaffList[0] || filteredStaff[0] || null, [selectedStaffList, filteredStaff]);

  const toggleStaff = (id: string) => {
    const next = new Set(selectedStaffIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStaffIds(next);
  };

  const selectAll = () => {
    if (selectedStaffIds.size === filteredStaff.length) setSelectedStaffIds(new Set());
    else setSelectedStaffIds(new Set(filteredStaff.map(s => s.id)));
  };

  const clearFilters = () => {
    setSelectedStaffType('');
    setSelectedStaffIds(new Set());
  };

  const isValidImageUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    const invalid = ['via.placeholder.com', 'placeholder.com', 'placehold.it', 'placekitten.com', 'dummyimage.com', 'fakeimg.pl'];
    if (invalid.some(p => url.toLowerCase().includes(p))) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/');
  };

  const IDCard = ({ staffMember, templateId }: { staffMember: Teacher; templateId: TemplateId }) => {
    const name = staffMember.name || 'Unknown';
    const email = staffMember.email ?? 'N/A';
    const role = formatStaffType(staffMember.staffType);
    const cardProps = { 'data-staff-id': staffMember.id };

    const school = user?.schoolId ? schools.find(s => s.id === user.schoolId) : null;
    const schoolName = school?.name || 'School Name';
    const schoolLogo = school?.logo;
    const hasValidSchoolLogo = isValidImageUrl(schoolLogo);
    const hasValidPhoto = isValidImageUrl(staffMember.photo);

    if (templateId === 'professional-blue') {
      return (
        <div {...cardProps} className="w-full max-w-[340px] aspect-[85.6/53.98] mx-auto bg-white shadow-2xl border border-gray-300 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-b from-blue-700 via-blue-600 to-blue-700">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.15) 8px, rgba(255,255,255,0.15) 16px)' }} />
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center">
              <p className="text-white text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap drop-shadow-sm">Staff ID Card</p>
            </div>
          </div>
          <div className="ml-16 h-full flex flex-col p-4 min-h-0">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 flex-shrink-0">
              {hasValidSchoolLogo ? (
                <img src={schoolLogo!} alt={schoolName} className="h-7 w-auto object-contain max-w-[130px]" crossOrigin="anonymous" onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="h-7 w-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                  <School className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-bold text-gray-800 leading-tight uppercase tracking-wider">{schoolName}</h3>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3 flex-1 min-h-0">
              {hasValidPhoto ? (
                <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 shadow-md overflow-hidden flex-shrink-0 ring-2 ring-blue-50">
                  <img src={staffMember.photo!} alt={name} className="w-full h-full object-cover" crossOrigin="anonymous" onError={e => { const p = e.currentTarget.parentElement; if (p) p.innerHTML = `<span class="text-xl font-bold text-blue-700 flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-blue-100">${name.charAt(0).toUpperCase()}</span>`; }} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-50">
                  <span className="text-xl font-bold text-blue-700">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight mb-1 tracking-tight">{name}</h2>
                <div className="inline-block px-2 py-0.5 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700 font-semibold">{role}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">EMAIL:</span>
                <span className="text-[11px] text-gray-900 font-bold truncate" title={email}>{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">ROLE:</span>
                <span className="text-[11px] text-gray-900 font-semibold">{role}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (templateId === 'classic-green') {
      return (
        <div {...cardProps} className="relative w-full max-w-[320px] aspect-[320/460] mx-auto bg-white shadow-xl overflow-hidden flex flex-col">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-200 shadow-inner z-10" />
          <div className="pt-10 px-8 text-center">
            <div className="mb-2"><h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{schoolName}</h2></div>
            <div className="mt-1 h-[1px] w-full mx-auto bg-green-500 rounded-full" />
          </div>
          <div className="mt-4 flex justify-center flex-shrink-0">
            <div className="relative w-50 h-50 rounded-full bg-gray-200 overflow-hidden ring-4 ring-green-500/20">
              {staffMember.photo ? (
                <img src={staffMember.photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-5xl font-bold text-gray-600">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center px-8 pb-4 pt-5 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-600">Name</span>
              <span className="text-sm font-semibold text-gray-900">{name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-600">Role</span>
              <span className="text-sm font-semibold text-green-600">{role}</span>
            </div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-gray-600">Email</span>
              <span className="text-sm font-semibold text-gray-900 truncate" title={email}>{email}</span>
            </div>
          </div>
          <div className="px-8 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Staff Identification Card</p>
          </div>
        </div>
      );
    }

    return (
      <div {...cardProps} className="w-full max-w-[340px] aspect-[85.6/53.98] mx-auto bg-white shadow-2xl border border-gray-300 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-b from-blue-700 via-blue-600 to-blue-700">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center">
            <p className="text-white text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap drop-shadow-sm">Staff ID Card</p>
          </div>
        </div>
        <div className="ml-16 h-full flex flex-col p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            {hasValidSchoolLogo ? <img src={schoolLogo!} alt={schoolName} className="h-7 w-auto object-contain max-w-[130px]" crossOrigin="anonymous" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <div className="h-7 w-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center"><School className="h-4 w-4 text-white" /></div>}
            <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">{schoolName}</h3>
          </div>
          <div className="flex items-center gap-3 mb-3 flex-1">
            {hasValidPhoto ? (
              <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 shadow-md overflow-hidden flex-shrink-0"><img src={staffMember.photo!} alt={name} className="w-full h-full object-cover" crossOrigin="anonymous" onError={e => { const p = e.currentTarget.parentElement; if (p) p.innerHTML = `<span class="text-xl font-bold text-blue-700 flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-blue-100">${name.charAt(0).toUpperCase()}</span>`; }} /></div>
            ) : (
              <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-md"><span className="text-xl font-bold text-blue-700">{name.charAt(0).toUpperCase()}</span></div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 leading-tight mb-1">{name}</h2>
              <div className="inline-block px-2 py-0.5 bg-blue-50 rounded-md"><p className="text-xs text-blue-700 font-semibold">{role}</p></div>
            </div>
          </div>
          <div className="space-y-1 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">EMAIL:</span>
              <span className="text-[11px] text-gray-900 font-bold truncate" title={email}>{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">ROLE:</span>
              <span className="text-[11px] text-gray-900 font-semibold">{role}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const waitForImages = (el: HTMLElement, timeoutMs = 5000): Promise<void> => {
    return new Promise(resolve => {
      const imgs = el.querySelectorAll('img');
      if (imgs.length === 0) { setTimeout(resolve, 100); return; }
      let loaded = 0;
      let done = false;
      const check = () => { loaded++; if (loaded === imgs.length && !done) { done = true; setTimeout(resolve, 100); } };
      const t = setTimeout(() => { if (!done) { done = true; resolve(); } }, timeoutMs);
      imgs.forEach(img => {
        if (img.complete && img.naturalHeight !== 0) check();
        else { img.onload = () => { clearTimeout(t); check(); }; img.onerror = () => { clearTimeout(t); check(); }; }
      });
      if (loaded === imgs.length) { clearTimeout(t); done = true; setTimeout(resolve, 100); }
    });
  };

  const getBaseDimensions = (templateId: TemplateId) => {
    if (templateId === 'classic-green') return { width: 320, height: 460, isLandscape: false };
    const width = 340;
    const height = Math.round(width * (53.98 / 85.6));
    return { width, height, isLandscape: true };
  };

  const renderStaffCardToPng = async (staffMember: Teacher, templateId: TemplateId) => {
    const { toPng } = await import('html-to-image');
    const { width: baseWidth, height: baseHeight } = getBaseDimensions(templateId);
    const temp = document.createElement('div');
    temp.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + (baseWidth + 100) + 'px;height:' + (baseHeight + 100) + 'px;backgroundColor:#fff;padding:20px;zIndex:-1000';
    document.body.appendChild(temp);
    const wrapper = document.createElement('div');
    wrapper.style.width = baseWidth + 'px';
    wrapper.style.backgroundColor = '#ffffff';
    temp.appendChild(wrapper);
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const root = ReactDOM.createRoot(wrapper);
    await new Promise<void>(r => { root.render(React.createElement(IDCard, { staffMember, templateId })); setTimeout(r, 100); });
    await new Promise<void>(r => { requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 300))); });
    const cardEl = wrapper.querySelector<HTMLElement>('[data-staff-id]');
    if (!cardEl) { root.unmount(); document.body.removeChild(temp); throw new Error('Card element not found'); }
    void cardEl.offsetHeight;
    await waitForImages(cardEl, 8000);
    await new Promise(r => setTimeout(r, 200));
    let dataUrl: string;
    try {
      dataUrl = await toPng(cardEl, { backgroundColor: '#ffffff', quality: 1, cacheBust: true, pixelRatio: 4, skipFonts: true, style: { transform: 'none' } });
    } catch (err) {
      root.unmount(); document.body.removeChild(temp);
      throw new Error('Failed to capture card');
    }
    if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 1000) { root.unmount(); document.body.removeChild(temp); throw new Error('Invalid data URL'); }
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((res, rej) => {
      const t = setTimeout(() => rej(new Error('Image load timeout')), 5000);
      img.onload = () => { clearTimeout(t); res(); };
      img.onerror = () => { clearTimeout(t); rej(new Error('Failed to load image')); };
    });
    root.unmount();
    document.body.removeChild(temp);
    return { dataUrl, width: img.width, height: img.height };
  };

  const handleDownload = async () => {
    const toExport = selectedStaffList.length > 0 ? selectedStaffList : previewStaff ? [previewStaff] : [];
    if (toExport.length === 0) return;
    try {
      setIsDownloading(true);
      setDownloadProgress('Initializing...');
      const { default: jsPDF } = await import('jspdf');
      const createPDFFromStaff = async (staffMember: Teacher, templateId: TemplateId) => {
        const { dataUrl } = await renderStaffCardToPng(staffMember, templateId);
        const { isLandscape, width: baseWidth, height: baseHeight } = getBaseDimensions(templateId);
        let pdfW: number, pdfH: number;
        if (templateId === 'classic-green') { pdfW = 60; pdfH = Math.round(60 * (460 / 320)); } else { pdfW = 85.6; pdfH = 53.98; }
        const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format: [pdfW, pdfH], compress: true });
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
        return pdf;
      };
      if (toExport.length === 1) {
        setDownloadProgress('Generating PDF...');
        const pdf = await createPDFFromStaff(toExport[0], selectedTemplate);
        const safe = (toExport[0].email || toExport[0].id).replace(/[^a-zA-Z0-9-_]/g, '_');
        pdf.save(`${safe}-staff-id-card.pdf`);
        return;
      }

      // Multiple staff -> render each off-screen sequentially and create a single PDF
      let ok = 0, fail = 0;
      const errs: string[] = [];

      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      const margin = 10;
      const gapMm = 1.5; // ~4px gap between cards

      // Usable area
      const usableWidth = a4Width - 2 * margin;
      const usableHeight = a4Height - 2 * margin;

      let cardWidthMm: number;
      let cardHeightMm: number;

      if (selectedTemplate === 'classic-green') {
        cardWidthMm = 60;
        cardHeightMm = Math.round(60 * (460 / 320));
      } else {
        cardWidthMm = 85.6;
        cardHeightMm = 53.98;
      }

      // Calculate grid layout
      const cols = Math.floor((usableWidth + gapMm) / (cardWidthMm + gapMm));
      const rows = Math.floor((usableHeight + gapMm) / (cardHeightMm + gapMm));
      const cardsPerPage = cols * rows;

      // Calculate spacing to center the grid
      const gridWidth = cols * cardWidthMm + (cols > 1 ? (cols - 1) * gapMm : 0);
      const gridHeight = rows * cardHeightMm + (rows > 1 ? (rows - 1) * gapMm : 0);
      const startX = margin + (usableWidth - gridWidth) / 2;
      const startY = margin + (usableHeight - gridHeight) / 2;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      for (let i = 0; i < toExport.length; i++) {
        const s = toExport[i];
        try {
          setDownloadProgress(`Generating ${i + 1} of ${toExport.length}...`);
          const { dataUrl } = await renderStaffCardToPng(s, selectedTemplate);

          // If we need a new page (and it's not the very first card)
          if (i > 0 && i % cardsPerPage === 0) {
            pdf.addPage();
          }

          // Calculate position on current page
          const posOnPage = i % cardsPerPage;
          const col = posOnPage % cols;
          const row = Math.floor(posOnPage / cols);

          const x = startX + (col * (cardWidthMm + gapMm));
          const y = startY + (row * (cardHeightMm + gapMm));

          pdf.addImage(
            dataUrl,
            'PNG',
            x,
            y,
            cardWidthMm,
            cardHeightMm,
            undefined,
            'FAST'
          );

          // Add a subtle border around each card for cutting
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.1);
          pdf.rect(x, y, cardWidthMm, cardHeightMm);

          ok++;
        } catch (e) {
          fail++;
          errs.push(`${s.name}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await new Promise(r => setTimeout(r, 100));
      }
      if (ok === 0) {
        alert('Failed to generate any PDFs.\n' + errs.slice(0, 5).join('\n'));
        return;
      }

      setDownloadProgress('Saving PDF file...');
      pdf.save('staff-id-cards.pdf');

      if (fail > 0) alert(`Generated ${ok} ID card(s). ${fail} failed.`);
    } catch (e) {
      alert('Failed to generate ID card(s): ' + (e instanceof Error ? e.message : 'Unknown'));
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff ID Cards</h1>
        <p className="text-gray-600 mt-1">Generate ID cards for your staff members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Template</CardTitle>
          <CardDescription>Select staff type and card template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff type {loadingStaff && <span className="text-gray-400 text-xs">(Loading...)</span>}</label>
              <select
                value={selectedStaffType}
                onChange={e => { setSelectedStaffType(e.target.value as '' | StaffType); setSelectedStaffIds(new Set()); }}
                disabled={loadingStaff}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] text-sm bg-white outline-none disabled:opacity-50"
              >
                {STAFF_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value as TemplateId)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] text-sm bg-white outline-none"
              >
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {(selectedStaffType) && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Card Preview</CardTitle>
                  <CardDescription>Preview of the selected template</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownload} disabled={isDownloading || (!previewStaff && selectedStaffList.length === 0)} className="min-w-[150px]">
                  {isDownloading ? downloadProgress || 'Generating...' : 'Download PDF'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewStaff ? (
                <div className="flex justify-center overflow-visible">
                  <div ref={previewRef} className="w-full flex justify-center">
                    <IDCard staffMember={previewStaff} templateId={selectedTemplate} />
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">No staff available to preview</p>
                  <p className="text-xs mt-1">Adjust filters to see staff</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Staff</CardTitle>
                  <CardDescription>
                    {loadingStaff ? 'Loading...' : filteredStaff.length > 0 ? `${filteredStaff.length} staff found • ${selectedStaffIds.size} selected` : selectedStaffType ? 'No staff in this type' : 'Select filters to view staff'}
                  </CardDescription>
                </div>
                {filteredStaff.length > 0 && (
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {selectedStaffIds.size === filteredStaff.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredStaff.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {filteredStaff.map(s => (
                    <label key={s.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selectedStaffIds.has(s.id) ? 'bg-slate-50' : ''}`}>
                      <input type="checkbox" checked={selectedStaffIds.has(s.id)} onChange={() => toggleStaff(s.id)} className="w-4 h-4 text-[#10b981] border-gray-300 rounded focus:ring-[#10b981]" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-sm text-gray-500">{s.email || s.id} • {formatStaffType(s.staffType)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">No staff found</p>
                  <p className="text-xs mt-1">Try adjusting filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
