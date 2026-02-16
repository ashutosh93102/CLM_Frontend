'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';

type FieldStatus = 'Mandatory' | 'Optional';

interface FieldRow {
  id: string;
  name: string;
  subtitle: string;
  usage: number;
  status: FieldStatus;
  iconBg: string;
}

const IndexingPageV2: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'recent' | 'archived'>('all');

  const rows = useMemo<FieldRow[]>(
    () => [
      {
        id: 'effective_date',
        name: 'Effective Date',
        subtitle: 'System Field • DateFormat',
        usage: 100,
        status: 'Mandatory',
        iconBg: 'bg-blue-100 text-blue-600',
      },
      {
        id: 'contract_value',
        name: 'Contract Value',
        subtitle: 'Custom Field • Currency',
        usage: 85,
        status: 'Optional',
        iconBg: 'bg-violet-100 text-violet-600',
      },
      {
        id: 'counterparty_name',
        name: 'Counterparty Name',
        subtitle: 'System Field • Text',
        usage: 99,
        status: 'Mandatory',
        iconBg: 'bg-orange-100 text-orange-600',
      },
      {
        id: 'jurisdiction',
        name: 'Jurisdiction',
        subtitle: 'Custom Field • Dropdown',
        usage: 45,
        status: 'Optional',
        iconBg: 'bg-emerald-100 text-emerald-600',
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-[#1F2937]">Metadata Management</h1>
          <div className="relative">
            <select className="appearance-none bg-white rounded-full border border-black/10 px-4 py-2 pr-10 text-sm font-medium text-[#111827] shadow-sm">
              <option>Contracts</option>
              <option>Templates</option>
              <option>Workflows</option>
            </select>
            <svg className="w-4 h-4 text-black/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white rounded-full border border-black/10 px-4 py-2 shadow-sm">
            <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="outline-none text-sm text-[#111827] placeholder:text-black/35 w-56"
              placeholder="Search fields..."
            />
          </div>

          <button className="bg-[#111827] text-white rounded-full px-5 py-2 text-sm font-semibold shadow-sm hover:bg-black transition">
            + New Field
          </button>

          <button className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm grid place-items-center text-black/45 hover:text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Top cards */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-12 gap-6">
          {/* Total metadata fields */}
          <div className="col-span-12 md:col-span-7 bg-gradient-to-br from-[#FF6B77] to-[#FF8FA3] rounded-[28px] p-7 text-white shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <p className="text-white/90 text-sm font-semibold">Total Metadata Fields</p>
              <button className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <div className="mt-4 text-6xl font-bold leading-none">142</div>

            <div className="mt-10 grid grid-cols-3 gap-6">
              <div>
                <p className="text-white/70 text-[10px] tracking-wider uppercase">Required</p>
                <p className="text-white font-semibold mt-1">24</p>
              </div>
              <div>
                <p className="text-white/70 text-[10px] tracking-wider uppercase">Optional</p>
                <p className="text-white font-semibold mt-1">118</p>
              </div>
              <div>
                <p className="text-white/70 text-[10px] tracking-wider uppercase">Hidden</p>
                <p className="text-white font-semibold mt-1">0</p>
              </div>
            </div>

            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute -right-24 -top-24 w-64 h-64 bg-white/10 rounded-full" />
          </div>

          {/* Usage status */}
          <div className="col-span-12 md:col-span-5 bg-white rounded-[28px] p-7 shadow-sm border border-black/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#111827] text-sm font-semibold">Usage Status</p>
                <p className="text-4xl font-bold text-[#111827] mt-3">98%</p>
              </div>
              <button className="text-black/30 hover:text-black/50">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full"
                style={{
                  background:
                    'conic-gradient(#FF5C7A 0 331deg, #F59E0B 331deg 360deg)',
                }}
              >
                <div className="w-full h-full rounded-full bg-white p-[10px]">
                  <div className="w-full h-full rounded-full bg-white" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#FF5C7A]" />
                  <div className="text-sm text-black/60">active</div>
                  <div className="text-sm font-semibold text-[#111827] ml-auto">92%</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <div className="text-sm text-black/60">deprecated</div>
                  <div className="text-sm font-semibold text-[#111827] ml-auto">8%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Small cards */}
          <div className="col-span-12 grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 bg-white rounded-[28px] p-7 shadow-sm border border-black/5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-red-50 grid place-items-center text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.7-3.05L13.7 4.95a2 2 0 00-3.4 0L3.3 15.95A2 2 0 005 19z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-xs text-black/40 font-medium">Data Missing</p>
                  <div className="mt-1 w-16 h-1 rounded-full bg-black/10 overflow-hidden ml-auto">
                    <div className="h-full w-1/3 bg-[#FF5C7A]" />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-3xl font-bold text-[#111827]">4.2k</p>
                <p className="text-sm text-black/45 mt-1">docs</p>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 bg-white rounded-[28px] p-7 shadow-sm border border-black/5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 grid place-items-center text-orange-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.54.54l.96-.96a5 5 0 10-7.07-7.07l-1.06 1.06A5 5 0 0010 13zm-1 1a5 5 0 01-7.54-.54l-.96-.96a5 5 0 017.07-7.07l1.06 1.06A5 5 0 019 14z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-xs text-black/40 font-medium">Linked Fields</p>
                  <div className="mt-1 w-16 h-1 rounded-full bg-black/10 overflow-hidden ml-auto">
                    <div className="h-full w-3/4 bg-[#111827]" />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-3xl font-bold text-[#111827]">87</p>
              </div>
            </div>
          </div>

          {/* Fields list */}
          <div className="col-span-12 bg-white rounded-[28px] p-6 shadow-sm border border-black/5">
            <div className="flex items-center gap-6 border-b border-black/5 pb-4">
              <button
                onClick={() => setTab('all')}
                className={`text-sm font-semibold ${tab === 'all' ? 'text-[#111827]' : 'text-black/40'}`}
              >
                All Fields
              </button>
              <button
                onClick={() => setTab('recent')}
                className={`text-sm font-semibold ${tab === 'recent' ? 'text-[#111827]' : 'text-black/40'}`}
              >
                Recently Added
              </button>
              <button
                onClick={() => setTab('archived')}
                className={`text-sm font-semibold ${tab === 'archived' ? 'text-[#111827]' : 'text-black/40'}`}
              >
                Archived
              </button>
              <div className="ml-auto" />
            </div>

            <div className="mt-4 space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-4 bg-[#F6F3ED] rounded-2xl px-4 py-4"
                >
                  <div className={`w-10 h-10 rounded-2xl grid place-items-center ${row.iconBg}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111827] truncate">{row.name}</p>
                    <p className="text-xs text-black/45 truncate">{row.subtitle}</p>
                  </div>

                  <div className="hidden md:block text-right">
                    <p className="text-[11px] text-black/40">Usage</p>
                    <p className="text-sm font-semibold text-[#111827]">{row.usage}%</p>
                  </div>

                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status === 'Mandatory'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {row.status}
                  </span>

                  <button className="ml-2 text-black/35 hover:text-black/55">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-black/5">
            <div className="flex items-center justify-between">
              <p className="text-[#111827] text-sm font-semibold">Data Quality</p>
              <button className="text-black/30 hover:text-black/50">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-7 gap-3 items-end h-40">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => {
                  const heights = [40, 55, 35, 92, 48, 60, 44];
                  const active = idx === 3;
                  return (
                    <div key={d} className="flex flex-col items-center gap-3">
                      <div className="w-4 bg-black/10 rounded-full overflow-hidden" style={{ height: 110 }}>
                        <div
                          className={`${active ? 'bg-[#FF5C7A]' : 'bg-black/15'} w-full rounded-full`}
                          style={{ height: `${heights[idx]}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-black/35 font-semibold">{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 bg-[#F6F3ED] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white grid place-items-center text-[#FF5C7A] border border-black/5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Validation Rules</p>
                  <p className="text-xs text-black/45">12 Active Rules</p>
                </div>
              </div>
              <p className="text-sm font-bold text-[#111827]">96%</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IndexingPageV2;
