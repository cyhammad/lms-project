'use client';

import { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Wallet, Briefcase, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccounting } from '@/hooks/use-accounting';
import { useStudentFeePayments } from '@/hooks/use-student-fee-payments';
import { useStaffSalaryPayments } from '@/hooks/use-staff-salary-payments';
import { useExpenses } from '@/hooks/use-expenses';
import { RevenueExpensesChart } from '@/components/accounting/revenue-expenses-chart';
import { ProfitLossChart } from '@/components/accounting/profit-loss-chart';
import { RevenueBreakdownChart } from '@/components/accounting/revenue-breakdown-chart';
import { ExpensesBreakdownChart } from '@/components/accounting/expenses-breakdown-chart';
import { ROUTES } from '@/constants/routes';
import { getSchoolById } from '@/lib/storage';
import Link from 'next/link';
import { PaginatedDataTable, type DataTableColumn, DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/data-table/paginated-data-table';

const formatCurrency = (amount: number) => {
  return `PKR ${amount.toLocaleString()}`;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const RECENT_TX_COLUMNS: DataTableColumn[] = [
  { id: 'date', label: 'Date' },
  { id: 'type', label: 'Type' },
  { id: 'description', label: 'Description' },
  { id: 'amount', label: 'Amount', align: 'right' },
  { id: 'status', label: 'Status' },
];

interface AccountingOverviewClientProps {
  user: any;
}

export default function AccountingOverviewClient({ user }: AccountingOverviewClientProps) {
  const { getMonthlySummary, getYearlySummary, getMonthlyTrends } = useAccounting();
  const { payments: feePayments } = useStudentFeePayments();
  const { payments: salaryPayments } = useStaffSalaryPayments();
  const { expenses: apiExpenses } = useExpenses();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);

  // Get current month summary
  const currentSummary = useMemo(() => {
    return getMonthlySummary(selectedMonth, selectedYear, user?.schoolId);
  }, [selectedMonth, selectedYear, user?.schoolId, getMonthlySummary]);

  // Get monthly trends for current year
  const monthlyTrends = useMemo(() => {
    return getMonthlyTrends(selectedYear, user?.schoolId);
  }, [selectedYear, user?.schoolId, getMonthlyTrends]);

  // Get recent transactions (last 10 fee, salary, and expense entries)
  const recentTransactions = useMemo(() => {
    const allTransactions: Array<{
      id: string;
      date: Date;
      type: 'fee' | 'salary' | 'expense';
      description: string;
      amount: number;
      status: string;
    }> = [];

    feePayments
      .slice(-20)
      .forEach(payment => {
        allTransactions.push({
          id: payment.id,
          date: payment.paymentDate || payment.dueDate,
          type: 'fee',
          description: `${payment.feeType} Fee`,
          amount: payment.finalAmount,
          status: payment.status,
        });
      });

    salaryPayments
      .slice(-20)
      .forEach(payment => {
        allTransactions.push({
          id: payment.id,
          date: payment.paymentDate || payment.dueDate,
          type: 'salary',
          description: 'Staff Salary',
          amount: payment.finalAmount,
          status: payment.status,
        });
      });

    apiExpenses.slice(0, 20).forEach(expense => {
      allTransactions.push({
        id: expense.id,
        date: expense.createdAt,
        type: 'expense',
        description: expense.title,
        amount: expense.amount,
        status: 'Recorded',
      });
    });

    return allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [feePayments, salaryPayments, apiExpenses]);

  const txTotal = recentTransactions.length;
  const txTotalPages = Math.max(1, Math.ceil(txTotal / txPageSize));
  const paginatedRecentTx = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return recentTransactions.slice(start, start + txPageSize);
  }, [recentTransactions, txPage, txPageSize]);

  useEffect(() => {
    setTxPage(1);
  }, [selectedMonth, selectedYear, feePayments, salaryPayments, apiExpenses]);

  useEffect(() => {
    if (txTotal > 0 && txPage > txTotalPages) {
      setTxPage(txTotalPages);
    }
  }, [txTotal, txTotalPages, txPage]);

  const profitColor = currentSummary.profit >= 0 ? 'text-slate-800' : 'text-red-600';
  const profitIcon = currentSummary.profit >= 0 ? TrendingUp : TrendingDown;

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

      // Helper function to check if new page is needed
      const checkNewPage = (requiredSpace: number = 10) => {
        if (yPos + requiredSpace > maxY) {
          // Add footer to current page
          pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
          pdf.setLineWidth(0.3);
          pdf.line(margin, maxY, pageWidth - margin, maxY);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          pdf.text(`Page ${currentPage}`, pageWidth / 2, maxY + 5, { align: 'center' });

          // Add new page
          pdf.addPage();
          currentPage++;
          yPos = margin;

          // Add header to new page
          if (school) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
            pdf.text(school.name, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`ACCOUNTING OVERVIEW REPORT - ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;
          }
        }
      };

      // Header
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

      // Title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ACCOUNTING OVERVIEW REPORT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Period: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth / 2, yPos + 5, { align: 'center' });
      yPos += 15;

      // Summary Section
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Financial Summary', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Revenue', formatCurrency(currentSummary.revenue.total)],
        ['Paid Revenue', formatCurrency(currentSummary.revenue.paid)],
        ['Outstanding Revenue', formatCurrency(currentSummary.revenue.outstanding)],
        ['Total Expenses', formatCurrency(currentSummary.expenses.total)],
        ['Paid Expenses', formatCurrency(currentSummary.expenses.paid)],
        ['Outstanding Expenses', formatCurrency(currentSummary.expenses.outstanding)],
        ['Net Profit/Loss', formatCurrency(currentSummary.profit)],
        ['Profit Margin', `${currentSummary.profitMargin.toFixed(1)}%`],
      ];

      summaryData.forEach(([label, value]) => {
        checkNewPage(6);
        pdf.text(label + ':', margin, yPos);
        pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      });

      // Revenue Breakdown
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
      const revenueBreakdown = Object.entries(currentSummary.revenue.byFeeType)
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

      // Expenses Breakdown
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
        ...Object.entries(currentSummary.expenses.byStaffType),
        ...(typeof currentSummary.expenses.otherExpenses === 'number' && currentSummary.expenses.otherExpenses > 0
          ? [['Other Expenses', currentSummary.expenses.otherExpenses] as const]
          : []),
      ];
      const expensesBreakdownEntries = expensesBreakdown
        .filter(([_, amount]) => amount > 0)
        .sort(([_, a], [__, b]) => b - a);

      if (expensesBreakdownEntries.length === 0) {
        checkNewPage(6);
        pdf.text('No expense data available', margin, yPos);
        yPos += 6;
      } else {
        expensesBreakdownEntries.forEach(([type, amount]) => {
          checkNewPage(6);
          pdf.text(`${type}:`, margin, yPos);
          pdf.text(formatCurrency(amount), pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        });
      }

      // Footer on last page
      const footerYPos = Math.max(yPos + 10, maxY);
      pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.setLineWidth(0.3);
      pdf.line(margin, footerYPos, pageWidth - margin, footerYPos);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.text(`Page ${currentPage}`, pageWidth / 2, footerYPos + 5, { align: 'center' });
      pdf.text('This is a computer-generated report.', pageWidth / 2, footerYPos + 10, { align: 'center' });

      pdf.save(`Accounting-Overview-${MONTH_NAMES[selectedMonth - 1]}-${selectedYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounting Overview</h1>
          <p className="text-slate-700 mt-1">Financial summary and insights</p>
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

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {formatCurrency(currentSummary.revenue.total)}
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  {formatCurrency(currentSummary.revenue.paid)} paid
                </p>
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
                  {formatCurrency(currentSummary.expenses.total)}
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  {formatCurrency(currentSummary.expenses.paid)} paid
                </p>
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
                  {formatCurrency(currentSummary.profit)}
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  {currentSummary.profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentSummary.profit >= 0 ? 'bg-slate-50' : 'bg-red-50'
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
                  {currentSummary.profitMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  {currentSummary.revenue.total > 0
                    ? `${((currentSummary.profit / currentSummary.revenue.total) * 100).toFixed(1)}% of revenue`
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly trend for {selectedYear}</CardDescription>
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
            <CardDescription>By fee type for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueBreakdownChart data={currentSummary.revenue.byFeeType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses Breakdown</CardTitle>
            <CardDescription>By staff type for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesBreakdownChart
              data={{
                ...currentSummary.expenses.byStaffType,
                ...(typeof currentSummary.expenses.otherExpenses === 'number' && currentSummary.expenses.otherExpenses > 0
                  ? { 'Other Expenses': currentSummary.expenses.otherExpenses }
                  : {}),
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Details</CardTitle>
            <CardDescription>Breakdown for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Total Revenue</span>
                <span className="text-lg font-bold text-slate-800">
                  {formatCurrency(currentSummary.revenue.total)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Paid</span>
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(currentSummary.revenue.paid)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Outstanding</span>
                <span className="text-lg font-semibold text-orange-600">
                  {formatCurrency(currentSummary.revenue.outstanding)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">By Fee Type:</p>
                <div className="space-y-2">
                  {Object.entries(currentSummary.revenue.byFeeType)
                    .filter(([_, amount]) => amount > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([type, amount]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="text-slate-800">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses Details</CardTitle>
            <CardDescription>Breakdown for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Total Expenses</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(currentSummary.expenses.total)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Paid</span>
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(currentSummary.expenses.paid)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Outstanding</span>
                <span className="text-lg font-semibold text-orange-600">
                  {formatCurrency(currentSummary.expenses.outstanding)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">By category:</p>
                <div className="space-y-2">
                  {[
                    ...Object.entries(currentSummary.expenses.byStaffType),
                    ...(typeof currentSummary.expenses.otherExpenses === 'number' && currentSummary.expenses.otherExpenses > 0
                      ? [['Other Expenses', currentSummary.expenses.otherExpenses] as const]
                      : []),
                  ]
                    .filter(([_, amount]) => amount > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([type, amount]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="text-slate-800">{type}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaginatedDataTable
        title={
          <span>
            Recent Transactions
            <span className="block text-sm font-normal text-slate-700 mt-0.5 normal-case">
              Latest fee, salary, and expense entries
            </span>
          </span>
        }
        columns={RECENT_TX_COLUMNS}
        isEmpty={recentTransactions.length === 0}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-slate-700">No recent transactions</p>
          </div>
        }
        totalCount={txTotal}
        page={txPage}
        pageSize={txPageSize}
        onPageChange={setTxPage}
        onPageSizeChange={setTxPageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
      >
        {paginatedRecentTx.map((transaction) => (
          <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="py-3 px-4 text-sm text-slate-800">
              {new Date(transaction.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </td>
            <td className="py-3 px-4">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${transaction.type === 'fee'
                  ? 'bg-slate-50 text-slate-700'
                  : transaction.type === 'expense'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                  }`}
              >
                {transaction.type === 'fee' ? 'Fee' : transaction.type === 'expense' ? 'Expense' : 'Salary'}
              </span>
            </td>
            <td className="py-3 px-4 text-sm text-slate-900">{transaction.description}</td>
            <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
              {formatCurrency(transaction.amount)}
            </td>
            <td className="py-3 px-4">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${transaction.status === 'Paid'
                  ? 'bg-slate-50 text-slate-700'
                  : transaction.status === 'Partial'
                    ? 'bg-amber-50 text-amber-700'
                    : transaction.status === 'Recorded'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-red-50 text-red-700'
                  }`}
              >
                {transaction.status}
              </span>
            </td>
          </tr>
        ))}
      </PaginatedDataTable>
    </div>
  );
}
