'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Settings</h1>
        <button
          className="w-11 h-11 rounded-full bg-white border border-slate-200 inline-flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-700" />
        </button>
      </div>
      <div className="bg-white rounded-[28px] border border-black/5 shadow-sm p-6">
        <p className="text-sm text-black/60">Settings UI placeholder (matches nav in screenshots).</p>
      </div>
    </DashboardLayout>
  );
}
