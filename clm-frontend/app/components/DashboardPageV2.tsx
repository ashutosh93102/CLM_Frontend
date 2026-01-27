'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { ApiClient } from '@/app/lib/api-client';
import { Bell, Search } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Contract {
  id: string;
  name: string;
  title?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  date: string;
  created_at?: string;
  value: number;
  trend: number;
}

interface DashboardStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
}

type GrowthPoint = { month: string; count: number };

const DashboardPageV2: React.FC = () => {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isLoading || !isAuthenticated) {
          return;
        }
        setIsSyncing(true);
        const client = new ApiClient();
        const [statsResponse, recentResponse, approvalsResponse, contractsResponse] = await Promise.all([
          client.getContractStatistics(),
          client.getRecentContracts(5),
          client.getApprovals({ status: 'pending' }),
          client.getContracts(),
        ]);

        const unauthorized = [statsResponse, recentResponse, approvalsResponse, contractsResponse].some(
          (r) => !r.success && r.status === 401
        );
        if (unauthorized) {
          try {
            client.logout();
          } catch {
            // ignore
          }
          router.push('/');
          return;
        }

        if (statsResponse.success && statsResponse.data) {
          setStats({
            total: (statsResponse.data as any).total || 0,
            draft: (statsResponse.data as any).draft || 0,
            pending: (statsResponse.data as any).pending || 0,
            approved: (statsResponse.data as any).approved || 0,
            rejected: (statsResponse.data as any).rejected || 0,
          });
        }

        if (recentResponse.success && recentResponse.data) {
          const contracts = Array.isArray(recentResponse.data)
            ? recentResponse.data
            : (recentResponse.data as any).results || [];

          const recent: Contract[] = contracts.slice(0, 5).map((contract: any) => ({
            id: contract.id,
            name: contract.title || contract.name,
            status: contract.status,
            date: contract.created_at || new Date().toISOString().split('T')[0],
            value: contract.value || 0,
            trend: 0,
          }));

          setRecentContracts(recent);
        }

        if (approvalsResponse.success && approvalsResponse.data) {
          const items = Array.isArray(approvalsResponse.data)
            ? approvalsResponse.data
            : (approvalsResponse.data as any).results || [];
          setPendingApprovalsCount(items.length);
        }

        if (contractsResponse.success && contractsResponse.data) {
          const all = Array.isArray(contractsResponse.data)
            ? contractsResponse.data
            : (contractsResponse.data as any).results || [];

          const now = new Date();
          const months: Date[] = [];
          for (let i = 5; i >= 0; i--) {
            months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
          }

          const points: GrowthPoint[] = months.map((d) => {
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString(undefined, { month: 'short' });
            const count = all.filter((c: any) => {
              const created = c.created_at || c.createdAt || c.date || c.created;
              if (!created) return false;
              const cd = new Date(created);
              const k = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}`;
              return k === monthKey;
            }).length;
            return { month: label, count };
          });

          setGrowth(points);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    if (user && !isLoading && isAuthenticated) {
      fetchData();
    }
  }, [user, isLoading, isAuthenticated, router]);

  const formatActivity = (c: Contract) => {
    const name = c.title || c.name;
    const status = c.status;
    const who = (c as any).created_by || (c as any).createdBy || 'User';
    const verb = status === 'draft' ? 'draft created by' : status === 'pending' ? 'submitted by' : status === 'approved' ? 'approved for' : 'updated by';
    return `${name} ${verb} ${who}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">CLM Analytics Dashboard Overview</h1>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search data..."
              className="w-[320px] bg-white border border-slate-200 rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <button className="w-11 h-11 rounded-full bg-white border border-slate-200 inline-flex items-center justify-center" aria-label="Notifications">
            <Bell className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, #fff 0 2px, transparent 3px)' }} />
          <p className="text-white/90 text-sm">Total Contracts</p>
          <p className="text-4xl font-extrabold mt-2">{stats.total}</p>
          <div className="mt-4 text-xs inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <span className="font-semibold">↗</span>
            <span>+12% vs last month</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Pending Approvals</p>
          <p className="text-4xl font-extrabold text-slate-900 mt-2">{String(pendingApprovalsCount).padStart(2, '0')}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Action Required
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Active</p>
          <p className="text-4xl font-extrabold text-slate-900 mt-2">{String(stats.approved).padStart(2, '0')}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Healthy
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <p className="text-slate-500 text-sm">Expiring Soon</p>
          <p className="text-4xl font-extrabold text-slate-900 mt-2">{String(0).padStart(2, '0')}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-rose-600">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Renewals Due
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick filters + tip */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <p className="text-xs font-bold tracking-widest text-slate-400">QUICK FILTERS</p>
            <div className="mt-4 space-y-3">
              {[{ label: 'Drafts', count: stats.draft }, { label: 'Signed', count: stats.approved }, { label: 'Under Review', count: stats.pending }].map((x) => (
                <button
                  key={x.label}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <span>{x.label}</span>
                  <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-xl text-slate-600">{x.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <p className="text-sm font-semibold text-slate-700">Tip</p>
            <p className="text-sm text-slate-500 mt-2">Review pending drafts to speed up approval cycle time.</p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Recent Contract Activity</h2>
            <button onClick={() => router.push('/contracts')} className="text-sm font-semibold text-rose-500">View All</button>
          </div>

          <div className="mt-6">
            {isSyncing ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : recentContracts.length === 0 ? (
              <div className="text-sm text-slate-500">No recent activity.</div>
            ) : (
              <div className="space-y-5">
                {recentContracts.map((c) => (
                  <div key={c.id} className="flex items-start gap-4">
                    <div className="mt-1 w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{formatActivity(c)}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(c.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Growth chart */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Monthly Contract Growth</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">Last 6 Months</span>
          </div>

          <div className="mt-6 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth} margin={{ top: 5, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
                <Line type="monotone" dataKey="count" stroke="#0F141F" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPageV2;
