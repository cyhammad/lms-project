'use client';

import { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Briefcase, ArrowLeft, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccounting } from '@/hooks/use-accounting';
import { RevenueExpensesChart } from '@/components/accounting/revenue-expenses-chart';
import { ProfitLossChart } from '@/components/accounting/profit-loss-chart';
import { RevenueBreakdownChart } from '@/components/accounting/revenue-breakdown-chart';
import { ExpensesBreakdownChart } from '@/components/accounting/expenses-breakdown-chart';
import { ROUTES } from '@/constants/routes';
import { getSchoolById } from '@/lib/storage';
import Link from 'next/link';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const MONTHLY_BREAKDOWN_COLUMNS: DataTableColumn[] = [
  { id: 'month', label: 'Month' },
  { id: 'revenue', label: 'Revenue', align: 'right' },
  { id: 'expenses', label: 'Expenses', align: 'right' },
  { id: 'profit', label: 'Profit/Loss', align: 'right' },
  { id: 'margin', label: 'Margin', align: 'right' },
];

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface YearlyReportClientProps {
  user: any;
}

export default function YearlyReportClient({ user }: YearlyReportClientProps) {
  const { getYearlySummary, getMonthlyTrends } = useAccounting();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Get previous year for comparison
  const previousYear = selectedYear - 1;

  // Get yearly summary
  const summary = useMemo(() => {
    return getYearlySummary(selectedYear, user?.schoolId);
  }, [selectedYear, user?.schoolId, getYearlySummary]);

  // Get monthly trends for the year
  const monthlyTrends = useMemo(() => {
    return getMonthlyTrends(selectedYear, user?.schoolId);
  }, [selectedYear, user?.schoolId, getMonthlyTrends]);

  // Get previous year summary
  const previousSummary = useMemo(() => {
    return getYearlySummary(previousYear, user?.schoolId);
  }, [previousYear, user?.schoolId, getYearlySummary]);

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

  // Calculate average monthly revenue/expenses
  const avgMonthlyRevenue = summary.revenue.total / 12;
  const avgMonthlyExpenses = summary.expenses.total / 12;

  // Monthly breakdown table data
  const monthlyBreakdown = useMemo(() => {
    return monthlyTrends.map((monthSummary, index) => ({
      month: MONTH_NAMES[index],
      monthNum: index + 1,
      revenue: monthSummary.revenue.total,
      expenses: monthSummary.expenses.total,
      profit: monthSummary.profit,
      profitMargin: monthSummary.profitMargin,
    }));
  }, [monthlyTrends]);

  const profitColor = summary.profit >= 0 ? 'text-slate-800' : 'text-red-600';
  const profitIcon = summary.profit >= 0 ? TrendingUp : TrendingDown;

  const [mbPage, setMbPage] = useState(1);
  const [mbPageSize, setMbPageSize] = useState(10);

  useEffect(() => {
    setMbPage(1);
  }, [selectedYear]);

  const paginatedMonthlyBreakdown = useMemo(() => {
    const start = (mbPage - 1) * mbPageSize;
    return monthlyBreakdown.slice(start, start + mbPageSize);
  }, [monthlyBreakdown, mbPage, mbPageSize]);

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
            pdf.text(`YEARLY FINANCIAL REPORT - ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
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
      pdf.text('YEARLY FINANCIAL REPORT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Period: ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
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
        ['Average Monthly Revenue', formatCurrency(avgMonthlyRevenue)],
        ['Paid Revenue', formatCurrency(summary.revenue.paid)],
        ['Outstanding Revenue', formatCurrency(summary.revenue.outstanding)],
        ['Total Expenses', formatCurrency(summary.expenses.total)],
        ['Average Monthly Expenses', formatCurrency(avgMonthlyExpenses)],
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
        pdf.text('Year-over-Year Comparison', margin, yPos);
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
      const revenueBreakdown = Object.entries(summary.revenue.byFeeType)
        .filter(([_, amount]) => amount > 0)
        .sort(([_, a], [__, b]) => b - a);

      if (revenueBreakdown.length === 0) {
        checkNewPage(6);
        pdf.text('No revenue data available', margin, yPos);
        yPos += 6;
      } else {
        revenueBreakdown.forEach(([type, amount]) => {
          checkNewPage(6);
          pdf.text(`${type.replace(/([A-Z])/g, ' $1').trim()}:`, margin, yPos);
          pdf.text(formatCurrency(amount), pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        });
      }

      yPos += 5;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

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
      const expensesBreakdown = [
        ...Object.entries(summary.expenses.byStaffType),
        ...(typeof summary.expenses.otherExpenses === 'number' && summary.expenses.otherExpenses > 0
          ? [['Other Expenses', summary.expenses.otherExpenses] as const]
          : []),
      ]
        .filter(([_, amount]) => amount > 0)
        .sort(([_, a], [__, b]) => b - a);

      if (expensesBreakdown.length === 0) {
        checkNewPage(6);
        pdf.text('No expense data available', margin, yPos);
        yPos += 6;
      } else {
        expensesBreakdown.forEach(([type, amount]) => {
          checkNewPage(6);
          pdf.text(`${type}:`, margin, yPos);
          pdf.text(formatCurrency(amount), pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        });
      }

      checkNewPage(20);
      yPos += 5;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      checkNewPage(8);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Monthly Breakdown', margin, yPos);
      yPos += 8;

      checkNewPage(12);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Month', margin, yPos);
      pdf.text('Revenue', margin + 35, yPos);
      pdf.text('Expenses', margin + 70, yPos);
      pdf.text('Profit/Loss', margin + 105, yPos);
      pdf.text('Margin', margin + 140, yPos);
      yPos += 6;
      pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      monthlyBreakdown.forEach((month) => {
        checkNewPage(6);
        pdf.text(month.month, margin, yPos);
        pdf.text(formatCurrency(month.revenue), margin + 35, yPos);
        pdf.text(formatCurrency(month.expenses), margin + 70, yPos);
        pdf.text(formatCurrency(month.profit), margin + 105, yPos);
        pdf.text(`${month.profitMargin.toFixed(1)}%`, margin + 140, yPos);
        yPos += 6;
      });

      const footerYPos = Math.max(yPos + 10, maxY);
      pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.setLineWidth(0.3);
      pdf.line(margin, footerYPos, pageWidth - margin, footerYPos);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.text(`Page ${currentPage}`, pageWidth / 2, footerYPos + 5, { align: 'center' });
      pdf.text('This is a computer-generated report.', pageWidth / 2, footerYPos + 10, { align: 'center' });

      pdf.save(`Yearly-Report-${selectedYear}.pdf`);
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
            <h1 className="text-2xl font-bold text-slate-900">Yearly Financial Report</h1>
            <p className="text-slate-700 mt-1">Complete financial overview for {selectedYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
                <p className="text-xs text-slate-700 mt-1">
                  Avg: {formatCurrency(avgMonthlyRevenue)}/month
                </p>
                {revenueChange !== 0 && (
                  <p className={`text-xs mt-1 ${revenueChange >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs {previousYear}
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
                <p className="text-xs text-slate-700 mt-1">
                  Avg: {formatCurrency(avgMonthlyExpenses)}/month
                </p>
                {expensesChange !== 0 && (
                  <p className={`text-xs mt-1 ${expensesChange >= 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {expensesChange >= 0 ? '+' : ''}{expensesChange.toFixed(1)}% vs {previousYear}
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
                    {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}% vs {previousYear}
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
                  Annual margin
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly comparison for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart data={monthlyTrends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit/Loss Trend</CardTitle>
            <CardDescription>Monthly profit/loss for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitLossChart data={monthlyTrends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>By fee type for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueBreakdownChart data={summary.revenue.byFeeType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses Breakdown</CardTitle>
            <CardDescription>By category for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesBreakdownChart
              data={{
                ...summary.expenses.byStaffType,
                ...(typeof summary.expenses.otherExpenses === 'number' && summary.expenses.otherExpenses > 0
                  ? { 'Other Expenses': summary.expenses.otherExpenses }
                  : {}),
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Monthly Breakdown</h3>
          <p className="text-sm text-slate-700 mt-1">Financial data for each month of {selectedYear}</p>
        </div>
        <PaginatedDataTable
          className="border-0 shadow-none rounded-none"
          columns={MONTHLY_BREAKDOWN_COLUMNS}
          loading={false}
          isEmpty={monthlyBreakdown.length === 0}
          emptyContent={<div className="py-12 text-center text-slate-700">No monthly data</div>}
          totalCount={monthlyBreakdown.length}
          page={mbPage}
          pageSize={mbPageSize}
          onPageChange={setMbPage}
          onPageSizeChange={setMbPageSize}
          pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        >
          {paginatedMonthlyBreakdown.map((month) => (
            <tr key={month.monthNum} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-slate-900">{month.month}</td>
              <td className="py-3 px-4 text-sm text-slate-900 text-right">{formatCurrency(month.revenue)}</td>
              <td className="py-3 px-4 text-sm text-slate-900 text-right">{formatCurrency(month.expenses)}</td>
              <td
                className={`py-3 px-4 text-sm font-semibold text-right ${month.profit >= 0 ? 'text-slate-800' : 'text-red-600'
                  }`}
              >
                {formatCurrency(month.profit)}
              </td>
              <td
                className={`py-3 px-4 text-sm font-semibold text-right ${month.profitMargin >= 0 ? 'text-slate-800' : 'text-red-600'
                  }`}
              >
                {month.profitMargin.toFixed(1)}%
              </td>
            </tr>
          ))}
        </PaginatedDataTable>
        {monthlyBreakdown.length > 0 && (
          <div className="grid grid-cols-5 gap-2 border-t-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="py-2 px-2 font-bold text-slate-900">Total</div>
            <div className="py-2 px-2 font-bold text-slate-800 text-right">
              {formatCurrency(summary.revenue.total)}
            </div>
            <div className="py-2 px-2 font-bold text-red-600 text-right">
              {formatCurrency(summary.expenses.total)}
            </div>
            <div className={`py-2 px-2 font-bold text-right ${profitColor}`}>
              {formatCurrency(summary.profit)}
            </div>
            <div className={`py-2 px-2 font-bold text-right ${profitColor}`}>
              {summary.profitMargin.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
          <CardDescription>Comparing {selectedYear} with {previousYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-700 mb-2">Revenue</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatCurrency(summary.revenue.total)}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">{selectedYear}</p>
                </div>
                {revenueChange !== 0 && (
                  <div className={`text-right ${revenueChange >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    <p className="text-lg font-bold">
                      {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-700">vs {previousYear}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-sm font-medium text-slate-700 mb-2">Expenses</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.expenses.total)}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">{selectedYear}</p>
                </div>
                {expensesChange !== 0 && (
                  <div className={`text-right ${expensesChange >= 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    <p className="text-lg font-bold">
                      {expensesChange >= 0 ? '+' : ''}{expensesChange.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-700">vs {previousYear}</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-xl ${summary.profit >= 0 ? 'bg-slate-50' : 'bg-red-50'}`}>
              <p className="text-sm font-medium text-slate-700 mb-2">Profit/Loss</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className={`text-2xl font-bold ${profitColor}`}>
                    {formatCurrency(summary.profit)}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">{selectedYear}</p>
                </div>
                {profitChange !== 0 && (
                  <div className={`text-right ${profitChange >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    <p className="text-lg font-bold">
                      {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-700">vs {previousYear}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
