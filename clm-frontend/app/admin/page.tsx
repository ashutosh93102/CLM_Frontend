'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/app/lib/auth-context';
import { ApiClient } from '@/app/lib/api-client';
import { Shield, RefreshCcw, Users, FileText, Layers, Sparkles, CalendarDays, Bot } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type AuthUserFlags = { is_admin?: boolean; is_superadmin?: boolean };

type AdminAnalytics = {
  users?: { total?: number };
  templates?: { total?: number };
  contracts?: { total?: number };
  trends_last_6_months?: Array<{ label: string; contracts_created?: number; templates_created?: number }>;
  ai?: {
    reviews_total?: number;
    generations_total?: number;
    events_total?: number;
    reviews_last_6_months?: Array<{ label: string; count: number }>;
    generations_last_6_months?: Array<{ label: string; count: number }>;
  };
};

type AdminUserRegistration = {
  registration_data?: Array<{ label: string; registered: number; active: number }>;
};

type AdminFeatureUsage = {
  month_features?: Record<string, Record<string, number>>;
  top_features?: Array<{ feature: string; total_usage: number; unique_users?: number }>;
  adoption_rate?: number;
  users_with_activity?: number;
  total_active_users?: number;
};

type AdminUserFeatureUsage = {
  feature_distribution?: Array<{
    feature: string;
    usage_count: number;
    user_count: number;
    adoption_rate: number;
  }>;
  period?: string;
  total_users?: number;
};

const getErrorMessage = (e: unknown) => {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Something went wrong';
};

function Card(props: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-black/10 shadow-sm overflow-hidden">
      <div className="h-px w-full bg-black/10" />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-black text-black">{props.title}</h2>
            {props.subtitle ? <p className="text-xs text-black/55 font-medium mt-0.5">{props.subtitle}</p> : null}
          </div>
          {props.right}
        </div>
        {props.children}
      </div>
    </div>
  );
}

function KpiCard(props: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-black/10 shadow-sm overflow-hidden">
      <div className="h-px w-full bg-black/10" />
      <div className="p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black tracking-widest uppercase text-black/45">{props.label}</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-black">{props.value}</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-black/[0.02] border border-black/10 flex items-center justify-center shrink-0">
          {props.icon}
        </div>
      </div>
    </div>
  );
}

const prettyFeatureName = (v: string) => {
  const s = String(v || '').trim();
  if (!s) return 'Unknown';
  return s
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [featureUsage, setFeatureUsage] = useState<AdminFeatureUsage | null>(null);
  const [userFeatureUsage, setUserFeatureUsage] = useState<AdminUserFeatureUsage | null>(null);
  const [userRegistration, setUserRegistration] = useState<AdminUserRegistration | null>(null);
  const [contractTemplatesCount, setContractTemplatesCount] = useState<number | null>(null);
  const [fileTemplatesCount, setFileTemplatesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminAllTenants, setAdminAllTenants] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState<string | null>(null);

  const userFlags = (user as unknown as AuthUserFlags | null);
  const isAdmin = !!userFlags?.is_admin;
  const isSuperAdmin = !!userFlags?.is_superadmin;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = new ApiClient();
      const [a, fu, ur, uf, ct, ft] = await Promise.all([
        client.getAdminAnalytics(),
        client.getAdminFeatureUsage(),
        client.getAdminUserRegistration(),
        client.getAdminUserFeatureUsage(),
        client.getTemplates(),
        client.listTemplateFiles(),
      ]);

      if (!a.success) throw new Error(a.error || 'Failed to load admin analytics');
      setAnalytics(a.data as AdminAnalytics);
      setFeatureUsage(fu.success ? (fu.data as AdminFeatureUsage) : null);
      setUserRegistration(ur.success ? (ur.data as AdminUserRegistration) : null);
      setUserFeatureUsage(uf.success ? (uf.data as AdminUserFeatureUsage) : null);

      // Templates totals: backend admin analytics counts ContractTemplate only.
      // Many deployments primarily use file templates, so compute best-effort counts for both.
      const ctCount = (() => {
        if (!ct.success) return null;
        const d = ct.data;
        if (Array.isArray(d)) return d.length;
        if (d && typeof d === 'object') {
          const obj = d as Record<string, unknown>;
          if (typeof obj.count === 'number') return obj.count;
          const results = obj.results;
          if (Array.isArray(results)) return results.length;
        }
        return null;
      })();
      setContractTemplatesCount(ctCount);

      const ftCount = (() => {
        if (!ft.success) return null;
        const d = ft.data;
        if (d && typeof d === 'object') {
          const obj = d as Record<string, unknown>;
          if (typeof obj.count === 'number') return obj.count;
          const results = obj.results;
          if (Array.isArray(results)) return results.length;
        }
        return null;
      })();
      setFileTemplatesCount(ftCount);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) {
      loadDashboard();
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  const displayName = useMemo(() => {
    const u = (user && typeof user === 'object') ? (user as unknown as Record<string, unknown>) : null;
    const fullName = u && typeof u.full_name === 'string' ? u.full_name.trim() : '';
    const name = u && typeof u.name === 'string' ? u.name.trim() : '';
    const email = u && typeof u.email === 'string' ? u.email.trim() : '';
    const raw = fullName || name || email || 'Admin';
    if (raw.includes('@')) return raw.split('@')[0] || 'Admin';
    return raw;
  }, [user]);

  const prettyToday = useMemo(() => {
    const d = new Date();
    const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
    const day = d.toLocaleDateString(undefined, { day: '2-digit' });
    const month = d.toLocaleDateString(undefined, { month: 'long' });
    const year = d.toLocaleDateString(undefined, { year: 'numeric' });
    return `${weekday}, ${day} ${month} ${year}`;
  }, []);

  const kpis = useMemo(() => {
    const totalUsers = Number(analytics?.users?.total ?? 0);
    const totalContracts = Number(analytics?.contracts?.total ?? 0);
    const templatesFromAnalytics = Number(analytics?.templates?.total ?? 0);
    const templatesFromContract = Number(contractTemplatesCount ?? 0);
    const templatesFromFiles = Number(fileTemplatesCount ?? 0);
    const totalTemplates = Math.max(templatesFromAnalytics, templatesFromContract, templatesFromFiles);
    const totalAiReviews = Number(analytics?.ai?.reviews_total ?? 0);
    const totalAiGenerations = Number(analytics?.ai?.generations_total ?? 0);
    const totalEvents = Number(analytics?.ai?.events_total ?? 0);
    return { totalUsers, totalContracts, totalTemplates, totalAiReviews, totalAiGenerations, totalEvents };
  }, [analytics, contractTemplatesCount, fileTemplatesCount]);

  const normalizeFeatureKey = (raw: string) => {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return 'Other';
    if (s.includes('calendar') || s.includes('event')) return 'Calendar';
    if (s.includes('review')) return 'Review';
    if (s.includes('upload') || s.includes('file') || s.includes('r2') || s.includes('document')) return 'Uploads';
    if (s.includes('create-contract') || s.includes('create contract') || s.includes('contract-create') || s.includes('generate')) return 'Create Contract';
    if (s.includes('template')) return 'Templates';
    if (s.includes('contract') || s.includes('clause') || s.includes('approval') || s.includes('sign')) return 'Contracts';
    return prettyFeatureName(s);
  };

  const normalizedFeatureTotals = useMemo(() => {
    const rows = userFeatureUsage?.feature_distribution || [];
    const totals: Record<string, number> = {};
    for (const r of rows) {
      const key = normalizeFeatureKey(r.feature);
      totals[key] = (totals[key] || 0) + Number(r.usage_count ?? 0);
    }
    const ordered = Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Ensure key buckets always appear (even if 0) so the dashboard looks consistent.
    const must = ['Contracts', 'Create Contract', 'Templates', 'Review', 'Calendar', 'Uploads'];
    for (const m of must) {
      if (!ordered.find((x) => x.name === m)) ordered.push({ name: m, value: 0 });
    }
    return ordered;
  }, [userFeatureUsage]);

  const userTrendStacked = useMemo(() => {
    const rows = userRegistration?.registration_data || [];
    return rows.map((r) => {
      const registered = Number(r.registered ?? 0);
      const active = Number(r.active ?? 0);
      const inactive = Math.max(registered - active, 0);
      return {
        label: r.label,
        active,
        inactive,
      };
    });
  }, [userRegistration]);

  const featureAreaData = useMemo(() => {
    const monthFeatures = featureUsage?.month_features || {};
    const months = Object.keys(monthFeatures).sort();
    const totals: Record<string, number> = {};
    for (const m of months) {
      const bucket = monthFeatures[m] || {};
      for (const key of Object.keys(bucket)) {
        totals[key] = (totals[key] || 0) + Number(bucket[key] ?? 0);
      }
    }
    const byMonthTop = Object.keys(totals)
      .sort((a, b) => (totals[b] || 0) - (totals[a] || 0))
      .slice(0, 8);

    const byTotalsTop = (featureUsage?.top_features || [])
      .filter((x) => x && typeof x.feature === 'string')
      .slice(0, 8)
      .map((x) => x.feature);

    const topFeatures = byMonthTop.length ? byMonthTop : byTotalsTop;

    const otherKey = '__other__';
    const allKeys = Object.keys(totals);
    const otherFeatures = topFeatures.length ? allKeys.filter((k) => !topFeatures.includes(k)) : [];

    const series = months.map((m) => {
      const bucket = monthFeatures[m] || {};
      const dt = new Date(m);
      const label = Number.isNaN(dt.getTime()) ? m : dt.toLocaleDateString(undefined, { month: 'short' });
      const row: Record<string, number | string> = { label };
      for (const f of topFeatures) row[f] = Number(bucket[f] ?? 0);
      if (otherFeatures.length) {
        row[otherKey] = otherFeatures.reduce((acc, k) => acc + Number(bucket[k] ?? 0), 0);
      }
      return row;
    });

    // If month_features is empty but we have top_features totals, render a stable empty timeline.
    if (!series.length && topFeatures.length) {
      const now = new Date();
      const safeMonths: Array<{ key: string; label: string }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        safeMonths.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
          label: d.toLocaleDateString(undefined, { month: 'short' }),
        });
      }
      for (const m of safeMonths) {
        const row: Record<string, number | string> = { label: m.label };
        for (const f of topFeatures) row[f] = 0;
        if (otherFeatures.length) row[otherKey] = 0;
        series.push(row);
      }
    }

    return { series, topFeatures, otherKey, hasOther: otherFeatures.length > 0 };
  }, [featureUsage]);

  const aiReviewsTrend = useMemo(() => {
    const rows = analytics?.ai?.reviews_last_6_months || [];
    return rows.map((r) => ({ label: r.label, count: Number(r.count ?? 0) }));
  }, [analytics]);

  const aiGenerationsTrend = useMemo(() => {
    const rows = analytics?.ai?.generations_last_6_months || [];
    return rows.map((r) => ({ label: r.label, count: Number(r.count ?? 0) }));
  }, [analytics]);

  const workloadTrend = useMemo(() => {
    const rows = analytics?.trends_last_6_months || [];
    return rows.map((r) => ({
      label: r.label,
      contracts: Number(r.contracts_created ?? 0),
      templates: Number(r.templates_created ?? 0),
    }));
  }, [analytics]);

  const uploadsVsEventsTrend = useMemo(() => {
    const monthFeatures = featureUsage?.month_features || {};
    const months = Object.keys(monthFeatures).sort();
    return months.map((m) => {
      const bucket = monthFeatures[m] || {};
      let uploads = 0;
      let events = 0;
      for (const [k, v] of Object.entries(bucket)) {
        const key = normalizeFeatureKey(k);
        const n = Number(v ?? 0);
        if (key === 'Uploads') uploads += n;
        if (key === 'Calendar') events += n;
      }
      const dt = new Date(m);
      const label = Number.isNaN(dt.getTime()) ? m : dt.toLocaleDateString(undefined, { month: 'short' });
      return { label, uploads, events };
    });
  }, [featureUsage]);

  const userSplitDonut = useMemo(() => {
    const rows = userTrendStacked || [];
    const last = rows.length ? rows[rows.length - 1] : null;
    const active = Number(last?.active ?? 0);
    const inactive = Number(last?.inactive ?? 0);
    return [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive },
    ];
  }, [userTrendStacked]);

  const aiMixDonut = useMemo(() => {
    const reviews = Number(analytics?.ai?.reviews_total ?? 0);
    const generations = Number(analytics?.ai?.generations_total ?? 0);
    const events = Number(analytics?.ai?.events_total ?? 0);
    return [
      { name: 'AI Reviews', value: reviews },
      { name: 'AI Generations', value: generations },
      { name: 'AI Events', value: events },
    ];
  }, [analytics]);

  const donutTotal = (rows: Array<{ value: number }>) => rows.reduce((acc, r) => acc + Number(r.value ?? 0), 0);

  const runAdminAction = async (action: 'promote' | 'demote') => {
    const email = String(adminEmail || '').trim();
    setAdminActionMsg(null);
    if (!email) {
      setAdminActionMsg('Enter a user email first.');
      return;
    }

    setAdminActionLoading(true);
    try {
      const client = new ApiClient();
      const res = action === 'promote'
        ? await client.adminPromoteUser({ email, allTenants: adminAllTenants })
        : await client.adminDemoteUser({ email, allTenants: adminAllTenants });

      if (!res.success) throw new Error(res.error || 'Admin action failed');
      const data = (res.data && typeof res.data === 'object') ? (res.data as Record<string, unknown>) : null;
      const msg = typeof data?.message === 'string'
        ? data.message
        : (action === 'promote' ? 'User promoted to admin.' : 'User demoted.');
      setAdminActionMsg(msg);
    } catch (e: unknown) {
      setAdminActionMsg(getErrorMessage(e));
    } finally {
      setAdminActionLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="text-black/70 text-sm font-semibold tracking-widest uppercase">Loading Admin Panel…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-white border border-black/10 shadow-sm overflow-hidden">
          <div className="h-px w-full bg-black/10" />
          <div className="flex items-center gap-4 p-8">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-md shadow-black/10">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">Access Restricted</h1>
              <p className="text-black/60 text-sm mt-0.5 font-medium">You don&apos;t have admin access to this panel.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">Hi 👋 {displayName}</h1>
            <div className="mt-1 text-sm font-semibold text-black/60">Welcome to Admin Dashboard</div>
            <div className="mt-1 text-xs font-semibold text-blue-700/80">{prettyToday}</div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {isSuperAdmin ? (
              <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-black text-white tracking-wider shadow-sm">
                Super Admin
              </span>
            ) : null}
            <button
              onClick={() => loadDashboard()}
              disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black hover:bg-black/85 border border-black/20 text-sm font-semibold text-white transition disabled:opacity-50 shadow-sm"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="rounded-xl border border-black/15 bg-white px-5 py-3 text-black/80 text-sm flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-black/60 shrink-0" />
            {error}
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <KpiCard label="Total Users" value={kpis.totalUsers} icon={<Users className="w-4 h-4 text-blue-700" />} />
          <KpiCard label="Total Contracts" value={kpis.totalContracts} icon={<FileText className="w-4 h-4 text-blue-700" />} />
          <KpiCard label="Total Templates" value={kpis.totalTemplates} icon={<Layers className="w-4 h-4 text-blue-700" />} />
          <KpiCard label="Total AI Reviews" value={kpis.totalAiReviews} icon={<Sparkles className="w-4 h-4 text-blue-700" />} />
          <KpiCard label="Total AI Generations" value={kpis.totalAiGenerations} icon={<Bot className="w-4 h-4 text-blue-700" />} />
          <KpiCard label="Total Events" value={kpis.totalEvents} icon={<CalendarDays className="w-4 h-4 text-blue-700" />} />
        </div>

        {/* ── ADMIN MANAGEMENT ── */}
        <Card
          title="Admin Management"
          subtitle={isSuperAdmin ? 'Promote or demote users by email' : 'Super Admin required to promote/demote'}
          right={<span className="text-[11px] font-bold text-black/70 rounded-full px-3 py-1 bg-white border border-black/15">Access</span>}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="user@company.com"
              className="h-10 w-full sm:flex-1 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-black placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-black/70 select-none">
              <input
                type="checkbox"
                checked={adminAllTenants}
                onChange={(e) => setAdminAllTenants(e.target.checked)}
                className="h-4 w-4 rounded border-black/30"
              />
              All tenants
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => runAdminAction('promote')}
                disabled={!isSuperAdmin || adminActionLoading}
                className="h-10 px-4 rounded-xl bg-black hover:bg-black/85 border border-black/20 text-sm font-semibold text-white transition disabled:opacity-40 disabled:hover:bg-black"
              >
                Promote
              </button>
              <button
                onClick={() => runAdminAction('demote')}
                disabled={!isSuperAdmin || adminActionLoading}
                className="h-10 px-4 rounded-xl bg-white hover:bg-black/[0.03] border border-black/20 text-sm font-semibold text-black transition disabled:opacity-40 disabled:hover:bg-white"
              >
                Demote
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs font-medium text-black/60">
            Note: the user must re-login to refresh their token permissions.
          </div>
          {!isSuperAdmin ? (
            <div className="mt-2 text-xs font-semibold text-black/55">
              You are not a Super Admin, so promote/demote is disabled.
            </div>
          ) : null}
          {adminActionMsg ? (
            <div className="mt-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/80">
              {adminActionMsg}
            </div>
          ) : null}
        </Card>

        {/* ── WHEEL (DONUT) INSIGHTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            title="Users Split (Latest Month)"
            subtitle="Wheel chart: Active vs Inactive"
            right={<span className="text-[11px] font-bold text-blue-700 rounded-full px-3 py-1 bg-white border border-black/15">Donut</span>}
          >
            <div className="h-64 grid grid-cols-1 gap-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: '12px',
                        boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                        color: '#000',
                      }}
                    />
                    <Pie
                      data={userSplitDonut}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={2}
                      stroke="white"
                      strokeWidth={2}
                    >
                      <Cell fill="#1D4ED8" />
                      <Cell fill="#000000" />
                    </Pie>
                    <Pie
                      data={[{ name: 'Total', value: donutTotal(userSplitDonut) }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={0}
                      outerRadius={0}
                      label={({ payload }) => `${payload?.value ?? 0}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2 text-black/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-700" /> Active
                </div>
                <div className="flex items-center gap-2 text-black/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-black" /> Inactive
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="AI Mix (Totals)"
            subtitle="Wheel chart: Reviews vs Generations vs Events"
            right={<span className="text-[11px] font-bold text-blue-700 rounded-full px-3 py-1 bg-white border border-black/15">Donut</span>}
          >
            <div className="h-64 grid grid-cols-1 gap-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: '12px',
                        boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                        color: '#000',
                      }}
                    />
                    <Pie
                      data={aiMixDonut}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={2}
                      stroke="white"
                      strokeWidth={2}
                    >
                      <Cell fill="#1D4ED8" />
                      <Cell fill="#60A5FA" />
                      <Cell fill="#000000" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-black/80">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-700" />Reviews</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" />Generations</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-black" />Events</div>
              </div>
            </div>
          </Card>

          <Card
            title="Events vs Uploads"
            subtitle="Progress over the last 6 months"
            right={<span className="text-[11px] font-bold text-black/70 rounded-full px-3 py-1 bg-white border border-black/15">6 months</span>}
          >
            {uploadsVsEventsTrend.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={uploadsVsEventsTrend} margin={{ top: 10, right: 10, left: -10, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: '12px',
                        boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                        color: '#000',
                      }}
                      cursor={{ stroke: '#BFDBFE' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(0,0,0,0.7)' }} />
                    <Line type="monotone" dataKey="events" name="Events" stroke="#000000" strokeWidth={3} dot={{ r: 3, fill: '#000000' }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="uploads" name="Uploads" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 3, fill: '#1D4ED8' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-xl border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-black/70">
                No uploads/events activity found in the last 6 months.
              </div>
            )}
          </Card>
        </div>

        <Card
          title="Feature Usage · Totals (6 months)"
          subtitle="Calendar, Review, Uploads, Contracts, Templates and more"
          right={<span className="text-[11px] font-bold text-black/70 rounded-full px-3 py-1 bg-white border border-black/15">Totals</span>}
        >
          {normalizedFeatureTotals.some((x) => x.value > 0) ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={normalizedFeatureTotals.filter((x) => x.value > 0).slice(0, 12)}
                  margin={{ top: 10, right: 10, left: -10, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: '12px',
                      boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      color: '#000',
                    }}
                    cursor={{ fill: '#EFF6FF' }}
                  />
                  <Bar dataKey="value" name="Usage" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-black/70">
              No feature usage activity found in the last 6 months.
            </div>
          )}
        </Card>

        {/* ── CHARTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Users · Last 6 Months"
            subtitle="Stacked bar: Active vs Inactive"
            right={<span className="text-[11px] font-bold text-black/70 rounded-full px-3 py-1 bg-white border border-black/15">6 months</span>}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userTrendStacked} margin={{ top: 10, right: 10, left: -10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: '12px',
                      boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      color: '#000',
                    }}
                    cursor={{ fill: '#EFF6FF' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(0,0,0,0.7)' }} />
                  <Bar dataKey="active" stackId="u" name="Active" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inactive" stackId="u" name="Inactive" fill="#93C5FD" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            title="AI Usage · Last 6 Months"
            subtitle="Reviews vs generations"
            right={<span className="text-[11px] font-bold text-black/70 rounded-full px-3 py-1 bg-white border border-black/15">6 months</span>}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiReviewsTrend.map((r, i) => ({
                  label: r.label,
                  reviews: r.count,
                  generations: Number(aiGenerationsTrend[i]?.count ?? 0),
                }))} margin={{ top: 10, right: 10, left: -10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: '12px',
                      boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      color: '#000',
                    }}
                    cursor={{ stroke: '#BFDBFE' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(0,0,0,0.7)' }} />
                  <Line type="monotone" dataKey="reviews" name="AI Reviews" stroke="#2563EB" strokeWidth={3} dot={{ r: 3, fill: '#2563EB' }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="generations" name="AI Generations" stroke="#60A5FA" strokeWidth={3} dot={{ r: 3, fill: '#60A5FA' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card
          title="Workload · Last 6 Months"
          subtitle="Contracts created vs templates created"
          right={<span className="text-[11px] font-bold text-black/70 rounded-full px-3 py-1 bg-white border border-black/15">6 months</span>}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workloadTrend} margin={{ top: 10, right: 10, left: -10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '12px',
                    boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    color: '#000',
                  }}
                  cursor={{ stroke: '#BFDBFE' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(0,0,0,0.7)' }} />
                <Line type="monotone" dataKey="contracts" name="Contracts" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 3, fill: '#1D4ED8' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="templates" name="Templates" stroke="#93C5FD" strokeWidth={3} dot={{ r: 3, fill: '#93C5FD' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Feature Usage (All Users)"
          subtitle="Stacked area chart for top features"
          right={
            <span className="text-[11px] font-bold text-black/70 rounded-full px-3 py-1 bg-white border border-black/15">
              Top {featureAreaData.topFeatures.length || 0}
              {featureAreaData.hasOther ? ' + Other' : ''}
            </span>
          }
        >
          {featureAreaData.series.length && featureAreaData.topFeatures.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={featureAreaData.series} margin={{ top: 10, right: 10, left: -10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.55)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: '12px',
                      boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      color: '#000',
                    }}
                    cursor={{ stroke: '#BFDBFE' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(0,0,0,0.7)' }} />
                  {featureAreaData.topFeatures.map((feature, idx) => {
                    const palette = ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];
                    const stroke = palette[idx % palette.length];
                    return (
                      <Area
                        key={feature}
                        type="monotone"
                        dataKey={feature}
                        name={prettyFeatureName(feature)}
                        stroke={stroke}
                        fill={stroke}
                        fillOpacity={0.18}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                    );
                  })}
                  {featureAreaData.hasOther ? (
                    <Area
                      key={featureAreaData.otherKey}
                      type="monotone"
                      dataKey={featureAreaData.otherKey}
                      name="Other"
                      stroke="#CBD5E1"
                      fill="#CBD5E1"
                      fillOpacity={0.22}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-black/70">
              No feature usage activity found in the last 6 months.
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
