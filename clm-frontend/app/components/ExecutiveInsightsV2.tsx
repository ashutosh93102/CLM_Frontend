'use client';

import React, { useMemo } from 'react';
import {
  Activity,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MetricData {
  templates?: { total?: number };
  contracts?: { total?: number };
  approvals?: { total?: number };
  users?: { total?: number; active?: number };
  activity_summary?: { audit_logs_last_7d?: number };
}

interface ExecutiveInsightsV2Props {
  analytics: MetricData | null;
}

export default function ExecutiveInsightsV2({ analytics }: ExecutiveInsightsV2Props) {
  const metrics = useMemo(() => {
    if (!analytics) return [];

    const totalUsers = analytics.users?.total ?? 0;
    const activeUsers = analytics.users?.active ?? 0;
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    const totalContracts = analytics.contracts?.total ?? 0;
    const totalTemplates = analytics.templates?.total ?? 0;
    const totalApprovals = analytics.approvals?.total ?? 0;

    return [
      {
        label: 'System Health',
        value: activePercentage,
        unit: '%',
        icon: 'check',
        subtext: 'Users operational',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      },
      {
        label: 'Total Contracts',
        value: totalContracts,
        unit: '',
        icon: 'trending',
        subtext: 'In system',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
      {
        label: 'Active Users',
        value: activeUsers,
        unit: '',
        icon: 'users',
        subtext: `of ${totalUsers}`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
    ];
  }, [analytics]);

  const getIcon = (iconType: string) => {
    const iconProps = 'w-6 h-6';
    switch (iconType) {
      case 'check':
        return <CheckCircle2 className={iconProps} />;
      case 'trending':
        return <TrendingUp className={iconProps} />;
      case 'users':
        return <Users className={iconProps} />;
      case 'activity':
        return <Activity className={iconProps} />;
      default:
        return <AlertCircle className={iconProps} />;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Executive Insights</h2>
          <p className="text-sm text-slate-500">System overview & performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border border-slate-200 ${metric.bgColor} p-6 transition-all hover:shadow-lg hover:border-slate-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-600 text-sm mb-2">{metric.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-3xl font-extrabold ${metric.color}`}>
                    {String(metric.value).padStart(2, '0')}
                  </p>
                  {metric.unit && <span className={`text-sm font-semibold ${metric.color}`}>{metric.unit}</span>}
                </div>
              </div>
              <div className={metric.color}>{getIcon(metric.icon)}</div>
            </div>
            <p className="text-xs text-slate-600">{metric.subtext}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
