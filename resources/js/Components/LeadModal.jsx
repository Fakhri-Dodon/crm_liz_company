import { useEffect, useState } from "react";
import { X, FileText, UserPlus, Save, Loader2 } from "lucide-react";

export default function LeadModal({ open, onClose, onSubmit, initialData, currentUser, isAdmin = false }) {
  const [form, setForm] = useState({
    company_name: "",
    address: "",
    contact_person: "",
    email: "",
    phone: "",
    position: "",
    assigned_to: "",
  });

  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIC (Diubah) ---
  useEffect(() => {
    if (open) {
      fetchStatuses();
      fetchUsers();
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Fungsi untuk mendapatkan ID status "new"
  const getNewStatusId = () => {
    const newStatus = statuses.find(s => s.name.toLowerCase() === 'new');
    return newStatus ? newStatus.id : (statuses.length > 0 ? statuses[0].id : null);
  };

  const fetchStatuses = async () => {
    try {
      setLoadingStatuses(true);
      const response = await fetch('/api/lead-statuses');
      const data = await response.json();
      setStatuses(data);
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
      setStatuses([]);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) {
        await fetchUsersFallback();
        return;
      }
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      await fetchUsersFallback();
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUsersFallback = async () => {
    try {
      const response = await fetch('/api/users-simple');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setUsers([
          { id: currentUser?.id || '1', name: currentUser?.name || 'Current User', email: currentUser?.email || 'user@example.com' },
          { id: '2', name: 'John Doe', email: 'john@example.com' },
          { id: '3', name: 'Jane Smith', email: 'jane@example.com' }
        ]);
      }
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          company_name: initialData.company_name || "",
          address: initialData.address || "",
          contact_person: initialData.contact_person || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          position: initialData.position || "",
          assigned_to: initialData.assigned_to || "",
        });
      } else {
        setForm({
          company_name: "", 
          address: "", 
          contact_person: "", 
          email: "",
          phone: "", 
          position: "", 
          assigned_to: currentUser?.id || "",
        });
      }
    }
  }, [initialData, open, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!form.company_name.trim() || !form.contact_person.trim()) {
        alert('Please fill required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Selalu gunakan status "new" sebagai default
      const newStatusId = getNewStatusId();
      if (!newStatusId) {
        alert('Status "new" not found. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        // Selalu set lead_statuses_id ke status "new"
        lead_statuses_id: newStatusId,
        assigned_to: form.assigned_to || (initialData ? form.assigned_to : (currentUser?.id || null)),
      };
      
      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedUser = () => {
    if (!form.assigned_to) return null;
    return users.find(user => user.id === form.assigned_to);
  };

  if (!open) return null;

  const selectedUser = getSelectedUser();
  const IconHeader = initialData ? FileText : UserPlus;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 transition-all duration-300">
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#005954]/10 rounded-lg">
                <IconHeader className="w-6 h-6 text-[#005954]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {initialData ? "Edit Lead" : "Create New Lead"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {initialData ? "Update lead information" : "Add a new lead to your database"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Enter company name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#005954]/20 focus:border-[#005954] outline-none transition-all disabled:bg-gray-50"
                    required
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contact_person"
                    value={form.contact_person}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Full Name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#005954]/20 focus:border-[#005954] outline-none transition-all"
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Job Title"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#005954]/20 focus:border-[#005954] outline-none transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1"> Email <span className="text-red-500">*</span> </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="name@company.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#005954]/20 focus:border-[#005954] outline-none transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1"> Phone <span className="text-red-500">*</span> </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="+62..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#005954]/20 focus:border-[#005954] outline-none transition-all"
                    required
                  />
                </div>

                {/* Status - DIHAPUS DARI UI */}
                {/* Dropdown status dihapus dari sini */}

                {/* Assign To */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1"> Assign To </label>
                  <select
                    name="assigned_to"
                    value={form.assigned_to || ""}
                    onChange={handleChange}
                    disabled={isSubmitting || loadingUsers}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#005954]/20 focus:border-[#005954] outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} {u.id === currentUser?.id ? '(You)' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1"> Address </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows="2"
                    placeholder="Enter full address"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#005954]/20 focus:border-[#005954] outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {selectedUser && (
                <div className="mt-2 p-3 bg-[#005954]/5 border border-[#005954]/10 rounded-xl flex items-center gap-3">
                   <div className="w-8 h-8 bg-[#005954] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {selectedUser.name?.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                   </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.company_name}
                className="px-6 py-3 bg-[#005954] text-white rounded-xl hover:bg-[#004d48] transition-all font-medium flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {initialData ? "Update Lead" : "Create Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}