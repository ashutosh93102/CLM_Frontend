'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChevronDown, Download } from 'lucide-react';

type AdminAnalytics = any;

type UserRegistrationPayload = {
  registration_data?: Array<{ month: string; label: string; registered: number; active: number }>;
  total_registered?: number;
  total_active?: number;
  active_percentage?: number;
};

type FeatureUsagePayload = {
  month_features?: Record<string, Record<string, number>>;
  top_features?: Array<{ feature: string; total_usage: number; unique_users: number; avg_per_user: number }>;
  adoption_rate?: number;
  users_with_activity?: number;
  total_active_users?: number;
};

type Props = {
  analytics: AdminAnalytics | null;
  userRegistration: UserRegistrationPayload | null;
  featureUsage: FeatureUsagePayload | null;
};

const COLORS = {
  pink: '#FF5C7A',
  purple: '#8B5CF6',
  orange: '#FB923C',
  blue: '#3B82F6',
  green: '#22C55E',
  slate: '#0F141F',
  muted: '#94A3B8',
  ringBg: '#EEF2F7',
};

function formatK(n: number) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}

function monthLabelFromISO(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export default function GovernanceDashboardAdminV2({ analytics, userRegistration, featureUsage }: Props) {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month');
  const [reportOpen, setReportOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!reportRef.current) return;
      if (reportRef.current.contains(e.target as Node)) return;
      setReportOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReportOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const regTotal = userRegistration?.total_registered ?? (analytics?.users?.total ?? 0);
  const regActive = userRegistration?.total_active ?? (analytics?.users?.active ?? 0);
  const regInactive = Math.max(0, regTotal - regActive);
  const regAdmins = analytics?.users?.admins ?? 0;

  const registrationDonut = useMemo(() => {
    const active = regActive;
    const inactive = regInactive;
    const admins = Math.min(regAdmins, regTotal);

    // Avoid double-counting: admins are a subset of active in many systems.
    // We show "Admins" as informational slice only when it fits; otherwise hide it.
    const showAdmins = admins > 0 && admins < active;

    const parts = [
      { name: 'Active Users', value: active, color: COLORS.pink },
      { name: 'Inactive', value: inactive, color: COLORS.orange },
    ];

    if (showAdmins) parts.splice(1, 0, { name: 'Admins', value: admins, color: COLORS.purple });

    const total = parts.reduce((s, p) => s + (p.value || 0), 0);
    return {
      parts,
      total,
    };
  }, [regActive, regInactive, regAdmins, regTotal]);

  const featureBreakdown = useMemo(() => {
    const adoption = Math.max(0, Math.min(100, Number(featureUsage?.adoption_rate ?? 0)));
    const used = featureUsage?.users_with_activity ?? 0;
    const total = featureUsage?.total_active_users ?? 0;

    return {
      adoption,
      used,
      total,
      parts: [
        { name: 'Adopted', value: adoption, color: COLORS.pink },
        { name: 'Remaining', value: 100 - adoption, color: COLORS.ringBg },
      ],
    };
  }, [featureUsage]);

  const engagementData = useMemo(() => {
    if (range === 'week') {
      const daily = (analytics?.trends_last_7_days || []).map((r: any) => ({
        label: String(r.label || ''),
        contracts: r.contracts_created ?? 0,
        templates: r.templates_created ?? 0,
        signing: r.firma_sent ?? 0,
        completed: r.firma_completed ?? 0,
        audit: r.audit_logs ?? 0,
      }));
      return daily;
    }

    const trendsKey = range === 'year' ? 'trends_last_12_months' : 'trends_last_6_months';
    const rows = (analytics as any)?.[trendsKey] || [];

    const monthly = rows.map((r: any) => {
      const monthStart = String(r.month_start || '');
      return {
        label: r.label || monthLabelFromISO(monthStart),
        contracts: r.contracts_created ?? 0,
        templates: r.templates_created ?? 0,
        signing: r.firma_sent ?? 0,
        completed: r.firma_completed ?? 0,
        audit: 0,
      };
    });

    // Audit/activity from feature-usage payload (monthly buckets)
    const monthFeatures = featureUsage?.month_features || {};
    const auditByMonth = new Map<string, number>();
    for (const [iso, features] of Object.entries(monthFeatures)) {
      auditByMonth.set(
        iso,
        Object.values(features || {}).reduce((s, v) => s + (Number(v) || 0), 0)
      );
    }

    for (let i = 0; i < rows.length; i++) {
      const iso = String(rows[i]?.month_start || '');
      if (iso && auditByMonth.has(iso)) monthly[i].audit = auditByMonth.get(iso) || 0;
    }

    return monthly;
  }, [analytics, featureUsage, range]);

  const topTemplates = useMemo(() => {
    const t = analytics?.templates?.top_templates || [];
    const max = Math.max(1, ...t.map((x: any) => Number(x.contracts_count || 0)));
    return t.slice(0, 4).map((x: any) => ({
      name: String(x.name || 'Template'),
      count: Number(x.contracts_count || 0),
      pct: Math.round((Number(x.contracts_count || 0) / max) * 100),
    }));
  }, [analytics]);

  const DonutLabel = ({ value, subtitle }: { value: string; subtitle: string }) => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl font-extrabold text-slate-900 leading-none">{value}</div>
        <div className="text-[11px] tracking-wide text-slate-400 uppercase mt-1">{subtitle}</div>
      </div>
    </div>
  );

  const downloadText = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const escapeCsv = (v: unknown) => {
    const s = String(v ?? '');
    if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
    return s;
  };

  const toCsv = (rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return '';
    const headers = Array.from(
      rows.reduce((set, r) => {
        Object.keys(r).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    );
    const lines = [headers.map(escapeCsv).join(',')];
    for (const r of rows) {
      lines.push(headers.map((h) => escapeCsv((r as any)[h])).join(','));
    }
    return lines.join('\n');
  };

  const downloadUserRegistration = (format: 'csv' | 'json') => {
    const rows = (userRegistration?.registration_data || []).map((r) => ({
      month: r.month,
      label: r.label,
      registered: r.registered,
      active: r.active,
    }));
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
      downloadText(`user-registration-${stamp}.json`, JSON.stringify({
        generated_at: new Date().toISOString(),
        total_registered: userRegistration?.total_registered,
        total_active: userRegistration?.total_active,
        active_percentage: userRegistration?.active_percentage,
        registration_data: rows,
      }, null, 2), 'application/json');
      return;
    }
    downloadText(`user-registration-${stamp}.csv`, toCsv(rows), 'text/csv');
  };

  return (
    <div>
      {/* Header like screenshot */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Admin Pannel</h1>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">System overview & performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top row: User registration */}
        <div className="xl:col-span-2 rounded-[28px] bg-white/80 border border-white shadow-sm p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-slate-900">User Registration</h2>
              <p className="text-sm text-slate-500 mt-1">Monthly active users & adoption snapshot</p>

              <div className="mt-5 space-y-3">
                {registrationDonut.parts.map((p) => {
                  const pct = registrationDonut.total > 0 ? Math.round((p.value / registrationDonut.total) * 100) : 0;
                  return (
                    <div key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-700">{p.name}</span>
                      <span className="ml-auto text-slate-500 font-semibold">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="relative mt-6 inline-block" ref={reportRef}>
                <button
                  onClick={() => setReportOpen((v) => !v)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-700 px-5 py-2 text-sm font-semibold hover:bg-slate-200"
                  aria-haspopup="menu"
                  aria-expanded={reportOpen}
                >
                  <Download className="w-4 h-4" />
                  View Report
                  <ChevronDown className="w-4 h-4" />
                </button>

                {reportOpen && (
                  <div
                    role="menu"
                    className="absolute z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-lg p-2"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setReportOpen(false);
                        downloadUserRegistration('csv');
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Download User Registration (CSV)
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setReportOpen(false);
                        downloadUserRegistration('json');
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Download User Registration (JSON)
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-[220px] h-[220px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={registrationDonut.parts}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={95}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    cornerRadius={10}
                  >
                    {registrationDonut.parts.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={(entry as any).color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <DonutLabel value={formatK(regTotal)} subtitle="Total Users" />
            </div>
          </div>
        </div>

        {/* Top row: Feature breakdown donut */}
        <div className="rounded-[28px] bg-white/80 border border-white shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Feature Breakdown</h2>
              <p className="text-sm text-slate-500 mt-1">Users with activity (6 months)</p>
            </div>
            <button className="w-9 h-9 rounded-2xl hover:bg-slate-50 grid place-items-center text-slate-400" aria-label="More">⋯</button>
          </div>

          <div className="relative w-full h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={featureBreakdown.parts}
                  dataKey="value"
                  innerRadius={72}
                  outerRadius={95}
                  startAngle={90}
                  endAngle={-270}
                  cornerRadius={10}
                >
                  {featureBreakdown.parts.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={(entry as any).color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-slate-900">{Math.round(featureBreakdown.adoption)}%</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">ADOPTION</div>
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-400 text-xs">Active Users</div>
              <div className="font-extrabold text-slate-900">{formatK(featureBreakdown.total)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">With Activity</div>
              <div className="font-extrabold text-slate-900">{formatK(featureBreakdown.used)}</div>
            </div>
          </div>
        </div>

        {/* Bottom row: SaaS engagement line chart */}
        <div className="xl:col-span-2 rounded-[28px] bg-white/80 border border-white shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">SaaS Engagement</h2>
              <p className="text-sm text-slate-500 mt-1">Multi-series tracking over time</p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
              {(['week', 'month', 'year'] as const).map((k) => {
                const active = range === k;
                return (
                  <button
                    key={k}
                    onClick={() => setRange(k)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                      active ? 'bg-[#FF5C7A] text-white' : 'text-slate-500'
                    } hover:text-slate-700`}
                  >
                    {k[0].toUpperCase() + k.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[320px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAF0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E6EAF0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(15,20,31,0.08)',
                  }}
                />
                <Line type="monotone" dataKey="contracts" stroke={COLORS.pink} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="templates" stroke={COLORS.blue} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="signing" stroke={COLORS.green} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="audit" stroke="#2DD4BF" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.pink }} />Contracts</span>
            <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.blue }} />Templates</span>
            <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.green }} />Signing</span>
            <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-400" />Activity</span>
          </div>
        </div>

        {/* Bottom row: Popular templates */}
        <div className="rounded-[28px] bg-white/80 border border-white shadow-sm p-6">
          <h2 className="text-lg font-extrabold text-slate-900">Popular Templates</h2>
          <p className="text-sm text-slate-500 mt-1">Top templates by contracts created</p>

          <div className="mt-6 space-y-5">
            {topTemplates.map((t: { name: string; count: number; pct: number }, idx: number) => {
              const color = [COLORS.blue, COLORS.purple, COLORS.green, COLORS.orange][idx % 4];
              return (
                <div key={t.name}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl grid place-items-center" style={{ backgroundColor: `${color}1A` }}>
                        <div className="w-4 h-4 rounded-md" style={{ backgroundColor: color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{t.name}</div>
                      </div>
                    </div>
                    <div className="text-slate-400 font-semibold">{formatK(t.count)}</div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, t.pct)}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}

            {topTemplates.length === 0 && <div className="text-sm text-slate-500">No templates yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
