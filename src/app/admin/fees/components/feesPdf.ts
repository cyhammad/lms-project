import type { Student, StudentFeePayment } from '@/types';
import { getSchoolById } from '@/lib/storage';
import { getFeeSettings, hasBankDetails } from '@/lib/fee-settings-storage';
import { formatCurrency } from './feesUtils';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

type GetStudentMeta = (studentId: string) => string;

const COPY_LABELS = ['BANK COPY', 'SCHOOL COPY', 'STUDENT COPY'] as const;

// ─── LMS Brand Palette (Emerald + Slate) ──────────────────────────────────
type RGB = [number, number, number];

const EDFLO = {
  // Emerald (Primary)
  emerald50: [236, 253, 245] as RGB,  // #ecfdf5
  emerald100: [209, 250, 229] as RGB,  // #d1fae5
  emerald400: [52, 211, 153] as RGB,   // #34d399
  emerald500: [16, 185, 129] as RGB,   // #10b981
  emerald600: [5, 150, 105] as RGB,    // #059669
  emerald700: [4, 120, 87] as RGB,     // #047857
  // Slate (Neutrals)
  white: [255, 255, 255] as RGB,
  slate50: [248, 250, 252] as RGB,   // #f8fafc
  slate100: [241, 245, 249] as RGB,   // #f1f5f9
  slate200: [226, 232, 240] as RGB,   // #e2e8f0
  slate400: [148, 163, 184] as RGB,   // #94a3b8
  slate500: [100, 116, 139] as RGB,   // #64748b
  slate600: [71, 85, 105] as RGB,     // #475569
  slate800: [30, 41, 59] as RGB,      // #1e293b
  slate900: [15, 23, 42] as RGB,      // #0f172a
};

function buildPalette() {
  return {
    brand: EDFLO.emerald500,
    brandDark: EDFLO.emerald600,
    brandDeep: EDFLO.emerald700,
    brandLight: EDFLO.emerald50,
    brandMedium: EDFLO.emerald100,
    brandAccent: EDFLO.emerald400,
    border: EDFLO.slate200,
    divider: EDFLO.slate200,
    muted: EDFLO.slate400,
    bodyText: EDFLO.slate500,
    labelText: EDFLO.slate600,
    white: EDFLO.white,
    darkText: EDFLO.slate800,
    heading: EDFLO.slate900,
    sectionBg: EDFLO.slate50,
    sectionHdr: EDFLO.slate100,
  };
}

// ─── Logo helper ────────────────────────────────────────────────────────────

/** LMS logo path (served from /public) */
const EDFLO_LOGO_PATH = '/images/logos/lms-512.png';

/** Load an image from URL and convert to base64 PNG data URL (browser only) */
function loadImageAsDataUrl(src: string): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Load logo: tries school logo URL first, then falls back to LMS logo */
export async function getLogoDataUrl(logoUrl?: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    // Try school-specific logo first
    if (logoUrl) {
      const result = await loadImageAsDataUrl(logoUrl);
      if (result) return result;
    }
    // Fallback to LMS logo from public folder
    return await loadImageAsDataUrl(EDFLO_LOGO_PATH);
  } catch {
    return null;
  }
}

// ─── QR Code helper ─────────────────────────────────────────────────────────

/** Generate QR code as PNG data URL for a challan number (browser only) */
export async function getQrCodeDataUrl(data: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(data, {
      width: 180,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch {
    return null;
  }
}

// ─── Barcode helper (kept for invoice backward compat) ──────────────────────

/** Generate barcode as PNG data URL for the challan number (browser only). */
export async function getBarcodeDataUrl(challanNumber: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  try {
    const JsBarcode = (await import('jsbarcode')).default;
    const canvas = document.createElement('canvas');
    const scale = 2;
    JsBarcode(canvas, challanNumber, {
      format: 'CODE128',
      width: 1.5 * scale,
      height: 24 * scale,
      displayValue: true,
      fontSize: 18,
      font: 'sans-serif',
      fontOptions: '',
      textMargin: 6,
      margin: 6,
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

// ─── PDF drawing utilities ──────────────────────────────────────────────────

/** Draw right-aligned text that fits within maxWidth by shrinking font if needed */
function drawRightAlignedFitting(
  pdf: import('jspdf').jsPDF,
  text: string,
  xRight: number,
  y: number,
  maxWidthMm: number,
  opts: { maxFontSize?: number; minFontSize?: number; bold?: boolean } = {},
): void {
  const { maxFontSize = 9, minFontSize = 5, bold = false } = opts;
  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  for (let size = maxFontSize; size >= minFontSize; size -= 1) {
    pdf.setFontSize(size);
    if (pdf.getTextWidth(text) <= maxWidthMm) {
      pdf.text(text, xRight, y, { align: 'right' });
      return;
    }
  }
  pdf.setFontSize(minFontSize);
  pdf.text(text, xRight, y, { align: 'right' });
}

/** Draw a rounded rectangle */
function drawRoundedRect(
  pdf: import('jspdf').jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: 'F' | 'S' | 'FD',
) {
  // jsPDF >= 2.x supports roundedRect
  if (typeof (pdf as any).roundedRect === 'function') {
    (pdf as any).roundedRect(x, y, w, h, r, r, style);
  } else {
    pdf.rect(x, y, w, h, style);
  }
}

// ─── Single challan column drawing ──────────────────────────────────────────

interface ChallanColumnOpts {
  palette: ReturnType<typeof buildPalette>;
  school: ReturnType<typeof getSchoolById>;
  feeSettings: ReturnType<typeof getFeeSettings>;
  showBankDetails: boolean;
  copyLabel: string;
  challanNumber: string;
  dateStr: string;
  feeMonthStr: string;
  studentName: string;
  className: string;
  sectionName: string;
  bFormCrc: string | undefined;
  discountedFee: number;
  addOnPayments: StudentFeePayment[];
  totalFees: number;
  dueDateStr: string;
  status: string;
  paidAmount?: number;
  logoDataUrl?: string | null;
  qrDataUrl?: string | null;
}

/** Draw one challan column in the 3-column landscape layout */
function drawOneChallanInColumn(
  pdf: import('jspdf').jsPDF,
  xLeft: number,
  xRight: number,
  yStart: number,
  pageHeight: number,
  opts: ChallanColumnOpts,
): void {
  const {
    palette,
    school,
    feeSettings,
    showBankDetails,
    copyLabel,
    challanNumber,
    dateStr,
    feeMonthStr,
    studentName,
    className,
    sectionName,
    bFormCrc,
    discountedFee,
    addOnPayments,
    totalFees,
    dueDateStr,
    paidAmount,
    logoDataUrl,
    qrDataUrl,
  } = opts;

  const colCenter = (xLeft + xRight) / 2;
  const colW = xRight - xLeft;
  const pad = 3.5;
  const left = xLeft + pad;
  const right = xRight - pad;
  const amountMaxWidth = 28;
  const rowH = 4.5;
  let y = yStart;

  // ── Top emerald accent line (Removed) ──
  y += 3;

  // ── Header: Logo + School (left) | QR Code (right) ──
  const logoSize = 14;
  const qrHeaderSize = 16;
  const logoX = left;
  const textX = left + logoSize + 3;
  const textMaxW = colW - logoSize - qrHeaderSize - 12; // space for text between logo and QR
  const headerStartY = y;

  // Logo (left)
  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', logoX, y, logoSize, logoSize);
  } else if (school) {
    const circleR = logoSize / 2;
    pdf.setFillColor(...palette.brand);
    pdf.circle(logoX + circleR, y + circleR, circleR, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...palette.white);
    const initials = school.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    pdf.text(initials, logoX + circleR, y + circleR + 1, { align: 'center' });
    pdf.setTextColor(...palette.darkText);
  }

  // QR Code (right side of header)
  if (qrDataUrl) {
    const qrX = right - qrHeaderSize;
    pdf.addImage(qrDataUrl, 'PNG', qrX, headerStartY, qrHeaderSize, qrHeaderSize);
  }

  // School name & details (between logo and QR)
  if (school) {
    let ty = headerStartY + 3;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...palette.heading);
    pdf.text(school.name, textX, ty);
    ty += 3.5;

    if (school.campusName) {
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...palette.brandDark);
      pdf.text(school.campusName, textX, ty);
      ty += 3;
    }

    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...palette.muted);
    if (school.address) {
      pdf.text(school.address, textX, ty);
      ty += 2.5;
    }
    if (school.phone) {
      pdf.text(school.phone, textX, ty);
      if (school.email) {
        pdf.text(`| ${school.email}`, textX + pdf.getTextWidth(school.phone + '  '), ty);
      }
      ty += 2.5;
    }
    pdf.setTextColor(...palette.darkText);
  }

  y = headerStartY + Math.max(logoSize, qrHeaderSize) + 2;

  // Thin separator after header
  pdf.setDrawColor(...palette.border);
  pdf.setLineWidth(0.15);
  pdf.line(left, y, right, y);
  y += 2;

  // ── FEE CHALLAN header bar (emerald gradient) ──
  const titleBarH = 9;
  pdf.setFillColor(...palette.brandDark);
  drawRoundedRect(pdf, xLeft + 1, y, colW - 2, titleBarH, 1.5, 'F');
  pdf.setFillColor(...palette.brand);
  pdf.rect(xLeft + 1, y, (colW - 2) * 0.55, titleBarH, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...palette.white);
  pdf.text('FEE CHALLAN', left + 2, y + titleBarH * 0.62);
  pdf.setFontSize(7);
  pdf.text(copyLabel, right - 1, y + titleBarH * 0.62, { align: 'right' });
  pdf.setTextColor(...palette.darkText);
  y += titleBarH + 3;

  // ── Meta strip: Challan #, Date, Month ──
  pdf.setFillColor(...palette.brandLight);
  pdf.setDrawColor(...palette.border);
  pdf.setLineWidth(0.15);
  const metaH = 12;
  pdf.rect(xLeft + 1, y, colW - 2, metaH, 'FD');
  y += 4;
  pdf.setFontSize(7.5);
  // Challan # label + value
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...palette.brandDark);
  const challanLabel = 'Challan #:  ';
  pdf.text(challanLabel, left + 1, y);
  const challanLabelW = pdf.getTextWidth(challanLabel);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...palette.darkText);
  pdf.text(challanNumber, left + 1 + challanLabelW, y);
  // Date (right-aligned)
  pdf.setFont('helvetica', 'normal');
  const dateValW = pdf.getTextWidth(dateStr);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...palette.brandDark);
  const dateLabel = 'Date:  ';
  const dateLabelW = pdf.getTextWidth(dateLabel);
  pdf.text(dateLabel, right - dateValW - dateLabelW, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...palette.darkText);
  pdf.text(dateStr, right, y, { align: 'right' });
  y += 5;
  // Month
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...palette.brandDark);
  const monthLabel = 'Month:  ';
  pdf.text(monthLabel, left + 1, y);
  const monthLabelW = pdf.getTextWidth(monthLabel);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...palette.darkText);
  pdf.text(feeMonthStr, left + 1 + monthLabelW, y);
  y += metaH - 4 - 5 + 3;

  // ── Section helper: section header with emerald left accent ──
  const drawSectionHeader = (title: string) => {
    const hdrH = 7;
    pdf.setFillColor(...palette.sectionHdr);
    pdf.rect(xLeft + 1, y, colW - 2, hdrH, 'F');
    pdf.setFillColor(...palette.brand);
    pdf.rect(xLeft + 1, y, 1.5, hdrH, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...palette.brandDeep);
    pdf.text(title.toUpperCase(), left + 4, y + 4.8);
    pdf.setTextColor(...palette.darkText);
    y += hdrH;
  };

  // ── Student Information Section ──
  drawSectionHeader('Student Information');
  y += 6; // padding after header (increased)
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Name:', left + 1, y);
  pdf.setFont('helvetica', 'bold');
  pdf.text(studentName, left + 1 + pdf.getTextWidth('Name: '), y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Class: ${className}`, left + 1, y);
  pdf.text(`Section: ${sectionName}`, colCenter, y);
  y += 5;
  if (bFormCrc) {
    pdf.text(`B-Form/CRC: ${bFormCrc}`, left + 1, y);
    y += 5;
  }
  y += 3; // bottom padding

  // ── Fee Breakdown Section ──
  drawSectionHeader('Fee Breakdown');
  y += 6; // padding after header (increased)
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  // Monthly tuition row
  pdf.text('Monthly Tuition', left + 1, y);
  drawRightAlignedFitting(pdf, formatCurrency(discountedFee), right - 1, y, amountMaxWidth, {
    maxFontSize: 8,
    minFontSize: 5,
  });
  y += 5;

  // Add-on fee rows
  if (addOnPayments.length > 0) {
    addOnPayments.forEach((p) => {
      pdf.text(p.feeType, left + 1, y);
      drawRightAlignedFitting(pdf, formatCurrency(p.finalAmount), right - 1, y, amountMaxWidth, {
        maxFontSize: 8,
        minFontSize: 5,
      });
      y += 5;
    });
  }

  // Dashed separator before total
  y += 1;
  pdf.setDrawColor(...palette.border);
  pdf.setLineWidth(0.2);
  pdf.setLineDashPattern([1.5, 1], 0);
  pdf.line(left, y, right, y);
  pdf.setLineDashPattern([], 0);
  y += 3;

  // ── Total bar (emerald) ──
  const totalBarH = 9;
  pdf.setFillColor(...palette.brandDark);
  drawRoundedRect(pdf, xLeft + 1, y, colW - 2, totalBarH, 1.5, 'F');
  pdf.setFillColor(...palette.brand);
  pdf.rect(xLeft + 1, y + 0.3, (colW - 2) * 0.45, totalBarH - 0.6, 'F');
  const totalTextY = y + totalBarH * 0.62;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...palette.white);
  pdf.text('TOTAL', left + 2, totalTextY);
  drawRightAlignedFitting(pdf, formatCurrency(totalFees), right - 2, totalTextY, amountMaxWidth, {
    maxFontSize: 10,
    minFontSize: 6,
    bold: true,
  });
  pdf.setTextColor(...palette.darkText);
  y += totalBarH + 3;

  // ── Bank / Payment Details ──
  if (showBankDetails && feeSettings) {
    drawSectionHeader('Bank Details');
    y += 6; // top padding after header (same as student info)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...palette.darkText);
    pdf.text(`Bank:`, left + 1, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(feeSettings.bankName, left + 1 + pdf.getTextWidth('Bank:  '), y);
    y += 4.5;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`A/C Title:`, left + 1, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(feeSettings.accountTitle, left + 1 + pdf.getTextWidth('A/C Title:  '), y);
    y += 4.5;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`A/C No:`, left + 1, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(feeSettings.accountNumber, left + 1 + pdf.getTextWidth('A/C No:  '), y);
    y += 4.5;
    if (feeSettings.iban) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`IBAN:`, left + 1, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(feeSettings.iban, left + 1 + pdf.getTextWidth('IBAN:  '), y);
      y += 4.5;
    }
    if (feeSettings.branch) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Branch:`, left + 1, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(feeSettings.branch, left + 1 + pdf.getTextWidth('Branch:  '), y);
      y += 4.5;
    }
    y += 2;
  } else {
    // No bank details configured — show payment note
    drawSectionHeader('Payment Information');
    y += 6; // same padding as student info
    pdf.setFillColor(...palette.brandLight);
    pdf.setDrawColor(...palette.border);
    pdf.setLineWidth(0.15);
    const noteH = 10;
    pdf.roundedRect(xLeft + 2, y - 2, colW - 4, noteH, 1, 1, 'FD');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...palette.brandDeep);
    pdf.text('Please pay this fee at the school office.', colCenter, y + 3, { align: 'center' });
    pdf.setTextColor(...palette.darkText);
    y += noteH + 2;
  }

  // ── Due Date ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...palette.brandDark);
  pdf.text(`Due Date: ${dueDateStr}`, left + 1, y);
  pdf.setTextColor(...palette.darkText);
  if (paidAmount != null && paidAmount > 0) {
    pdf.setFont('helvetica', 'normal');
    drawRightAlignedFitting(pdf, `Paid: ${formatCurrency(paidAmount)}`, right - 1, y, amountMaxWidth, {
      maxFontSize: 8,
      minFontSize: 5,
    });
  }
  y += 6;

  // ── Signature Line ──
  const bottomBarY = pageHeight - 13 - 1.2;
  const signatureY = Math.max(y + 15, bottomBarY - 15);

  pdf.setDrawColor(...palette.border);
  pdf.setLineWidth(0.25);
  pdf.line(left + 8, signatureY, right - 8, signatureY);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...palette.muted);
  pdf.text('Authorized Signature', colCenter, signatureY + 3.5, { align: 'center' });
  pdf.setTextColor(...palette.darkText);

  // ── Bottom emerald accent line (Removed) ──
}

// ─── Main challan PDF generator (multi-payment: monthly + add-ons) ──────────

export async function generateChallanPdf(options: {
  student: Student;
  userSchoolId?: string;
  getStudentName: GetStudentMeta;
  getClassName: GetStudentMeta;
  getSectionName: GetStudentMeta;
  getStandardFee: (student: Student) => number;
  getStudentPayments: (studentId: string) => StudentFeePayment[];
}) {
  const { default: jsPDF } = await import('jspdf');
  const {
    student,
    userSchoolId,
    getStudentName,
    getClassName,
    getSectionName,
    getStandardFee,
    getStudentPayments,
  } = options;

  const pdf = new jsPDF('l', 'mm', 'a4');
  const school = userSchoolId ? getSchoolById(userSchoolId) : null;
  const feeSettings = userSchoolId ? getFeeSettings(userSchoolId) : null;
  const showBankDetails = hasBankDetails(feeSettings);
  const allPayments = getStudentPayments(student.id);
  const monthlyPayments = allPayments.filter((p) => p.feeType === 'MonthlyTuition');
  const addOnPayments = allPayments.filter(
    (p) => p.feeType !== 'MonthlyTuition' && p.feeType !== 'Admission',
  );

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentPayment =
    monthlyPayments.find((p) => p.month === currentMonth && p.year === currentYear) ||
    monthlyPayments[monthlyPayments.length - 1];

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const dividerWidth = 0.4;
  const columnWidth = (pageWidth - 2 * margin - 2 * dividerWidth) / 3;

  const challanNumber = `CH-${student.id.substring(0, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-6)}`;
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  let feeMonthStr = '';
  if (currentPayment && currentPayment.month && currentPayment.year) {
    feeMonthStr = `${MONTH_NAMES[currentPayment.month - 1]} ${currentPayment.year}`;
  } else if (currentPayment) {
    const d = new Date(currentPayment.dueDate);
    feeMonthStr = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  } else {
    feeMonthStr = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;
  }

  const studentName = getStudentName(student.id);
  const standardFee = getStandardFee(student);
  const discountedFee = student.discountedFee || standardFee;
  const totalFees = discountedFee + addOnPayments.reduce((s, p) => s + p.finalAmount, 0);
  const dueDateStr = currentPayment
    ? new Date(currentPayment.dueDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '';
  const status = currentPayment?.status ?? 'Unpaid';
  const paidAmount = currentPayment?.paidAmount;

  // Fetch logo and QR code in parallel
  const [logoDataUrl, qrDataUrl] = await Promise.all([
    getLogoDataUrl(school?.logo),
    getQrCodeDataUrl(challanNumber),
  ]);

  const palette = buildPalette();

  const commonOpts: Omit<ChallanColumnOpts, 'copyLabel'> = {
    palette,
    school,
    feeSettings,
    showBankDetails,
    challanNumber,
    dateStr,
    feeMonthStr,
    studentName,
    className: getClassName(student.id),
    sectionName: getSectionName(student.id),
    bFormCrc: student.bFormCrc,
    discountedFee,
    addOnPayments,
    totalFees,
    dueDateStr,
    status,
    paidAmount,
    logoDataUrl,
    qrDataUrl,
  };

  // ── Page border (rounded) ──
  pdf.setDrawColor(...palette.border);
  pdf.setLineWidth(0.3);
  drawRoundedRect(pdf, margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin, 3, 'S');

  // ── Column dividers (dashed) ──
  const div1X = margin + columnWidth;
  const div2X = margin + columnWidth + dividerWidth + columnWidth;
  pdf.setDrawColor(...palette.divider);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.line(div1X, margin + 5, div1X, pageHeight - margin - 5);
  pdf.line(div2X, margin + 5, div2X, pageHeight - margin - 5);
  pdf.setLineDashPattern([], 0);

  // ── Draw 3 challan columns ──
  const yStart = margin + 5;
  for (let i = 0; i < COPY_LABELS.length; i++) {
    const xLeft = margin + i * (columnWidth + dividerWidth);
    const xRight = xLeft + columnWidth;
    drawOneChallanInColumn(pdf, xLeft, xRight, yStart, pageHeight, {
      ...commonOpts,
      copyLabel: COPY_LABELS[i],
    });
  }

  const fileName = `Challan-${studentName.replace(/[^a-zA-Z0-9]/g, '_')}-${challanNumber}.pdf`;
  pdf.save(fileName);
}

// ─── Single-payment challan PDF (used by student fee history page) ──────────

export async function generateSinglePaymentChallanPdf(options: {
  student: Student;
  payment: StudentFeePayment;
  userSchoolId?: string;
  getStudentName: GetStudentMeta;
  getClassName: GetStudentMeta;
  getSectionName: GetStudentMeta;
}) {
  const { default: jsPDF } = await import('jspdf');
  const { student, payment, userSchoolId, getStudentName, getClassName, getSectionName } = options;

  const pdf = new jsPDF('l', 'mm', 'a4');
  const school = userSchoolId ? getSchoolById(userSchoolId) : null;
  const feeSettings = userSchoolId ? getFeeSettings(userSchoolId) : null;
  const showBankDetails = hasBankDetails(feeSettings);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const dividerWidth = 0.4;
  const columnWidth = (pageWidth - 2 * margin - 2 * dividerWidth) / 3;

  const challanNumber = `CH-${payment.id.substring(0, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  let feeMonthStr = '';
  if (payment.month && payment.year) {
    feeMonthStr = `${MONTH_NAMES[payment.month - 1]} ${payment.year}`;
  } else {
    const paymentDate = new Date(payment.dueDate);
    feeMonthStr = `${MONTH_NAMES[paymentDate.getMonth()]} ${paymentDate.getFullYear()}`;
  }

  const studentName = getStudentName(student.id);
  const dueDateStr = new Date(payment.dueDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const [logoDataUrl, qrDataUrl] = await Promise.all([
    getLogoDataUrl(school?.logo),
    getQrCodeDataUrl(challanNumber),
  ]);

  const palette = buildPalette();

  const commonOpts: Omit<ChallanColumnOpts, 'copyLabel'> = {
    palette,
    school,
    feeSettings,
    showBankDetails,
    challanNumber,
    dateStr,
    feeMonthStr,
    studentName,
    className: getClassName(student.id),
    sectionName: getSectionName(student.id),
    bFormCrc: student.bFormCrc,
    discountedFee: payment.finalAmount,
    addOnPayments: [],
    totalFees: payment.finalAmount,
    dueDateStr,
    status: payment.status,
    paidAmount: payment.paidAmount,
    logoDataUrl,
    qrDataUrl,
  };

  // Page border (rounded)
  pdf.setDrawColor(...palette.border);
  pdf.setLineWidth(0.3);
  drawRoundedRect(pdf, margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin, 3, 'S');

  // Column dividers (dashed)
  const div1X = margin + columnWidth;
  const div2X = margin + columnWidth + dividerWidth + columnWidth;
  pdf.setDrawColor(...palette.divider);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.line(div1X, margin + 5, div1X, pageHeight - margin - 5);
  pdf.line(div2X, margin + 5, div2X, pageHeight - margin - 5);
  pdf.setLineDashPattern([], 0);

  const yStart = margin + 5;
  for (let i = 0; i < COPY_LABELS.length; i++) {
    const xLeft = margin + i * (columnWidth + dividerWidth);
    const xRight = xLeft + columnWidth;
    drawOneChallanInColumn(pdf, xLeft, xRight, yStart, pageHeight, {
      ...commonOpts,
      copyLabel: COPY_LABELS[i],
    });
  }

  const fileName = `Challan-${studentName.replace(/[^a-zA-Z0-9]/g, '_')}-${challanNumber}.pdf`;
  pdf.save(fileName);
}

// ─── Invoice PDF ────────────────────────────────────────────────────────────

export async function generateInvoicePdf(options: {
  student: Student;
  userSchoolId?: string;
  getStudentName: GetStudentMeta;
  getClassName: GetStudentMeta;
  getSectionName: GetStudentMeta;
  getStudentPayments: (studentId: string) => StudentFeePayment[];
}) {
  const { default: jsPDF } = await import('jspdf');
  const {
    student,
    userSchoolId,
    getStudentName,
    getClassName,
    getSectionName,
    getStudentPayments,
  } = options;

  const pdf = new jsPDF();
  const school = userSchoolId ? getSchoolById(userSchoolId) : null;
  const feeSettings = userSchoolId ? getFeeSettings(userSchoolId) : null;
  const showBankDetails = hasBankDetails(feeSettings);
  const allPayments = getStudentPayments(student.id);
  const paidPayments = allPayments.filter(
    (p) => p.status === 'Paid' || p.status === 'Partial',
  );
  if (paidPayments.length === 0) {
    throw new Error('No paid fees found for this student');
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;
  const palette = buildPalette();

  // Fetch logo
  const logoDataUrl = await getLogoDataUrl(school?.logo);

  // ── Header with logo ──
  if (logoDataUrl) {
    const logoSize = 18;
    pdf.addImage(logoDataUrl, 'PNG', pageWidth / 2 - logoSize / 2, y, logoSize, logoSize);
    y += logoSize + 3;
  }

  if (school) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...palette.brand);
    pdf.text(school.name, pageWidth / 2, y, { align: 'center' });
    y += 6;
    pdf.setTextColor(...palette.darkText);
    if (school.campusName) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(school.campusName, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }
    pdf.setFontSize(9);
    pdf.setTextColor(...palette.muted);
    if (school.address) {
      pdf.text(school.address, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }
    if (school.phone) {
      pdf.text(`Phone: ${school.phone}`, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }
    pdf.setTextColor(...palette.darkText);
    if (showBankDetails && feeSettings) {
      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bank details for fee payment', pageWidth / 2, y, { align: 'center' });
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Bank: ${feeSettings.bankName}`, pageWidth / 2, y, { align: 'center' });
      y += 4;
      pdf.text(`Account title: ${feeSettings.accountTitle}`, pageWidth / 2, y, { align: 'center' });
      y += 4;
      pdf.text(`Account no: ${feeSettings.accountNumber}`, pageWidth / 2, y, { align: 'center' });
      if (feeSettings.iban) {
        y += 4;
        pdf.text(`IBAN: ${feeSettings.iban}`, pageWidth / 2, y, { align: 'center' });
      }
      if (feeSettings.branch) {
        y += 4;
        pdf.text(`Branch: ${feeSettings.branch}`, pageWidth / 2, y, { align: 'center' });
      }
    }
  }

  y += 8;
  pdf.setDrawColor(...palette.brand);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...palette.brand);
  pdf.text('PAYMENT INVOICE', pageWidth / 2, y, { align: 'center' });
  pdf.setTextColor(...palette.darkText);
  y += 10;

  const invoiceNumber = `INV-${student.id.substring(0, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice No: ${invoiceNumber}`, margin, y);
  pdf.text(`Date: ${dateStr}`, pageWidth - margin, y, { align: 'right' });
  y += 12;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Student Information', margin, y);
  y += 7;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const studentName = getStudentName(student.id);
  pdf.text(`Name: ${studentName}`, margin, y);
  y += 6;
  pdf.text(`Class: ${getClassName(student.id)}`, margin, y);
  pdf.text(`Section: ${getSectionName(student.id)}`, pageWidth / 2, y);
  y += 6;
  if (student.bFormCrc) {
    pdf.text(`B-Form/CRC: ${student.bFormCrc}`, margin, y);
    y += 6;
  }

  y += 8;
  pdf.setDrawColor(...palette.brand);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Payment Details', margin, y);
  y += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const rowH = 6;
  const col1 = margin;
  const col2 = pageWidth - margin - 50;

  paidPayments.forEach((payment, index) => {
    if (index > 0) y += 3;
    pdf.text(`Fee Type: ${payment.feeType}`, col1, y);
    if (payment.month && payment.year) {
      pdf.text(
        `Month: ${MONTH_NAMES[payment.month - 1]} ${payment.year}`,
        col1 + 50,
        y,
      );
    }
    y += rowH;

    pdf.text(
      `Due Date: ${new Date(payment.dueDate).toLocaleDateString('en-GB')}`,
      col1,
      y,
    );
    y += rowH;

    pdf.text(`Amount: ${formatCurrency(payment.amount)}`, col1, y);
    if (payment.discountAmount > 0) {
      pdf.text(
        `Discount: -${formatCurrency(payment.discountAmount)}`,
        col1 + 50,
        y,
      );
    }
    y += rowH;

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total: ${formatCurrency(payment.finalAmount)}`, col1, y);
    y += rowH;

    pdf.setFont('helvetica', 'normal');
    if (payment.paidAmount) {
      pdf.text(`Paid: ${formatCurrency(payment.paidAmount)}`, col1, y);
      pdf.text(`Status: ${payment.status}`, col1 + 50, y);
      y += rowH;
    }
    if (payment.paymentDate) {
      pdf.text(
        `Payment Date: ${new Date(payment.paymentDate).toLocaleDateString('en-GB')}`,
        col1,
        y,
      );
      y += rowH;
    }
  });

  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  y += 5;
  pdf.setDrawColor(...palette.brand);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Paid:', col1, y);
  pdf.setFontSize(11);
  pdf.text(formatCurrency(totalPaid), col2, y, { align: 'right' });
  y += 8;

  y = pageHeight - 20;
  pdf.setDrawColor(...palette.border);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...palette.muted);
  pdf.text(
    'This is a computer-generated invoice. No signature required.',
    pageWidth / 2,
    y,
    { align: 'center' },
  );

  const fileName = `Invoice-${studentName.replace(/[^a-zA-Z0-9]/g, '_')}-${invoiceNumber}.pdf`;
  pdf.save(fileName);
}
