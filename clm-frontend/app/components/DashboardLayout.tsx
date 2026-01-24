'use client';

import React from 'react';
import SidebarV2 from './SidebarV2';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  description,
  breadcrumbs,
}) => {
  return (
    <div className="flex h-screen bg-[#F2F0EB]">
      {/* Sidebar */}
      <SidebarV2 />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header Section */}
        {(title || breadcrumbs) && (
          <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="px-6 md:px-8 py-6">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-slate-400">/</span>}
                      {crumb.href ? (
                        <a
                          href={crumb.href}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {crumb.label}
                        </a>
                      ) : (
                        <span className="text-slate-600">{crumb.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Title & Description */}
              {title && (
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                  {description && (
                    <p className="text-slate-600 mt-2">{description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
