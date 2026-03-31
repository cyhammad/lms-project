'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/** Expense breakdown: staff types (salary) and/or "Other Expenses" (Expense Management module) */
interface ExpensesBreakdownChartProps {
  data: Record<string, number>;
  title?: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#ec4899', '#84cc16', '#6366f1'];

export function ExpensesBreakdownChart({ data, title }: ExpensesBreakdownChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-slate-50 rounded-xl">
        <p className="text-slate-700">No expense data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px'
            }}
            formatter={(value: any) => {
              // Recharts' Tooltip formatter is generic over the value type; use a tolerant conversion.
              const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
              return `PKR ${(Number.isFinite(numericValue) ? numericValue : 0).toLocaleString()}`;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
