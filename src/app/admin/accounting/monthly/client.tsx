'use client';

import { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Wallet, Briefcase, ArrowLeft, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccounting } from '@/hooks/use-accounting';
import { RevenueBreakdownChart } from '@/components/accounting/revenue-breakdown-chart';
import { ExpensesBreakdownChart } from '@/components/accounting/expenses-breakdown-chart';
import { ROUTES } from '@/constants/routes';
import { getSchoolById } from '@/lib/storage';
import Link from 'next/link';
import type { FeeType } from '@/types';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const REVENUE_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'feeType', label: 'Fee Type' },
  { id: 'amount', label: 'Amount', align: 'right' },
];

const EXPENSE_TABLE_COLUMNS: DataTableColumn[] = [
  { id: 'category', label: 'Category' },
  { id: 'amount', label: 'Amount', align: 'right' },
];

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthlyReportClientProps {
  user: any;
}

export default function MonthlyReportClient({ user }: MonthlyReportClientProps) {
  const { getMonthlySummary } = useAccounting();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Get previous month for comparison
  const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  // Get monthly summary
  const summary = useMemo(() => {
    return getMonthlySummary(selectedMonth, selectedYear, user?.schoolId);
  }, [selectedMonth, selectedYear, user?.schoolId, getMonthlySummary]);

  // Get previous month summary
  const previousSummary = useMemo(() => {
    return getMonthlySummary(previousMonth, previousYear, user?.schoolId);
  }, [previousMonth, previousYear, user?.schoolId, getMonthlySummary]);

  // Calculate percentage changes
  const revenueChange = previousSummary.revenue.total > 0
    ? ((summary.revenue.total - previousSummary.revenue.total) / previousSummary.revenue.total) * 100
    : 0;
  const expensesChange = previousSummary.expenses.total > 0
    ? ((summary.expenses.total - previousSummary.expenses.total) / previousSummary.expenses.total) * 100
    : 0;
  const profitChange = previousSummary.revenue.total > 0
    ? ((summary.profit - previousSummary.profit) / Math.abs(previousSummary.profit || 1)) * 100
    : 0;

  // Revenue breakdown by fee type
  const revenueBreakdown = useMemo(() => {
    return Object.entries(summary.revenue.byFeeType)
      .filter(([_, amount]) => amount > 0)
      .map(([type, amount]) => ({
        type: type as FeeType,
        amount,
        count: 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [summary.revenue.byFeeType]);

  // Expenses breakdown (staff type + other expenses from Expense Management)
  const expensesBreakdown = useMemo(() => {
    const entries: { type: string; amount: number; count: number }[] = [
      ...Object.entries(summary.expenses.byStaffType)
        .filter(([_, amount]) => amount > 0)
        .map(([type, amount]) => ({ type, amount, count: 0 })),
      ...(typeof summary.expenses.otherExpenses === 'number' && summary.expenses.otherExpenses > 0
        ? [{ type: 'Other Expenses', amount: summary.expenses.otherExpenses, count: 0 }]
        : []),
    ];
    return entries.sort((a, b) => b.amount - a.amount);
  }, [summary.expenses.byStaffType, summary.expenses.otherExpenses]);

  // Payment status summary
  const paymentStatusSummary = useMemo(() => {
    const totalRevenue = summary.revenue.total;
    const paidRevenue = summary.revenue.paid;
    const totalExpenses = summary.expenses.total;
    const paidExpenses = summary.expenses.paid;

    return {
      revenue: {
        paid: paidRevenue,
        unpaid: summary.revenue.outstanding,
        partial: totalRevenue - paidRevenue - summary.revenue.outstanding,
        paidPercent: totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0,
      },
      expenses: {
        paid: paidExpenses,
        unpaid: summary.expenses.outstanding,
        partial: totalExpenses - paidExpenses - summary.expenses.outstanding,
        paidPercent: totalExpenses > 0 ? (paidExpenses / totalExpenses) * 100 : 0,
      },
    };
  }, [summary]);

  const [revPage, setRevPage] = useState(1);
  const [revPageSize, setRevPageSize] = useState(10);
  const [expPage, setExpPage] = useState(1);
  const [expPageSize, setExpPageSize] = useState(10);

  useEffect(() => {
    setRevPage(1);
    setExpPage(1);
  }, [selectedMonth, selectedYear]);

  const paginatedRevenueBreakdown = useMemo(() => {
    const start = (revPage - 1) * revPageSize;
    return revenueBreakdown.slice(start, start + revPageSize);
  }, [revenueBreakdown, revPage, revPageSize]);

  const paginatedExpensesBreakdown = useMemo(() => {
    const start = (expPage - 1) * expPageSize;
    return expensesBreakdown.slice(start, start + expPageSize);
  }, [expensesBreakdown, expPage, expPageSize]);

  const profitColor = summary.profit >= 0 ? 'text-slate-800' : 'text-red-600';
  const profitIcon = summary.profit >= 0 ? TrendingUp : TrendingDown;

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const school = user?.schoolId ? getSchoolById(user.schoolId) : null;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const footerHeight = 20;
      const maxY = pageHeight - footerHeight;
      let yPos = margin;
      let currentPage = 1;

      const blackColor = [0, 0, 0];
      const grayColor = [100, 100, 100];

      const checkNewPage = (requiredSpace: number = 10) => {
        if (yPos + requiredSpace > maxY) {
          pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
          pdf.setLineWidth(0.3);
          pdf.line(margin, maxY, pageWidth - margin, maxY);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          pdf.text(`Page ${currentPage}`, pageWidth / 2, maxY + 5, { align: 'center' });

          pdf.addPage();
          currentPage++;
          yPos = margin;

          if (school) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
            pdf.text(school.name, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`MONTHLY FINANCIAL REPORT - ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;
          }
        }
      };

      if (school) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.text(school.name, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;

        if (school.campusName) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(school.campusName, pageWidth / 2, yPos, { align: 'center' });
          yPos += 5;
        }

        pdf.setFontSize(9);
        if (school.address) {
          pdf.text(school.address, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
        }
      }

      yPos += 8;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MONTHLY FINANCIAL REPORT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Period: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 15;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Financial Summary', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Revenue', formatCurrency(summary.revenue.total)],
        ['Paid Revenue', formatCurrency(summary.revenue.paid)],
        ['Outstanding Revenue', formatCurrency(summary.revenue.outstanding)],
        ['Total Expenses', formatCurrency(summary.expenses.total)],
        ['Paid Expenses', formatCurrency(summary.expenses.paid)],
        ['Outstanding Expenses', formatCurrency(summary.expenses.outstanding)],
        ['Net Profit/Loss', formatCurrency(summary.profit)],
        ['Profit Margin', `${summary.profitMargin.toFixed(1)}%`],
      ];

      summaryData.forEach(([label, value]) => {
        checkNewPage(6);
        pdf.text(label + ':', margin, yPos);
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      });

      if (revenueChange !== 0 || expensesChange !== 0 || profitChange !== 0) {
        checkNewPage(15);
        yPos += 5;
        pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;

        checkNewPage(8);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Comparison with Previous Month', margin, yPos);
        yPos += 8;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        if (revenueChange !== 0) {
          checkNewPage(6);
          pdf.text(`Revenue Change: ${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`, margin, yPos);
          yPos += 6;
        }
        if (expensesChange !== 0) {
          checkNewPage(6);
          pdf.text(`Expenses Change: ${expensesChange >= 0 ? '+' : ''}${expensesChange.toFixed(1)}%`, margin, yPos);
          yPos += 6;
        }
        if (profitChange !== 0) {
          checkNewPage(6);
          pdf.text(`Profit Change: ${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`, margin, yPos);
          yPos += 6;
        }
      }

      checkNewPage(15);
      yPos += 5;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      checkNewPage(8);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Revenue Breakdown by Fee Type', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      if (revenueBreakdown.length === 0) {
        checkNewPage(6);
        pdf.text('No revenue data available', margin, yPos);
        yPos += 6;
      } else {
        revenueBreakdown.forEach((item) => {
          checkNewPage(6);
          pdf.text(`${item.type.replace(/([A-Z])/g, ' $1').trim()}:`, margin, yPos);
          pdf.text(formatCurrency(item.amount), pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        });
      }

      checkNewPage(15);
      yPos += 5;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      checkNewPage(8);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Expenses Breakdown by Staff Type', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      if (expensesBreakdown.length === 0) {
        checkNewPage(6);
        pdf.text('No expense data available', margin, yPos);
        yPos += 6;
      } else {
        expensesBreakdown.forEach((item) => {
          checkNewPage(6);
          pdf.text(`${item.type}:`, margin, yPos);
          pdf.text(formatCurrency(item.amount), pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        });
      }

      checkNewPage(30);
      yPos += 5;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      checkNewPage(8);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Status Summary', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      checkNewPage(6);
      pdf.text('Revenue:', margin, yPos);
      yPos += 6;
      checkNewPage(6);
      pdf.text(`  Paid: ${formatCurrency(paymentStatusSummary.revenue.paid)} (${paymentStatusSummary.revenue.paidPercent.toFixed(1)}%)`, margin + 5, yPos);
      yPos += 6;
      checkNewPage(6);
      pdf.text(`  Partial: ${formatCurrency(paymentStatusSummary.revenue.partial)}`, margin + 5, yPos);
      yPos += 6;
      checkNewPage(6);
      pdf.text(`  Unpaid: ${formatCurrency(paymentStatusSummary.revenue.unpaid)}`, margin + 5, yPos);
      yPos += 8;
      checkNewPage(6);
      pdf.text('Expenses:', margin, yPos);
      yPos += 6;
      checkNewPage(6);
      pdf.text(`  Paid: ${formatCurrency(paymentStatusSummary.expenses.paid)} (${paymentStatusSummary.expenses.paidPercent.toFixed(1)}%)`, margin + 5, yPos);
      yPos += 6;
      checkNewPage(6);
      pdf.text(`  Partial: ${formatCurrency(paymentStatusSummary.expenses.partial)}`, margin + 5, yPos);
      yPos += 6;
      checkNewPage(6);
      pdf.text(`  Unpaid: ${formatCurrency(paymentStatusSummary.expenses.unpaid)}`, margin + 5, yPos);

      const footerYPos = Math.max(yPos + 10, maxY);
      pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.setLineWidth(0.3);
      pdf.line(margin, footerYPos, pageWidth - margin, footerYPos);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.text(`Page ${currentPage}`, pageWidth / 2, footerYPos + 5, { align: 'center' });
      pdf.text('This is a computer-generated report.', pageWidth / 2, footerYPos + 10, { align: 'center' });

      pdf.save(`Monthly-Report-${MONTH_NAMES[selectedMonth - 1]}-${selectedYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={ROUTES.ADMIN.ACCOUNTING.OVERVIEW}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monthly Financial Report</h1>
            <p className="text-slate-700 mt-1">Detailed financial breakdown for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
          >
            {MONTH_NAMES.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700"
          >
            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {formatCurrency(summary.revenue.total)}
                </p>
                {revenueChange !== 0 && (
                  <p className={`text-xs mt-1 ${revenueChange >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-slate-800" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(summary.expenses.total)}
                </p>
                {expensesChange !== 0 && (
                  <p className={`text-xs mt-1 ${expensesChange >= 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {expensesChange >= 0 ? '+' : ''}{expensesChange.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Net Profit/Loss</p>
                <p className={`text-2xl font-bold mt-1 ${profitColor}`}>
                  {formatCurrency(summary.profit)}
                </p>
                {profitChange !== 0 && (
                  <p className={`text-xs mt-1 ${profitChange >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${summary.profit >= 0 ? 'bg-slate-50' : 'bg-red-50'
                }`}>
                {profitIcon === TrendingUp ? (
                  <TrendingUp className="w-6 h-6 text-slate-800" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Profit Margin</p>
                <p className={`text-2xl font-bold mt-1 ${profitColor}`}>
                  {summary.profitMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  {summary.revenue.total > 0
                    ? `${((summary.profit / summary.revenue.total) * 100).toFixed(1)}% of revenue`
                    : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Revenue by fee type for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <RevenueBreakdownChart data={summary.revenue.byFeeType} />
            </div>
            <div>
              <PaginatedDataTable
                className="border-0 shadow-none"
                columns={REVENUE_TABLE_COLUMNS}
                loading={false}
                isEmpty={revenueBreakdown.length === 0}
                emptyContent={
                  <div className="py-8 text-center text-slate-700">No revenue data available</div>
                }
                totalCount={revenueBreakdown.length}
                page={revPage}
                pageSize={revPageSize}
                onPageChange={setRevPage}
                onPageSizeChange={setRevPageSize}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
              >
                {paginatedRevenueBreakdown.map((item) => (
                  <tr key={item.type} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {item.type.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </PaginatedDataTable>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses Breakdown</CardTitle>
          <CardDescription>Expenses by category for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ExpensesBreakdownChart
                data={{
                  ...summary.expenses.byStaffType,
                  ...(typeof summary.expenses.otherExpenses === 'number' && summary.expenses.otherExpenses > 0
                    ? { 'Other Expenses': summary.expenses.otherExpenses }
                    : {}),
                }}
              />
            </div>
            <div>
              <PaginatedDataTable
                className="border-0 shadow-none"
                columns={EXPENSE_TABLE_COLUMNS}
                loading={false}
                isEmpty={expensesBreakdown.length === 0}
                emptyContent={
                  <div className="py-8 text-center text-slate-700">No expense data available</div>
                }
                totalCount={expensesBreakdown.length}
                page={expPage}
                pageSize={expPageSize}
                onPageChange={setExpPage}
                onPageSizeChange={setExpPageSize}
                pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
              >
                {paginatedExpensesBreakdown.map((item) => (
                  <tr key={item.type} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-900">{item.type}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </PaginatedDataTable>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Payment Status</CardTitle>
            <CardDescription>Payment breakdown for revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Paid</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-800">
                    {formatCurrency(paymentStatusSummary.revenue.paid)}
                  </span>
                  <p className="text-xs text-slate-700">
                    {paymentStatusSummary.revenue.paidPercent.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Partial</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(paymentStatusSummary.revenue.partial)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Unpaid</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(paymentStatusSummary.revenue.unpaid)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses Payment Status</CardTitle>
            <CardDescription>Payment breakdown for expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Paid</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-800">
                    {formatCurrency(paymentStatusSummary.expenses.paid)}
                  </span>
                  <p className="text-xs text-slate-700">
                    {paymentStatusSummary.expenses.paidPercent.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Partial</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(paymentStatusSummary.expenses.partial)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Unpaid</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(paymentStatusSummary.expenses.unpaid)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
