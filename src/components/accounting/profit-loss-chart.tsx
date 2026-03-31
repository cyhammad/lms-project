'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { FinancialSummary } from '@/types';

interface ProfitLossChartProps {
  data: FinancialSummary[];
  title?: string;
}

export function ProfitLossChart({ data, title }: ProfitLossChartProps) {
  const chartData = data.map(summary => ({
    period: summary.period,
    profit: summary.profit,
  }));

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="period" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `PKR ${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px'
            }}
            formatter={(value: any) => {
              const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
              return `PKR ${(Number.isFinite(numericValue) ? numericValue : 0).toLocaleString()}`;
            }}
          />
          <Legend />
          <Bar dataKey="profit" name="Profit/Loss" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
