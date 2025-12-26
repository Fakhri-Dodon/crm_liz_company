import { useEffect, useState } from "react";

export default function LeadModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState({
    company_name: "",
    address: "",
    contact_person: "",
    email: "",
    phone: "",
    status: "",
    assigned_to: "",
  });

  const [statuses, setStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  // Fetch statuses when modal opens
  useEffect(() => {
    if (open) {
      fetchStatuses();
    }
  }, [open]);

  // Fetch available statuses from API
  const fetchStatuses = async () => {
    try {
      setLoadingStatuses(true);
      const response = await fetch('/api/lead-statuses');
      const data = await response.json();
      setStatuses(data);
      
      // Set default status if none selected
      if (!initialData && data.length > 0 && !form.status) {
        const defaultStatus = data.find(s => s.name.toLowerCase() === 'new') || data[0];
        setForm(prev => ({
          ...prev,
          status: defaultStatus.id,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
      setStatuses([]);
    } finally {
      setLoadingStatuses(false);
    }
  };

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          company_name: initialData.company_name || "",
          address: initialData.address || "",
          contact_person: initialData.contact_person || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          status: initialData.lead_statuses_id || "",
          assigned_to: initialData.assigned_to || "",
        });
      } else {
        setForm({
          company_name: "",
          address: "",
          contact_person: "",
          email: "",
          phone: "",
          status: "",
          assigned_to: "",
        });
      }
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

// In LeadModal.jsx - handleSubmit
const handleSubmit = (e) => {
    e.preventDefault();
    
    // Debug
    console.log('Form status value:', form.status);
    console.log('Statuses available:', statuses);
    
    // Cari status object berdasarkan ID
    const selectedStatus = statuses.find(s => s.id === form.status);
    
    if (!selectedStatus) {
        alert('Please select a valid status');
        return;
    }
    
    // Prepare payload - KIRIM lead_statuses_id, bukan status
    const payload = {
        company_name: form.company_name,
        address: form.address,
        contact_person: form.contact_person,
        email: form.email,
        phone: form.phone,
        assigned_to: form.assigned_to,
        lead_statuses_id: form.status, // INI YANG DIBUTUHKAN API
    };
    
    console.log('Payload being sent:', payload);
    
    // If editing, include the ID
    if (initialData?.id) {
        payload.id = initialData.id;
    }
    
    onSubmit(payload);
};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${initialData ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {initialData ? (
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {initialData ? "Edit Lead" : "Create New Lead"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {initialData ? "Update lead information" : "Add a new lead to your database"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Body - Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4 mb-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="company_name"
                  placeholder="Enter company name"
                  value={form.company_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  placeholder="Enter company address"
                  value={form.address}
                  onChange={handleChange}
                  rows="2"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  name="contact_person"
                  placeholder="Enter contact person name"
                  value={form.contact_person}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="contact@company.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {loadingStatuses ? (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2.5">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-500">Loading statuses...</span>
                    </div>
                  </div>
                ) : statuses.length === 0 ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    No statuses available. Please create statuses first in Settings.
                  </div>
                ) : (
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select a status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <input
                  name="assigned_to"
                  placeholder="Assign to team member"
                  value={form.assigned_to}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-500">
                Fields marked with <span className="text-red-500">*</span> are required
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statuses.length === 0 || !form.status}
                  className={`px-6 py-2.5 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2 ${
                    (statuses.length === 0 || !form.status)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                  }`}
                >
                  {initialData ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Update Lead
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Create Lead
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}