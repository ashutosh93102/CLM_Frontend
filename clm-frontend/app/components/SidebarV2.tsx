'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  activePaths?: string[];
}

const SidebarV2: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h8v8H4V6zm0 12h8v2H4v-2zm10-12h6v2h-6V6zm0 4h6v10h-6V10z" />
        </svg>
      ),
      activePaths: ['/dashboard'],
    },
    {
      name: 'Contracts',
      href: '/contracts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      activePaths: ['/contracts', '/create-contract'],
    },
    {
      name: 'Indexing',
      href: '/indexing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4a6 6 0 104.472 10.03l4.249 4.25 1.414-1.415-4.25-4.249A6 6 0 0010 4z" />
        </svg>
      ),
      activePaths: ['/indexing'],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      activePaths: ['/analytics'],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 110-6 3 3 0 010 6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a7.97 7.97 0 00.1-2 7.97 7.97 0 00-.1-2l2-1.5-2-3.5-2.3.8a7.98 7.98 0 00-3.4-2l-.4-2.4h-4l-.4 2.4a7.98 7.98 0 00-3.4 2l-2.3-.8-2 3.5 2 1.5a7.97 7.97 0 00-.1 2c0 .7 0 1.3.1 2l-2 1.5 2 3.5 2.3-.8a7.98 7.98 0 003.4 2l.4 2.4h4l.4-2.4a7.98 7.98 0 003.4-2l2.3.8 2-3.5-2-1.5z" />
        </svg>
      ),
      activePaths: ['/settings'],
    },
  ];

  const isActive = (navItem: NavItem): boolean => {
    if (navItem.activePaths?.includes(pathname)) {
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#0F141F] z-50 transition-all duration-300 flex flex-col ${
          isExpanded ? 'w-64' : 'w-[90px]'
        } ${isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0'}`}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div className="flex items-center h-20 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF5C7A] rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col">
                <span className="text-white font-bold text-base whitespace-nowrap">Searchly</span>
                <span className="text-white/50 text-xs whitespace-nowrap">Workspace</span>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          {isMobile && (
            <button
              onClick={() => setIsExpanded(false)}
              className="ml-auto p-2 rounded-lg hover:bg-white/10 text-white/70"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'
                  } ${
                    active
                      ? 'text-white bg-white/10'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {active && !isExpanded && (
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF5C7A] rounded-r-full" />
                  )}

                  <div className="flex-shrink-0">{item.icon}</div>
                  {isExpanded && <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto px-4 pb-6">
          <div className={`${isExpanded ? 'flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/5' : 'flex justify-center py-3'} transition`}
          >
            <div className="w-10 h-10 rounded-full bg-[#1F2937] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {(user?.email?.[0] || 'J').toUpperCase()}
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.email || 'Jane Cooper'}</p>
                <p className="text-white/45 text-xs truncate">Admin</p>
              </div>
            )}
            {isExpanded && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                aria-label="Logout"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Spacer for non-mobile, overlap handler for mobile */}
      <div
        className={`hidden md:block transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-[90px]'
        }`}
      />
    </>
  );
};

export default SidebarV2;
