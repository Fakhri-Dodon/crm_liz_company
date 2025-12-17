import React, { useState } from 'react';
import GeneralSettings from './GeneralSettings';
import UserRoleSettings from './UserRoleSettings';
import LeadSettings from './LeadSettings';
import ProposalSettings from './ProposalSettings';
import EmailSettings from './EmailSettings';

const SettingsDashboard = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: '⚙️ General Settings', component: <GeneralSettings /> },
    { id: 'user-roles', label: '👥 User Roles', component: <UserRoleSettings /> },
    { id: 'lead', label: '📋 Lead Settings', component: <LeadSettings /> },
    { id: 'proposal', label: '📄 Proposal Settings', component: <ProposalSettings /> },
    { id: 'email', label: '📧 Email Settings', component: <EmailSettings /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-gray-200 mt-1">Configure your application settings and user permissions</p>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <nav className="lg:w-64 bg-white border-r border-gray-200 shadow-sm">
          <ul className="py-4">
            {tabs.map((tab) => (
              <li
                key={tab.id}
                className={`flex items-center px-6 py-3 cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsDashboard;