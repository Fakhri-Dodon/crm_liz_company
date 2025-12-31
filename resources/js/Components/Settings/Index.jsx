import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Users, FileText, Mail, LayoutDashboard, Menu } from 'lucide-react';
import { createPageUrl } from './utils';

export default function Layout({ children }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const navItems = [
    { label: 'General', icon: Settings, path: createPageUrl('General') },
    { label: 'User Roles', icon: Users, path: createPageUrl('UserRoles') },
    { label: 'Leads', icon: LayoutDashboard, path: createPageUrl('Leads') },
    { label: 'Proposals', icon: FileText, path: createPageUrl('Proposals') },
    { label: 'Email', icon: Mail, path: createPageUrl('Email') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (desktop) */}
      <aside className={`hidden md:flex bg-teal-900 text-white transition-all duration-300 flex-col fixed h-full z-20 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between border-b border-teal-800">
          {isSidebarOpen && <span className="font-bold text-xl">AdminPanel</span>}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-teal-800 rounded"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6 shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Sidebar (mobile overlay) */}
      {isMobileOpen && (
        <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-teal-900 text-white z-50 p-4 shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg">AdminPanel</span>
            <button onClick={() => setIsMobileOpen(false)} className="p-1 hover:bg-teal-800 rounded">
              ✕
            </button>
          </div>

          <nav className="flex-1 py-2 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-700 text-white'
                      : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-6 h-6 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main Content */}
      {/* overlay for mobile when sidebar open */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64 ml-0' : 'md:ml-20 ml-0'}`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Mobile navbar: fixed top bar showing logo, AdminPanel text and hamburger */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-900 text-white rounded flex items-center justify-center font-bold">AP</div>
              <div className="text-lg font-bold text-teal-900">AdminPanel</div>
            </div>

            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 bg-white rounded shadow"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-teal-900" />
            </button>
          </div>

          <div className="pt-16 md:pt-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}