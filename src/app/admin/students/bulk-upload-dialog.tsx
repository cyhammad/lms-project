'use client';

import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings2,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { bulkCreateStudents, type BulkStudentRow, type BulkCreateResult } from '@/actions/students';
import type { Class, Section, AcademicSession } from '@/types';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: Class[];
  sections: Section[];
  sessions: AcademicSession[];
  onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'uploading' | 'result';

const CSV_HEADERS = [
  'First Name',
  'Last Name',
  'Email',
  'Gender',
  'Date of Birth',
  'B-Form/CRC',
  'Nationality',
  'Religion',
  'Place of Birth',
  'Address Line 1',
  'Address Line 2',
  'City',
  'Province',
  'Postal Code',
];

const GENDER_MAP: Record<string, string> = {
  male: 'MALE',
  m: 'MALE',
  female: 'FEMALE',
  f: 'FEMALE',
};

const RELIGION_MAP: Record<string, string> = {
  islam: 'ISLAM',
  muslim: 'ISLAM',
  christian: 'CHRISTIAN',
  christianity: 'CHRISTIAN',
  hindu: 'HINDU',
  hinduism: 'HINDU',
  other: 'OTHER',
};

const PROVINCE_MAP: Record<string, string> = {
  punjab: 'PUNJAB',
  sindh: 'SINDH',
  kp: 'KP',
  'khyber pakhtunkhwa': 'KP',
  balochistan: 'BALOCHISTAN',
  gb: 'GB',
  'gilgit baltistan': 'GB',
  'gilgit-baltistan': 'GB',
  ict: 'ICT',
  islamabad: 'ICT',
};

interface ParsedRow {
  rowNum: number;
  raw: Record<string, string>;
  mapped: BulkStudentRow | null;
  error?: string;
}

export default function BulkUploadDialog({
  open,
  onOpenChange,
  classes,
  sections,
  sessions,
  onSuccess,
}: BulkUploadDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [batchSession, setBatchSession] = useState<string>('');
  const [batchClass, setBatchClass] = useState<string>('');
  const [batchSection, setBatchSection] = useState<string>('');
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classNameMap = new Map<string, string>();
  classes.forEach((c) => {
    classNameMap.set(c.name.toLowerCase(), c.id);
    classNameMap.set(c.code.toLowerCase(), c.id);
    classNameMap.set(`${c.name} (${c.code})`.toLowerCase(), c.id);
  });

  const sectionNameMap = new Map<string, Map<string, string>>();
  sections.forEach((s) => {
    if (!sectionNameMap.has(s.classId)) {
      sectionNameMap.set(s.classId, new Map());
    }
    sectionNameMap.get(s.classId)!.set(s.name.toLowerCase(), s.id);
  });

  const sessionNameMap = new Map<string, string>();
  sessions.forEach((s) => {
    sessionNameMap.set(s.name.toLowerCase(), s.name);
  });

  const resetState = useCallback(() => {
    setStep('upload');
    setParsedRows([]);
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping({});
    setBatchSession('');
    setBatchClass('');
    setBatchSection('');
    setResult(null);
    setUploadError(null);
    setProgress(0);
    setShowErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const resolveClass = (value: string): string | null => {
    if (!value) return null;
    return classNameMap.get(value.toLowerCase().trim()) || null;
  };

  const resolveSection = (value: string, classId: string): string | null => {
    if (!value || !classId) return null;
    const sectionMap = sectionNameMap.get(classId);
    if (!sectionMap) return null;
    return sectionMap.get(value.toLowerCase().trim()) || null;
  };

  const resolveSession = (value: string): string | null => {
    if (!value) return null;
    return sessionNameMap.get(value.toLowerCase().trim()) || value.trim();
  };

  const mapRow = (
    raw: Record<string, string>,
    rowNum: number,
    currentMapping: Record<string, string>,
    session: string,
    classId: string,
    sectionId?: string
  ): ParsedRow => {
    const get = (targetKey: string) => {
      const csvKey = currentMapping[targetKey];
      if (!csvKey) return '';
      const val = raw[csvKey]?.trim();
      return val || '';
    };

    const firstName = get('First Name');
    const lastName = get('Last Name');
    const email = get('Email');
    const genderRaw = get('Gender');
    const dob = get('Date of Birth');
    const bForm = get('B-Form/CRC');
    const nationality = get('Nationality');
    const religionRaw = get('Religion');
    const placeOfBirth = get('Place of Birth');
    const addr1 = get('Address Line 1');
    const addr2 = get('Address Line 2');
    const city = get('City');
    const provinceRaw = get('Province');
    const postalCode = get('Postal Code');

    if (!firstName || !lastName || !bForm) {
      return {
        rowNum,
        raw,
        mapped: null,
        error: 'First Name, Last Name, and B-Form/CRC are required',
      };
    }

    const gender = genderRaw ? GENDER_MAP[genderRaw.toLowerCase()] : undefined;
    if (genderRaw && !gender) {
      return { rowNum, raw, mapped: null, error: `Invalid gender "${genderRaw}". Use Male or Female.` };
    }

    const religion = religionRaw ? RELIGION_MAP[religionRaw.toLowerCase()] : undefined;
    if (religionRaw && !religion) {
      return { rowNum, raw, mapped: null, error: `Invalid religion "${religionRaw}". Use Islam, Christian, Hindu, or Other.` };
    }

    const province = provinceRaw ? PROVINCE_MAP[provinceRaw.toLowerCase()] : undefined;
    if (provinceRaw && !province) {
      return { rowNum, raw, mapped: null, error: `Invalid province "${provinceRaw}".` };
    }

    return {
      rowNum,
      raw,
      mapped: {
        firstName,
        lastName,
        email: email || undefined,
        gender: gender as any,
        dateOfBirth: dob || undefined,
        academicSession: session,
        classApplyingFor: classId,
        sectionId: sectionId || undefined,
        bFormCrc: bForm,
        nationality: nationality || undefined,
        religion: religion as any,
        placeOfBirth: placeOfBirth || undefined,
        addressLine1: addr1 || undefined,
        addressLine2: addr2 || undefined,
        city: city || undefined,
        province: province as any,
        postalCode: postalCode || undefined,
      },
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      return;
    }

    setUploadError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setUploadError('The CSV file is empty or has no valid rows');
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data as Record<string, string>[]);

        // Auto mapping
        const initialMapping: Record<string, string> = {};
        CSV_HEADERS.forEach((target) => {
          const match = headers.find(
            (h) =>
              h.toLowerCase().trim() === target.toLowerCase().trim() ||
              h.toLowerCase().trim().replace(/[^a-z0-9]/g, '') ===
              target.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
          );
          if (match) initialMapping[target] = match;
          else if (target === 'First Name') {
            const firstNameMatch = headers.find((h) => ['firstname', 'name', 'fname'].includes(h.toLowerCase().trim()));
            if (firstNameMatch) initialMapping[target] = firstNameMatch;
          } else if (target === 'Last Name') {
            const lastNameMatch = headers.find((h) => ['lastname', 'surname', 'lname'].includes(h.toLowerCase().trim()));
            if (lastNameMatch) initialMapping[target] = lastNameMatch;
          }
        });
        setColumnMapping(initialMapping);
        setStep('mapping');
      },
      error: (err) => {
        setUploadError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleMappingConfirm = () => {
    if (!batchSession || !batchClass) return;
    const mapped = csvData.map((raw, i) => mapRow(raw, i + 1, columnMapping, batchSession, batchClass, batchSection));
    setParsedRows(mapped);
    setStep('preview');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      return;
    }

    setUploadError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setUploadError('The CSV file is empty or has no valid rows');
          return;
        }
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data as Record<string, string>[]);

        // Auto mapping
        const initialMapping: Record<string, string> = {};
        CSV_HEADERS.forEach((target) => {
          const match = headers.find(
            (h) =>
              h.toLowerCase().trim() === target.toLowerCase().trim() ||
              h.toLowerCase().trim().replace(/[^a-z0-9]/g, '') ===
              target.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
          );
          if (match) initialMapping[target] = match;
        });
        setColumnMapping(initialMapping);
        setStep('mapping');
      },
      error: (err) => {
        setUploadError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const validRows = parsedRows.filter((r) => r.mapped !== null);
  const errorRows = parsedRows.filter((r) => r.error);

  const handleUpload = async () => {
    if (validRows.length === 0) return;

    setStep('uploading');
    setProgress(0);

    const students = validRows.map((r) => r.mapped!);
    const CHUNK_SIZE = 500;
    const chunks: BulkStudentRow[][] = [];
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      chunks.push(students.slice(i, i + CHUNK_SIZE));
    }

    const combined: BulkCreateResult = { total: students.length, created: 0, failed: 0, errors: [] };

    for (let i = 0; i < chunks.length; i++) {
      const res = await bulkCreateStudents(chunks[i]);
      if (res.success && res.data) {
        combined.created += res.data.created;
        combined.failed += res.data.failed;
        combined.errors.push(...res.data.errors);
      } else {
        combined.failed += chunks[i].length;
        combined.errors.push({
          row: 0,
          message: res.error || 'Chunk upload failed',
        });
      }
      setProgress(Math.round(((i + 1) / chunks.length) * 100));
    }

    combined.failed += errorRows.length;
    setResult(combined);
    setStep('result');
    if (combined.created > 0) onSuccess();
  };

  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        'First Name': 'Ahmed',
        'Last Name': 'Khan',
        Email: 'ahmed@example.com',
        Gender: 'Male',
        'Date of Birth': '2015-03-15',
        'B-Form/CRC': '35201-1234567-1',
        Nationality: 'Pakistani',
        Religion: 'Islam',
        'Place of Birth': 'Lahore',
        'Address Line 1': 'House 123',
        'Address Line 2': 'Street 4, Block B',
        City: 'Lahore',
        Province: 'Punjab',
        'Postal Code': '54000',
      },
    ];

    const headerLine = CSV_HEADERS.join(',');
    const dataLine = CSV_HEADERS.map((h) => {
      const val = sampleRows[0][h as keyof (typeof sampleRows)[0]] || '';
      return val.includes(',') ? `"${val}"` : val;
    }).join(',');

    const csv = `${headerLine}\n${dataLine}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'students-bulk-upload-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-800" />
            Bulk Upload Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple students at once
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-800">
                Download the template to see the required format
              </p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>

            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-slate-800 hover:bg-slate-50/30 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-slate-800" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-800 mt-1">CSV files only, up to 5,000 rows</p>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                Required Columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['First Name', 'Last Name', 'B-Form'].map((col) => (
                  <span
                    key={col}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                  >
                    {col}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-700 mt-2">
                Class, session, and section are chosen in the next step after upload. Optional
                columns: Email, Gender, Date of Birth, Nationality, Religion, Place of Birth,
                Address, City, Province, Postal Code
              </p>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-700" />
                Step 1: Batch Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-800">Academic Session *</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                    value={batchSession}
                    onChange={(e) => setBatchSession(e.target.value)}
                  >
                    <option value="">Select Session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-800">Class *</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                    value={batchClass}
                    onChange={(e) => {
                      setBatchClass(e.target.value);
                      setBatchSection('');
                    }}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-800">Section</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 disabled:bg-slate-50"
                    value={batchSection}
                    onChange={(e) => setBatchSection(e.target.value)}
                    disabled={!batchClass}
                  >
                    <option value="">Select Section</option>
                    {sections
                      .filter((s) => s.classId === batchClass)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                Step 2: Column Mapping
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="max-h-[35vh] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-800">System Field</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-800">CSV Column</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {CSV_HEADERS.map((target) => {
                        const isRequired = ['First Name', 'Last Name', 'B-Form/CRC'].includes(
                          target
                        );
                        const isMapped = !!columnMapping[target];
                        return (
                          <tr key={target} className={isRequired && !isMapped ? 'bg-red-50/30' : ''}>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-700">{target}</span>
                              {isRequired && <span className="text-red-500 ml-1 font-bold">*</span>}
                            </td>
                            <td className="py-2 px-4">
                              <select
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
                                value={columnMapping[target] || ''}
                                onChange={(e) => {
                                  const newMapping = { ...columnMapping };
                                  if (e.target.value) newMapping[target] = e.target.value;
                                  else delete newMapping[target];
                                  setColumnMapping(newMapping);
                                }}
                              >
                                <option value="">— Select Column —</option>
                                {csvHeaders.map((header) => (
                                  <option key={header} value={header}>{header}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2 text-center">
                              {isMapped ? (
                                <Check className="w-4 h-4 text-slate-700 mx-auto" />
                              ) : isRequired ? (
                                <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleMappingConfirm}
                disabled={
                  !batchSession ||
                  !batchClass ||
                  !['First Name', 'Last Name', 'B-Form/CRC'].every((f) => !!columnMapping[f])
                }
              >
                Continue to Preview
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-slate-800" />
                <span className="text-sm font-medium text-slate-700">
                  {validRows.length} valid
                </span>
              </div>
              {errorRows.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    {errorRows.length} errors
                  </span>
                </div>
              )}
              <span className="text-sm text-slate-700">
                {parsedRows.length} total rows
              </span>
            </div>

            {errorRows.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setShowErrors(!showErrors)}
                >
                  <span className="text-sm font-medium text-red-700">
                    {errorRows.length} row{errorRows.length !== 1 ? 's' : ''} with errors (will
                    be skipped)
                  </span>
                  {showErrors ? (
                    <ChevronUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-red-500" />
                  )}
                </button>
                {showErrors && (
                  <div className="border-t border-red-200 max-h-48 overflow-y-auto">
                    {errorRows.map((r) => (
                      <div
                        key={r.rowNum}
                        className="px-4 py-2 text-xs border-b border-red-100 last:border-b-0"
                      >
                        <span className="font-medium text-red-800">Row {r.rowNum}:</span>{' '}
                        <span className="text-red-600">{r.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-slate-800">#</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-800">Name</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-800">Class</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-800">Section</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-800">Session</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-800">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 100).map((r) => {
                      const cls = r.mapped
                        ? classes.find((c) => c.id === r.mapped!.classApplyingFor)
                        : null;
                      const sec = r.mapped?.sectionId
                        ? sections.find((s) => s.id === r.mapped!.sectionId)
                        : null;
                      return (
                        <tr key={r.rowNum} className={r.error ? 'bg-red-50/50' : ''}>
                          <td className="py-2 px-3 text-slate-800">{r.rowNum}</td>
                          <td className="py-2 px-3 text-slate-800 font-medium">
                            {r.mapped
                              ? `${r.mapped.firstName} ${r.mapped.lastName}`
                              : r.raw['First Name'] || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-800">{cls?.name || '—'}</td>
                          <td className="py-2 px-3 text-slate-800">{sec?.name || '—'}</td>
                          <td className="py-2 px-3 text-slate-800">
                            {r.mapped?.academicSession || '—'}
                          </td>
                          <td className="py-2 px-3">
                            {r.error ? (
                              <span className="text-red-600" title={r.error}>
                                Error
                              </span>
                            ) : (
                              <span className="text-slate-800">OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 100 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-700">
                  Showing first 100 of {parsedRows.length} rows
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={resetState}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={validRows.length === 0}>
                Upload {validRows.length} Student{validRows.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Uploading students...</p>
              <p className="text-sm text-slate-700 mt-1">
                Please don't close this dialog
              </p>
            </div>
            <div className="max-w-xs mx-auto">
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="bg-slate-700 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-700 mt-2">{progress}% complete</p>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="py-6 text-center">
              {result.created > 0 ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-slate-800" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">Upload Complete</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">Upload Failed</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{result.total + errorRows.length}</p>
                <p className="text-xs text-slate-700 mt-1">Total Rows</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-700">{result.created}</p>
                <p className="text-xs text-slate-800 mt-1">Created</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                <p className="text-xs text-red-600 mt-1">Failed</p>
              </div>
            </div>

            {(result.errors.length > 0 || errorRows.length > 0) && (
              <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setShowErrors(!showErrors)}
                >
                  <span className="text-sm font-medium text-red-700">
                    {result.errors.length + errorRows.length} error
                    {result.errors.length + errorRows.length !== 1 ? 's' : ''}
                  </span>
                  {showErrors ? (
                    <ChevronUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-red-500" />
                  )}
                </button>
                {showErrors && (
                  <div className="border-t border-red-200 max-h-48 overflow-y-auto">
                    {errorRows.map((r) => (
                      <div
                        key={`csv-${r.rowNum}`}
                        className="px-4 py-2 text-xs border-b border-red-100 last:border-b-0"
                      >
                        <span className="font-medium text-red-800">Row {r.rowNum} (CSV):</span>{' '}
                        <span className="text-red-600">{r.error}</span>
                      </div>
                    ))}
                    {result.errors.map((e, i) => (
                      <div
                        key={`api-${i}`}
                        className="px-4 py-2 text-xs border-b border-red-100 last:border-b-0"
                      >
                        <span className="font-medium text-red-800">
                          {e.row > 0 ? `Row ${e.row}` : 'Server'}:
                        </span>{' '}
                        <span className="text-red-600">{e.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
