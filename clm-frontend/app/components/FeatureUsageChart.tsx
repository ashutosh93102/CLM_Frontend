'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Zap, TrendingUp } from 'lucide-react';

interface FeatureUsage {
  feature: string;
  total_usage: number;
  unique_users: number;
  avg_per_user: number;
}

interface FeatureUsageChartProps {
  topFeatures: FeatureUsage[];
  monthFeatures: Record<string, Record<string, number>>;
}

const COLORS = ['#0f172a', '#4f46e5', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6366f1', '#14b8a6'];

export default function FeatureUsageChart({ topFeatures, monthFeatures }: FeatureUsageChartProps) {
  const chartData = useMemo(() => {
    if (!monthFeatures || Object.keys(monthFeatures).length === 0) return [];

    const months = Object.keys(monthFeatures).sort();
    return months.map((month) => {
      const features = monthFeatures[month];
      return {
        month: new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...features,
      };
    });
  }, [monthFeatures]);

  const pieData = useMemo(() => {
    return (topFeatures || []).slice(0, 5).map((f) => ({
      name: f.feature || 'Unknown',
      value: f.total_usage,
    }));
  }, [topFeatures]);

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Feature Usage Analytics</h2>
            <p className="text-xs text-slate-500">User adoption and feature engagement for last 6 months</p>
          </div>
        </div>
      </div>

      {/* Top Features Table */}
      <div className="mb-8">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Top Features by Usage
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-slate-600 font-semibold">Feature</th>
                <th className="text-right py-3 px-4 text-slate-600 font-semibold">Total Usage</th>
                <th className="text-right py-3 px-4 text-slate-600 font-semibold">Unique Users</th>
                <th className="text-right py-3 px-4 text-slate-600 font-semibold">Avg per User</th>
              </tr>
            </thead>
            <tbody>
              {(topFeatures || []).slice(0, 8).map((feature, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="font-medium text-slate-900">{feature.feature}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-slate-700 font-semibold">{feature.total_usage}</td>
                  <td className="text-right py-3 px-4 text-slate-700 font-semibold">{feature.unique_users}</td>
                  <td className="text-right py-3 px-4 text-slate-700 font-semibold">{feature.avg_per_user.toFixed(1)}</td>
                </tr>
              ))}
              {(!topFeatures || topFeatures.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No feature usage data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Usage Trend */}
      {chartData.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-slate-900 mb-4">Feature Usage Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {(topFeatures || []).slice(0, 5).map((feature, idx) => (
                  <Line
                    key={idx}
                    type="monotone"
                    dataKey={feature.feature}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Feature Distribution Pie */}
      {pieData.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Feature Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Tracks feature adoption and user engagement patterns across all features in your system
      </p>
    </div>
  );
}
