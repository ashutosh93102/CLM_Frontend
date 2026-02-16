'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Contracts', 
      href: '/contracts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: 'Approvals', 
      href: '/approvals',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Templates', 
      href: '/templates',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
        </svg>
      )
    },
  ];

  const renderNav = (expanded: boolean, isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="mb-8 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF7E5F] to-[#FEB47B] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          {expanded && (
            <span className="text-white font-bold text-lg whitespace-nowrap">CLM System</span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-4">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={index}
              href={item.href}
              onClick={() => {
                if (isMobile) setIsMobileOpen(false);
              }}
              className={`relative group cursor-pointer transition-all rounded-xl ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              } ${expanded ? 'px-4 py-3' : 'px-0 py-3 flex justify-center'}`}
            >
              {isActive && !expanded && (
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#FF7E5F] to-[#FEB47B] rounded-r-full"></div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{item.icon}</div>
                {expanded && <span className="font-medium whitespace-nowrap">{item.name}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Avatar & Logout */}
      <div className="mt-auto w-full px-4">
        {expanded && onLogout && (
          <button
            onClick={() => {
              if (isMobile) setIsMobileOpen(false);
              onLogout();
            }}
            className="w-full mb-4 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        )}

        <div className={`${expanded ? 'flex items-center gap-3 px-2' : 'flex justify-center'}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center cursor-pointer hover:ring-2 ring-white/20 transition flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          {expanded && (
            <div className="text-left">
              <p className="text-white text-sm font-medium">John Doe</p>
              <p className="text-gray-400 text-xs">Admin</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed left-3 top-3 z-50 w-11 h-11 rounded-xl bg-[#0F141F] text-white shadow-lg flex items-center justify-center"
        aria-label="Open navigation"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isMobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 h-full bg-[#0F141F] w-[82vw] max-w-[320px] flex flex-col items-center py-8 transition-transform duration-300 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute right-3 top-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="w-10 h-10 rounded-lg hover:bg-white/10 text-white flex items-center justify-center"
              aria-label="Close navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {renderNav(true, true)}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex fixed left-0 top-0 h-full bg-[#0F141F] flex-col items-center py-8 z-50 transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-[90px]'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {renderNav(isExpanded, false)}
      </div>
    </>
  );
};

export default Sidebar;
