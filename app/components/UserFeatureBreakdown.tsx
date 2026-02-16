'use client';

import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, Activity } from 'lucide-react';

interface UserFeatureData {
  user_id: string;
  email: string;
  name: string;
  total_actions: number;
  features_used: Array<{
    entity_type: string;
    count: number;
  }>;
}

interface FeatureDistribution {
  feature: string;
  usage_count: number;
  user_count: number;
  adoption_rate: number;
}

interface UserFeatureBreakdownProps {
  topUsers: UserFeatureData[];
  featureDistribution: FeatureDistribution[];
  totalUsers: number;
}

export default function UserFeatureBreakdown({
  topUsers,
  featureDistribution,
  totalUsers,
}: UserFeatureBreakdownProps) {
  const chartData = (featureDistribution || []).slice(0, 8).map((item) => ({
    feature: item.feature,
    usage: item.usage_count,
    users: item.user_count,
  }));

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Individual User Feature Usage</h2>
            <p className="text-xs text-slate-500">Per-user feature adoption and engagement patterns</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Users */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Most Active Users
          </h3>
          <div className="space-y-3 max-h-96 overflow-auto">
            {(topUsers || []).map((user, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{user.name || user.email}</p>
                    <p className="text-xs text-slate-600">{user.email}</p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                    {user.total_actions} actions
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(user.features_used || []).slice(0, 3).map((feature, fidx) => (
                    <span key={fidx} className="inline-block px-2 py-1 rounded text-xs bg-slate-200 text-slate-700">
                      {feature.entity_type} ({feature.count})
                    </span>
                  ))}
                  {(user.features_used || []).length > 3 && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-slate-200 text-slate-700">
                      +{(user.features_used || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!topUsers || topUsers.length === 0) && (
              <div className="text-center py-8 text-slate-500">No user activity data available</div>
            )}
          </div>
        </div>

        {/* Feature Adoption */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Feature Adoption Rate</h3>
          <div className="space-y-3 max-h-96 overflow-auto">
            {(featureDistribution || []).slice(0, 8).map((feature, idx) => {
              const adoptionWidth = totalUsers > 0 ? (feature.user_count / totalUsers) * 100 : 0;
              return (
                <div key={idx} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">{feature.feature}</p>
                    <span className="text-xs font-semibold text-slate-600">{feature.adoption_rate}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${Math.max(adoptionWidth, 2)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                    <span>{feature.user_count} of {totalUsers} users</span>
                    <span>{feature.usage_count} total uses</span>
                  </div>
                </div>
              );
            })}
            {(!featureDistribution || featureDistribution.length === 0) && (
              <div className="text-center py-8 text-slate-500">No feature distribution data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Distribution Chart */}
      {chartData.length > 0 && (
        <div className="mb-6 pt-6 border-t border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Usage by Feature</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="usage" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Displays the most engaged users and their feature usage patterns. Adoption rate shows the percentage of users actively using each feature.
      </p>
    </div>
  );
}
