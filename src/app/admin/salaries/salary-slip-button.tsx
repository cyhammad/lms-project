'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useAlert } from '@/hooks/use-alert';
import { getSchoolById } from '@/lib/storage';
import { getAttendanceByStaff } from '@/lib/attendance-storage';
import {
  getSecurityDeductionByMonthYear,
} from '@/lib/security-deduction-storage';
import { getLogoDataUrl } from '@/app/admin/fees/components/feesPdf';
import type { StaffSalaryPayment, Teacher } from '@/types';

interface SalarySlipButtonProps {
  payment: StaffSalaryPayment;
  staff: Teacher | undefined;
  schoolId?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

/** Number to words (Pakistani Rupee format) */
function amountToWords(n: number): string {
  const num = Math.round(n);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  function toWords(x: number): string {
    if (x >= 1e7) return toWords(Math.floor(x / 1e7)) + ' Crore ' + (x % 1e7 === 0 ? '' : toWords(x % 1e7));
    if (x >= 1e5) return toWords(Math.floor(x / 1e5)) + ' Lakh ' + (x % 1e5 === 0 ? '' : toWords(x % 1e5));
    if (x >= 1000) return toWords(Math.floor(x / 1000)) + ' Thousand ' + (x % 1000 === 0 ? '' : toWords(x % 1000));
    if (x >= 100) return ones[Math.floor(x / 100)] + ' Hundred ' + (x % 100 === 0 ? '' : toWords(x % 100));
    if (x >= 20) return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
    return ones[x] || '';
  }
  return toWords(num).replace(/\s+/g, ' ').trim() + ' Only';
}

// ─── LMS Payslip Color Palette ────────────────────────────────────────────
const C = {
  // Emerald brand
  emerald500: [16, 185, 129] as const,    // #10b981
  emerald600: [5, 150, 105] as const,     // #059669
  emerald700: [4, 120, 87] as const,      // #047857
  emerald50: [236, 253, 245] as const,   // #ecfdf5
  emerald100: [209, 250, 229] as const,   // #d1fae5
  // Slate neutrals
  white: [255, 255, 255] as const,
  slate50: [248, 250, 252] as const,
  slate100: [241, 245, 249] as const,
  slate200: [226, 232, 240] as const,
  slate300: [203, 213, 225] as const,
  slate400: [148, 163, 184] as const,
  slate500: [100, 116, 139] as const,
  slate600: [71, 85, 105] as const,
  slate800: [30, 41, 59] as const,
  slate900: [15, 23, 42] as const,
  black: [0, 0, 0] as const,
};

export function SalarySlipButton({ payment, staff, schoolId }: SalarySlipButtonProps) {
  const { showError } = useAlert();

  const handleDownloadSalarySlip = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();

      if (!staff) {
        showError('Staff member not found');
        return;
      }

      const school = schoolId ? getSchoolById(schoolId) : null;
      const staffName = staff.name || 'Unknown';

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 14;
      let y = margin;

      // ── Gather data ──
      const securityDeduction = getSecurityDeductionByMonthYear(staff.id, payment.month, payment.year);
      const securityAmount = securityDeduction?.amount || 0;
      const leaveAmount = payment.deductions - securityAmount;
      const allAttendances = getAttendanceByStaff(staff.id);
      const monthStart = new Date(payment.year, payment.month - 1, 1);
      const monthEnd = new Date(payment.year, payment.month, 0);
      const leaveDays = allAttendances.filter((att) => {
        const attDate = new Date(att.date);
        return attDate >= monthStart && attDate <= monthEnd && att.status === 'Absent';
      }).length;
      const daysInMonth = new Date(payment.year, payment.month, 0).getDate();
      const paidDays = Math.max(0, daysInMonth - leaveDays);
      const periodStr = `${MONTH_NAMES[payment.month - 1]} ${payment.year}`;
      const payDateStr = payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Date(payment.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const joinDateStr = staff.createdAt
        ? new Date(staff.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';
      const employeeId = staff.id.substring(0, 8).toUpperCase();
      const designation = staff.staffType || 'Staff';

      // Fetch logo
      const logoDataUrl = await getLogoDataUrl(school?.logo);

      // ════════════════════════════════════════════════════════════════════
      // HEADER: Logo + Company Name (left) | Payslip Period (right)
      // ════════════════════════════════════════════════════════════════════
      const logoSize = 14;
      const logoX = margin;

      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, 'PNG', logoX, y, logoSize, logoSize);
      } else {
        // Fallback emerald square with initials
        pdf.setFillColor(...C.emerald500);
        pdf.roundedRect(logoX, y, logoSize, logoSize, 2, 2, 'F');
        if (school) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...C.white);
          const initials = school.name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
          pdf.text(initials, logoX + logoSize / 2, y + logoSize / 2 + 1, { align: 'center' });
        }
      }

      const textStartX = logoX + logoSize + 5;

      // Company name
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.slate900);
      pdf.text(school ? school.name : 'LMS', textStartX, y + 6);

      // Campus / Address
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.slate500);
      const companyDetail = school ? (school.campusName || school.address || '') : '';
      if (companyDetail) pdf.text(companyDetail, textStartX, y + 11);

      // Right side: Payslip month
      pdf.setFontSize(9);
      pdf.setTextColor(...C.slate400);
      pdf.text('Payslip For the Month', pageWidth - margin, y + 4, { align: 'right' });

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.slate800);
      pdf.text(periodStr, pageWidth - margin, y + 11, { align: 'right' });

      y += logoSize + 6;

      // Header separator
      pdf.setDrawColor(...C.emerald500);
      pdf.setLineWidth(0.6);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // ════════════════════════════════════════════════════════════════════
      // EMPLOYEE SUMMARY (left) | NET PAY BOX (right)
      // ════════════════════════════════════════════════════════════════════
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.emerald700);
      pdf.text('EMPLOYEE SUMMARY', margin, y);
      y += 8;

      const colonX = margin + 38;
      const valueX = margin + 43;
      const summaryStartY = y;

      const summaryRows: [string, string][] = [
        ['Employee Name', staffName],
        ['Designation', designation],
        ['Employee ID', employeeId],
        ['Date of Joining', joinDateStr],
        ['Pay Period', periodStr],
        ['Pay Date', payDateStr],
      ];

      pdf.setFontSize(9);
      summaryRows.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...C.slate500);
        pdf.text(label, margin, y);
        pdf.setTextColor(...C.slate800);
        pdf.text(':', colonX, y);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, valueX, y);
        y += 7;
      });

      // ── Net Pay Box (right side) ──
      const boxW = 68;
      const boxH = 48;
      const boxX = pageWidth - margin - boxW;
      const boxY = summaryStartY - 5;

      // Outer card
      pdf.setDrawColor(...C.slate200);
      pdf.setLineWidth(0.4);
      pdf.setFillColor(...C.white);
      pdf.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'FD');

      // Inner emerald highlight box
      const greenBoxH = 24;
      pdf.setFillColor(...C.emerald50);
      pdf.rect(boxX + 0.5, boxY + 0.5, boxW - 1, greenBoxH, 'F');

      // Emerald left accent inside green box
      pdf.setFillColor(...C.emerald500);
      pdf.rect(boxX + 4, boxY + 5, 1.5, greenBoxH - 10, 'F');

      // Net pay amount
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.slate900);
      pdf.text(formatCurrency(payment.finalAmount), boxX + 8, boxY + 13);

      // Label
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.emerald600);
      pdf.text('Employee Net Pay', boxX + 8, boxY + 19);

      // Dotted separator
      pdf.setDrawColor(...C.slate200);
      pdf.setLineWidth(0.3);
      pdf.setLineDashPattern([1.5, 1], 0);
      pdf.line(boxX + 4, boxY + greenBoxH + 2, boxX + boxW - 4, boxY + greenBoxH + 2);
      pdf.setLineDashPattern([], 0);

      // Paid Days / LOP Days
      const detailY = boxY + greenBoxH + 9;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.slate500);
      pdf.text('Paid Days', boxX + 5, detailY);
      pdf.setTextColor(...C.slate800);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`:  ${paidDays}`, boxX + 28, detailY);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.slate500);
      pdf.text('LOP Days', boxX + 5, detailY + 7);
      pdf.setTextColor(...C.slate800);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`:  ${leaveDays}`, boxX + 28, detailY + 7);

      // ── Dotted line separator ──
      y += 2;
      pdf.setDrawColor(...C.slate200);
      pdf.setLineWidth(0.3);
      pdf.setLineDashPattern([1.5, 1], 0);
      pdf.line(margin, y, pageWidth - margin, y);
      pdf.setLineDashPattern([], 0);
      y += 12;

      // ════════════════════════════════════════════════════════════════════
      // EARNINGS & DEDUCTIONS TABLE
      // ════════════════════════════════════════════════════════════════════
      const deductionLines: [string, number][] = [];
      if (securityAmount > 0) deductionLines.push(['Security Deduction', securityAmount]);
      if (leaveAmount > 0) deductionLines.push(['Leave Deduction', leaveAmount]);
      if (deductionLines.length === 0 && payment.deductions > 0) deductionLines.push(['Deductions', payment.deductions]);

      const earningLines: [string, number][] = [['Basic', payment.amount]];

      const tableLeft = margin;
      const tableRight = pageWidth - margin;
      const tableW = tableRight - tableLeft;
      const earnEnd = tableLeft + tableW * 0.5;
      const deducStart = earnEnd;
      const ytdColW = 28;

      const tableTopY = y;
      const headerH = 10;
      const rowH = 9;
      const numRows = Math.max(earningLines.length, deductionLines.length);

      // ── Table header background ──
      pdf.setFillColor(...C.emerald50);
      pdf.roundedRect(tableLeft, tableTopY, tableW, headerH, 2, 2, 'F');
      // Overwrite bottom corners with flat rect so only top is rounded
      pdf.rect(tableLeft, tableTopY + 4, tableW, headerH - 4, 'F');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.emerald700);

      const headerTextY = tableTopY + 7;
      pdf.text('EARNINGS', tableLeft + 5, headerTextY);
      pdf.text('AMOUNT', earnEnd - ytdColW - 4, headerTextY, { align: 'right' });
      pdf.setTextColor(...C.slate400);
      pdf.text('YTD', earnEnd - 5, headerTextY, { align: 'right' });

      pdf.setTextColor(...C.emerald700);
      pdf.text('DEDUCTIONS', deducStart + 5, headerTextY);
      pdf.text('AMOUNT', tableRight - ytdColW - 4, headerTextY, { align: 'right' });
      pdf.setTextColor(...C.slate400);
      pdf.text('YTD', tableRight - 5, headerTextY, { align: 'right' });

      // Header bottom line
      pdf.setDrawColor(...C.slate200);
      pdf.setLineWidth(0.3);
      pdf.line(tableLeft, tableTopY + headerH, tableRight, tableTopY + headerH);

      // ── Table Rows ──
      let currentY = tableTopY + headerH + 7;
      pdf.setFontSize(9);

      for (let i = 0; i < numRows; i++) {
        // Alternate row background
        if (i % 2 === 1) {
          pdf.setFillColor(...C.slate50);
          pdf.rect(tableLeft, currentY - 5, tableW, rowH, 'F');
        }

        // Earnings column
        if (i < earningLines.length) {
          const [label, amt] = earningLines[i];
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...C.slate800);
          pdf.text(label, tableLeft + 5, currentY);
          pdf.setFont('helvetica', 'bold');
          pdf.text(formatCurrency(amt), earnEnd - ytdColW - 4, currentY, { align: 'right' });
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...C.slate400);
          pdf.text(formatCurrency(amt), earnEnd - 5, currentY, { align: 'right' });
        }

        // Deductions column
        if (i < deductionLines.length) {
          const [label, amt] = deductionLines[i];
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...C.slate800);
          pdf.text(label, deducStart + 5, currentY);
          pdf.setFont('helvetica', 'bold');
          pdf.text(formatCurrency(amt), tableRight - ytdColW - 4, currentY, { align: 'right' });
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...C.slate400);
          pdf.text(formatCurrency(amt), tableRight - 5, currentY, { align: 'right' });
        }
        currentY += rowH;
      }

      // ── Totals row ──
      const totalsY = currentY - 2;
      const totalsH = 11;
      pdf.setFillColor(...C.slate100);
      pdf.rect(tableLeft, totalsY, tableW, totalsH, 'F');

      const totalsTextY = totalsY + 7;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...C.emerald700);
      pdf.text('Gross Earnings', tableLeft + 5, totalsTextY);
      pdf.setTextColor(...C.slate900);
      pdf.text(formatCurrency(payment.amount), earnEnd - ytdColW - 4, totalsTextY, { align: 'right' });

      pdf.setTextColor(...C.emerald700);
      pdf.text('Total Deductions', deducStart + 5, totalsTextY);
      pdf.setTextColor(...C.slate900);
      pdf.text(formatCurrency(payment.deductions), tableRight - ytdColW - 4, totalsTextY, { align: 'right' });

      // Center divider line for the entire table
      pdf.setDrawColor(...C.slate200);
      pdf.setLineWidth(0.2);
      pdf.line(earnEnd, tableTopY + headerH, earnEnd, totalsY + totalsH);

      // Table outer border
      pdf.setDrawColor(...C.slate200);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(tableLeft, tableTopY, tableW, totalsY + totalsH - tableTopY, 2, 2, 'S');

      y = totalsY + totalsH + 10;

      // ════════════════════════════════════════════════════════════════════
      // TOTAL NET PAYABLE
      // ════════════════════════════════════════════════════════════════════
      const totalBoxH = 18;

      // Outer card
      pdf.setDrawColor(...C.slate200);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(tableLeft, y, tableW, totalBoxH, 2, 2, 'S');

      // Emerald amount box on right
      const netAmountW = 50;
      pdf.setFillColor(...C.emerald50);
      pdf.rect(tableRight - netAmountW, y + 0.5, netAmountW - 0.5, totalBoxH - 1, 'F');

      // Labels
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...C.slate900);
      pdf.text('TOTAL NET PAYABLE', tableLeft + 6, y + 7);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...C.slate400);
      pdf.text('Gross Earnings - Total Deductions', tableLeft + 6, y + 13);

      // Amount
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(...C.emerald700);
      pdf.text(formatCurrency(payment.finalAmount), tableRight - netAmountW / 2, y + 11, { align: 'center' });

      y += totalBoxH + 10;

      // ════════════════════════════════════════════════════════════════════
      // AMOUNT IN WORDS
      // ════════════════════════════════════════════════════════════════════
      pdf.setFontSize(9);
      const wordsPrefix = 'Amount In Words :  ';
      const wordsValue = `Pakistani Rupee ${amountToWords(payment.finalAmount)}`;

      const fullText = wordsPrefix + wordsValue;
      const fullTextWidth = pdf.getTextWidth(fullText);
      const startX = tableRight - fullTextWidth;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.slate500);
      pdf.text(wordsPrefix, startX, y);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.slate800);
      pdf.text(wordsValue, startX + pdf.getTextWidth(wordsPrefix), y);

      y += 14;

      // ════════════════════════════════════════════════════════════════════
      // FOOTER
      // ════════════════════════════════════════════════════════════════════
      pdf.setDrawColor(...C.emerald500);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(...C.slate400);
      pdf.text(
        '-- This document has been automatically generated by LMS; therefore, a signature is not required. --',
        pageWidth / 2,
        y,
        { align: 'center' },
      );

      const fileName = `Salary_Slip_${staffName.replace(/\s+/g, '_')}_${MONTH_NAMES[payment.month - 1]}_${payment.year}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating salary slip:', error);
      showError('Failed to generate salary slip. Please try again.');
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDownloadSalarySlip} className="h-8">
      <FileText className="w-4 h-4 mr-1.5" />
      Payslip
    </Button>
  );
}
