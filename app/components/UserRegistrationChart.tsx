'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Users, TrendingUp } from 'lucide-react';

interface RegistrationData {
  month: string;
  label: string;
  registered: number;
  active: number;
}

interface UserRegistrationChartProps {
  data: RegistrationData[];
  totalRegistered: number;
  totalActive: number;
  activePercentage: number;
}

export default function UserRegistrationChart({
  data,
  totalRegistered,
  totalActive,
  activePercentage,
}: UserRegistrationChartProps) {
  const chartData = useMemo(() => {
    return (data || []).map((item) => ({
      month: item.label,
      registered: item.registered,
      active: item.active,
      inactive: item.registered - item.active,
    }));
  }, [data]);

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">User Registration Trends</h2>
            <p className="text-xs text-slate-500">Monthly registration activity for last 6 months</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Total Registered</p>
          <p className="text-2xl font-extrabold text-slate-900">{totalRegistered}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <p className="text-xs text-purple-700 font-semibold mb-1">Total Registered</p>
          <p className="text-2xl font-extrabold text-purple-900">{totalRegistered}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
          <p className="text-xs text-emerald-700 font-semibold mb-1">Active Users</p>
          <p className="text-2xl font-extrabold text-emerald-900">{totalActive}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <p className="text-xs text-blue-700 font-semibold mb-1">Engagement Rate</p>
          <p className="text-2xl font-extrabold text-blue-900">{activePercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Bar dataKey="active" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="inactive" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">No registration data available</div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Shows the number of new user registrations and active users per month
      </p>
    </div>
  );
}
