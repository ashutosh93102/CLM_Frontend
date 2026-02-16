'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';

interface IndexingMetrics {
  totalIndexSize: string;
  medianQueryTime: string;
  documentsIndexed: number;
  indexedPercentage: number;
}

interface PipelineStatus {
  name: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  lastUpdated: string;
}

interface IndexingLog {
  id: string;
  timestamp: string;
  action: string;
  documents: number;
  status: 'success' | 'warning' | 'error';
}

const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<IndexingMetrics>({
    totalIndexSize: '2.4M',
    medianQueryTime: '45ms',
    documentsIndexed: 10500,
    indexedPercentage: 65,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verify authentication
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const pipelineStatuses: PipelineStatus[] = [
    {
      name: 'Full Database Indexing',
      status: 'OK',
      lastUpdated: '2 minutes ago',
    },
    {
      name: 'OCR Processor',
      status: 'OK',
      lastUpdated: '1 minute ago',
    },
    {
      name: 'Indexing & Filters',
      status: 'WARNING',
      lastUpdated: 'Just now',
    },
  ];

  const recentLogs: IndexingLog[] = [
    {
      id: '1',
      timestamp: '2024-01-24 19:45:32',
      action: 'Index Update',
      documents: 156,
      status: 'success',
    },
    {
      id: '2',
      timestamp: '2024-01-24 19:30:15',
      action: 'OCR Scan',
      documents: 89,
      status: 'success',
    },
    {
      id: '3',
      timestamp: '2024-01-24 19:15:42',
      action: 'Filter Apply',
      documents: 45,
      status: 'warning',
    },
    {
      id: '4',
      timestamp: '2024-01-24 19:00:20',
      action: 'Archive',
      documents: 23,
      status: 'success',
    },
  ];

  const getStatusColor = (status: 'OK' | 'WARNING' | 'ERROR') => {
    switch (status) {
      case 'OK':
        return 'text-green-600 bg-green-50';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-50';
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">System Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search analytics..."
              className="w-[320px] bg-white border border-slate-200 rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <button className="w-11 h-11 rounded-full bg-white border border-slate-200 inline-flex items-center justify-center" aria-label="Notifications">
            <Bell className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric Card 1 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Index Size
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {metrics.totalIndexSize}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7l4.586-4.586a2 2 0 012.828 0L16 7m-2 2v12a1 1 0 01-1 1H7a1 1 0 01-1-1V9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Median Query Time
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {metrics.medianQueryTime}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Active & Running
              </p>
              <p className="text-3xl font-bold text-green-600">3/3</p>
              <p className="text-xs text-slate-500 mt-1">All systems operational</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric Card 4 - Storage */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">
                Index Storage
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {metrics.indexedPercentage}%
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
                style={{ width: `${metrics.indexedPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Used: {metrics.indexedPercentage}%</span>
              <span>Free: {100 - metrics.indexedPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indexing Setup Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Indexing Setup</h2>
            <p className="text-sm text-slate-600 mt-1">
              Configure and manage your database indexing strategy
            </p>
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Index
          </button>
        </div>

        {/* Tabs/Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Pipeline Configuration
            </h3>
            <div className="space-y-3">
              {pipelineStatuses.map((pipeline) => (
                <div
                  key={pipeline.name}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        pipeline.status === 'OK'
                          ? 'bg-green-500'
                          : pipeline.status === 'WARNING'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {pipeline.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {pipeline.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                      pipeline.status
                    )}`}
                  >
                    {pipeline.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              System Health
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-slate-900 text-sm">
                    Database Performance
                  </p>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    OPTIMAL
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '92%' }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">92% efficiency</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-slate-900 text-sm">
                    Query Speed
                  </p>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    FAST
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '85%' }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">85% above average</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-slate-900 text-sm">
                    Storage Availability
                  </p>
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                    MODERATE
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: '65%' }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">35% space remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Indexing Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Recent Indexing Logs
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Track all indexing operations and activities
            </p>
          </div>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            View all →
          </a>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-700">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-700">
                  Action
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-700">
                  Documents
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-slate-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700 font-medium">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {log.documents.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        log.status
                      )}`}
                    >
                      {log.status === 'success' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
