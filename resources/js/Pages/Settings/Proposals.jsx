import React, { useState } from 'react';
import SettingsLayout from '@/Layouts/SettingsLayout';

const ProposalSettings = () => {
  // Data dummy untuk proposal settings
  const [proposalSettings, setProposalSettings] = useState({
    prefix: 'PRD-',
    padding: 5,
    nextNumber: 1,
    userBaseVisibility: true,
    defaultFilterByUser: true,
  });

  const [proposalStatuses] = useState([
    { id: 1, status: 'Draft', note: 'Appears when a user creates a new proposal', color: '#6B7280', createdBy: 'System' },
    { id: 2, status: 'Sent', note: 'Appears when a user sends a proposal', color: '#3B82F6', createdBy: 'System' },
    { id: 3, status: 'Opened', note: 'Appears when email has been opened', color: '#F97316', createdBy: 'System' },
    { id: 4, status: 'Cancelled', note: 'Manually changed by user', color: '#EF4444', createdBy: 'By User' },
    { id: 5, status: 'Accepted', note: 'Manually changed by user', color: '#10B981', createdBy: 'By User' },
  ]);

  const [templates] = useState(['Modern', 'Professional', 'Creative']);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProposalSettings((prev) => ({
      ...prev,
      [name]: name === 'padding' || name === 'nextNumber' ? parseInt(value) || 0 : value,
    }));
  };

  const handleToggleChange = (name) => {
    setProposalSettings((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const proposalNumberExample = `${proposalSettings.prefix}${proposalSettings.nextNumber.toString().padStart(proposalSettings.padding, '0')}`;

  return (
    <SettingsLayout>
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Proposal Settings</h2>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="space-y-8">
            {/* Proposal Numbering Setting */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Proposal Numbering Setting</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Prefix</label>
                  <input
                    type="text"
                    name="prefix"
                    value={proposalSettings.prefix}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed text added at the beginning of the proposal number.</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Padding</label>
                  <input
                    type="number"
                    name="padding"
                    value={proposalSettings.padding}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sets the length of the numeric part. Extra zeros are added to maintain consistent length.</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Next Number</label>
                  <input
                    type="number"
                    name="nextNumber"
                    value={proposalSettings.nextNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Starting number for the next proposal.</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
                <p className="font-medium text-blue-800 mb-1">
                  Example: {proposalNumberExample} (Padding {proposalSettings.padding})
                </p>
                <p className="text-blue-700 text-sm">
                  Display proposal number when saving proposal, for example "{proposalNumberExample}"
                </p>
              </div>
            </div>

            {/* Proposal Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Proposal Status</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Color</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {proposalStatuses.map((status) => (
                      <tr key={status.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{status.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{status.status}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">{status.note}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div 
                              className="w-5 h-5 rounded mr-2 border border-gray-300"
                              style={{ backgroundColor: status.color }}
                            ></div>
                            <span className="text-gray-600">{status.color}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{status.createdBy}</td>
                        <td className="px-4 py-3">
                          <button 
                            className="p-1 text-gray-500 hover:text-gray-700 mr-2"
                            onClick={() => alert(`Edit status: ${status.status} (Demo Mode)`)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() => alert(`Delete status: ${status.status} (Demo Mode)`)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button 
                className="mb-8 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                onClick={() => alert('Add new status (Demo Mode)')}
              >
                + Add Status
              </button>
            </div>

            {/* Proposal Restrictions */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Proposal Restrictions</h3>
              <div className="space-y-4 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="mb-3 md:mb-0">
                    <h4 className="font-medium text-gray-800 mb-1">User-Base Visibility</h4>
                    <p className="text-sm text-gray-600 mb-1">Restrict users to see only Proposals they created or related to their Leads.</p>
                    <p className="text-xs text-gray-500">ON = only own Proposals</p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 font-medium">{proposalSettings.userBaseVisibility ? 'ON' : 'OFF'}</span>
                    <div 
                      className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${proposalSettings.userBaseVisibility ? 'bg-green-500' : 'bg-gray-300'}`}
                      onClick={() => handleToggleChange('userBaseVisibility')}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${proposalSettings.userBaseVisibility ? 'translate-x-7' : ''}`}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="mb-3 md:mb-0">
                    <h4 className="font-medium text-gray-800 mb-1">Default Filter by User Login</h4>
                    <p className="text-sm text-gray-600 mb-1">Automatically filter Proposal table to show only data related to the logged-in user.</p>
                    <p className="text-xs text-gray-500">OFF = all visible Proposals. If OFF, table shows all visible Proposals initially, user can still filter manually.</p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 font-medium">{proposalSettings.defaultFilterByUser ? 'ON' : 'OFF'}</span>
                    <div 
                      className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${proposalSettings.defaultFilterByUser ? 'bg-green-500' : 'bg-gray-300'}`}
                      onClick={() => handleToggleChange('defaultFilterByUser')}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${proposalSettings.defaultFilterByUser ? 'translate-x-7' : ''}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template (Proposal) */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Template (Proposal)</h3>
              <div className="flex flex-wrap gap-4 mb-6">
                {templates.map((template) => (
                  <div key={template} className="w-48 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center mb-3">
                      <span className="text-gray-500 font-medium">{template}</span>
                    </div>
                    <div className="font-medium text-gray-800 text-center mb-3">{template}</div>
                    <button 
                      className="w-full py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm"
                      onClick={() => alert(`Selected template: ${template} (Demo Mode)`)}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                className="mb-8 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                onClick={() => alert('Add new template (Demo Mode)')}
              >
                + Add Template
              </button>
            </div>

            <div className="pt-5 border-t border-gray-200">
              <button
                onClick={() => alert('Proposal settings saved! (Demo Mode)')}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                Save Proposal Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default ProposalSettings;