import { Link, usePage } from '@inertiajs/react';
import { Settings, Users, FileText, Mail, LayoutDashboard, Menu, PieChart, Quote, Receipt, Percent } from 'lucide-react';
import { useState } from 'react';

export default function SettingsLayout({ children }) {
  const { url } = usePage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { label: 'General', icon: Settings, href: '/setting/general' },
    { label: 'User Roles', icon: Users, href: '/setting/user-roles' },
    { label: 'Leads', icon: LayoutDashboard, href: '/setting/leads' },
    { label: 'Proposals', icon: FileText, href: '/setting/proposals' },
    { label: 'Quotations', icon: Quote, href: '/setting/quotations' },
    { label: 'Invoices', icon: Receipt, href: '/setting/invoices' },
    { label: 'PPN & PPH', icon: Percent, href: '/setting/tax' },
    { label: 'Email', icon: Mail, href: '/setting/email' },
    { label: 'Dashboard', icon: PieChart, href: '/dashboard' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-teal-900 text-white transition-all duration-300 flex flex-col fixed h-full z-10 shadow-xl`}
      >
        <div className="p-4 flex items-center justify-between border-b border-teal-800/50">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                <span className="font-bold text-white uppercase text-xs">AP</span>
              </div>
              <span className="font-bold text-xl tracking-tight">AdminPanel</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = url === item.href || url.startsWith(item.href + '/');

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-inner shadow-black/10'
                    : 'text-teal-100/70 hover:bg-teal-800/50 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-6 bg-teal-400 rounded-r-full shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                )}

                <Icon 
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-teal-300 scale-110' : 'group-hover:scale-110'
                  }`} 
                />
                
                {isSidebarOpen && (
                  <span className={`font-medium ${isActive ? 'translate-x-1 transition-transform' : ''}`}>
                    {item.label}
                  </span>
                )}
                {!isSidebarOpen && (
                  <div className="absolute left-16 bg-teal-800 text-white px-2 py-1 rounded md:hidden group-hover:block whitespace-nowrap text-xs z-50 shadow-lg border border-teal-700">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
             <span className="hover:text-teal-700 cursor-pointer">Settings</span>
             <span>/</span>
             <span className="text-teal-900 font-semibold capitalize">
                {url.split('/').pop()?.replace('-', ' ')}
             </span>
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
}