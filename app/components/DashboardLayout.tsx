'use client';

import React, { useState } from 'react';
import SidebarV2 from './SidebarV2';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F2F0EB]">
      {/* Sidebar */}
      <SidebarV2 mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-[60] inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F141F] text-white shadow-lg"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Content */}
        <div className="px-6 md:px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
