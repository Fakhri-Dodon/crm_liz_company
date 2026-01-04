import { useEffect, useState } from "react";

export default function LeadModal({ open, onClose, onSubmit, initialData, currentUser, isAdmin = false }) {
  const [form, setForm] = useState({
    company_name: "",
    address: "",
    contact_person: "",
    email: "",
    phone: "",
    position: "",
    status: "",
    assigned_to: "",
  });

  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]); // State untuk users
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading untuk users
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch statuses dan users ketika modal dibuka
  useEffect(() => {
    if (open) {
      fetchStatuses();
      fetchUsers(); // Tambahkan fetch users
      setIsSubmitting(false);
    }
  }, [open]);

  // Fetch available statuses from API
  const fetchStatuses = async () => {
    try {
      setLoadingStatuses(true);
      const response = await fetch('/api/lead-statuses');
      const data = await response.json();
      setStatuses(data);
      
      // Set default status for NEW lead only
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

// Fetch users from API dengan error handling
const fetchUsers = async () => {
  try {
    setLoadingUsers(true);
    const response = await fetch('/api/users');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle jika response adalah error object
    if (data.error) {
      console.warn('API returned error:', data.error);
      // Fallback ke data dummy atau endpoint lain
      await fetchUsersFallback();
      return;
    }
    
    setUsers(data);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    // Coba endpoint alternatif
    await fetchUsersFallback();
  } finally {
    setLoadingUsers(false);
  }
};

// Fallback method
const fetchUsersFallback = async () => {
  try {
    console.log('Trying fallback users endpoint...');
    const response = await fetch('/api/users-simple');
    
    if (response.ok) {
      const data = await response.json();
      setUsers(data);
    } else {
      // Jika masih gagal, gunakan data dummy
      setUsers([
        {
          id: currentUser?.id || '1',
          name: currentUser?.name || 'Current User',
          email: currentUser?.email || 'user@example.com'
        },
        {
          id: '2',
          name: 'John Doe',
          email: 'john@example.com'
        },
        {
          id: '3',
          name: 'Jane Smith',
          email: 'jane@example.com'
        }
      ]);
    }
  } catch (fallbackErr) {
    console.error('Fallback also failed:', fallbackErr);
    setUsers([]);
  }
};

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        // EDIT MODE: Gunakan nilai dari initialData
        setForm({
          company_name: initialData.company_name || "",
          address: initialData.address || "",
          contact_person: initialData.contact_person || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          position: initialData.position || "",
          status: initialData.lead_statuses_id || "",
          assigned_to: initialData.assigned_to || "", // Gunakan nilai yang sudah ada
        });
      } else {
        // CREATE MODE: Auto-assign to current user sebagai default
        setForm({
          company_name: "",
          address: "",
          contact_person: "",
          email: "",
          phone: "",
          position: "",
          status: "",
          assigned_to: currentUser?.id || "", // Default ke current user
        });
      }
    }
  }, [initialData, open, currentUser]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Form data before submit:', form);
      console.log('Initial data:', initialData);
      console.log('Current user:', currentUser);
      
      // Validate required fields
      if (!form.company_name.trim()) {
        alert('Company name is required');
        setIsSubmitting(false);
        return;
      }
      
      if (!form.contact_person.trim()) {
        alert('Contact person is required');
        setIsSubmitting(false);
        return;
      }
      
      if (!form.status) {
        alert('Please select a status');
        setIsSubmitting(false);
        return;
      }
      
      // Jika assigned_to kosong dan ini create mode, auto-assign ke current user
      if (!form.assigned_to && !initialData && currentUser) {
        form.assigned_to = currentUser.id;
      }
      
      // Prepare payload
      const payload = {
        company_name: form.company_name,
        address: form.address,
        contact_person: form.contact_person,
        email: form.email,
        phone: form.phone,
        position: form.position,
        lead_statuses_id: form.status,
        assigned_to: form.assigned_to || null, // Bisa null jika tidak di-assign
      };
      
      console.log('Submitting payload:', payload);
      
      await onSubmit(payload);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status name for display
  const getStatusName = (statusId) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  };

  // Get selected user info
  const getSelectedUser = () => {
    if (!form.assigned_to) return null;
    return users.find(user => user.id === form.assigned_to);
  };

  const selectedUser = getSelectedUser();
  const currentUserIsSelected = selectedUser && currentUser && selectedUser.id === currentUser.id;

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
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={isSubmitting}
                  rows="2"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  name="position"
                  placeholder="Enter position"
                  value={form.position}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                {loadingStatuses ? (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50">
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
                    disabled={isSubmitting}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select a status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                )}
                {form.status && (
                  <div className="mt-1 text-sm text-gray-500">
                    Selected: {getStatusName(form.status)}
                  </div>
                )}
              </div>

              {/* Assigned To - Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                {loadingUsers ? (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-gray-50">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-500">Loading users...</span>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    No users found. Lead will be unassigned.
                  </div>
                ) : (
                  <>
                    <select
                      name="assigned_to"
                      value={form.assigned_to || ""}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a user (optional)</option>
                      <option value={currentUser?.id || ""}>
                        {currentUser ? `${currentUser.name} (You)` : 'Current User'}
                      </option>
                      <option value="" disabled>--- Other Users ---</option>
                      {users
                        .filter(user => !currentUser || user.id !== currentUser.id)
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} - {user.email}
                          </option>
                        ))}
                    </select>
                    
                    {/* Display selected user info */}
                    {selectedUser && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-semibold">
                              {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedUser.name}
                              {currentUserIsSelected && (
                                <span className="ml-2 text-xs text-green-600 font-medium">(You)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{selectedUser.email}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!form.assigned_to && (
                      <p className="text-xs text-gray-500 mt-1">
                        If left empty, lead will be unassigned
                        {!initialData && currentUser && " or assigned to you by default"}
                      </p>
                    )}
                  </>
                )}
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
                  disabled={isSubmitting}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statuses.length === 0 || !form.status || !form.company_name || !form.contact_person || isSubmitting}
                  className={`px-6 py-2.5 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2 ${
                    (statuses.length === 0 || !form.status || !form.company_name || !form.contact_person || isSubmitting)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {initialData ? "Updating..." : "Creating..."}
                    </>
                  ) : initialData ? (
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