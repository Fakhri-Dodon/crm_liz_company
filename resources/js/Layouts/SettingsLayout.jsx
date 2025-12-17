import { Link, usePage } from '@inertiajs/react';
import { Settings, Users, FileText, Mail, LayoutDashboard, Menu, PieChart } from 'lucide-react';
import { useState } from 'react';

export default function SettingsLayout({ children }) {
  const { url } = usePage(); // ganti useLocation
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { label: 'General', icon: Settings, href: route('settings.general') },
    { label: 'User Roles', icon: Users, href: route('settings.user-roles') },
    { label: 'Leads', icon: LayoutDashboard, href: route('settings.leads') },
    { label: 'Proposals', icon: FileText, href: route('settings.proposals') },
    { label: 'Email', icon: Mail, href: route('settings.email') },
    { label: 'Dashboard', icon: PieChart, href: route('dashboard') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-teal-900 text-white transition-all duration-300 flex flex-col fixed h-full z-10`}
      >
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
            const Icon = item.icon;
            const isActive = url.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
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

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
