import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import TableLayout from "@/Layouts/TableLayout";
import leadsService from "@/services/leadsService";
import LeadModal from "@/Components/LeadModal";
import DeleteConfirmationModal from "@/Components/DeleteConfirmationModal";
import NotificationModal from "@/Components/NotificationModal";

export default function LeadsIndex({ leads: initialLeads = [] }) {
    const { props } = usePage();
    
    // DEBUG: Cek data dari Inertia
    console.log('📦 Initial leads from Inertia:', initialLeads);
    console.log('📦 Props from Inertia:', props);
    
    // State untuk leads
    const [leads, setLeads] = useState(() => {
        if (Array.isArray(initialLeads) && initialLeads.length > 0) {
            return initialLeads;
        }
        return [];
    });
    
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [search, setSearch] = useState("");
    
    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [notificationData, setNotificationData] = useState({ type: 'success', title: '', message: '' });
    const [leadToDelete, setLeadToDelete] = useState(null);

    // Columns definition untuk tabel
    const columns = [
        { key: "company_name", label: "Company Name" },
        { key: "address", label: "Address" },
        { key: "contact_person", label: "Contact Person" },
        {
            key: "email",
            label: "Email & Phone",
            render: (_, row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.email || '-'}</div>
                    <div className="text-gray-500 text-sm mt-1">{row.phone || '-'}</div>
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (value) => (
                <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        value === "new"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                    }`}
                >
                    {value ? value.toUpperCase() : 'NEW'}
                </span>
            ),
        },
    ];

    // Fetch data saat pertama load
    useEffect(() => {
        console.log('🔄 useEffect triggered, leads count:', leads.length);
        if (leads.length === 0) {
            fetchLeads();
        }
    }, []);

    // Fetch leads dari API
    const fetchLeads = async () => {
        console.log('📡 Fetching leads from API...');
        try {
            setLoading(true);
            const res = await leadsService.getAll();
            console.log('📡 API Response:', res.data.length, 'leads');
            
            if (Array.isArray(res.data)) {
                setLeads(res.data);
                console.log('✅ Leads state updated with', res.data.length, 'items');
            } else {
                console.warn('⚠️ API returned non-array data:', res.data);
                setLeads([]);
            }
        } catch (err) {
            console.error('❌ Fetch leads failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk menampilkan notifikasi
    const showNotification = (type, title, message) => {
        setNotificationData({ type, title, message });
        setNotificationModalOpen(true);
    };

    // Add new lead
    const handleAdd = () => {
        console.log('➕ Add button clicked');
        setSelectedLead(null);
        setModalOpen(true);
    };

    // Edit lead
    const handleEdit = (row) => {
        console.log('✏️ Edit lead:', row.id, row.company_name);
        setSelectedLead(row);
        setModalOpen(true);
    };

    // Submit lead (create/update)
    const handleSubmit = async (payload) => {
        console.log('📨 Submitting lead:', payload);
        try {
            if (selectedLead) {
                console.log('🔄 Updating existing lead:', selectedLead.id);
                await leadsService.update(selectedLead.id, payload);
            } else {
                console.log('🆕 Creating new lead');
                await leadsService.create(payload);
            }
            setModalOpen(false);
            
            // Refresh data setelah create/update
            await fetchLeads();
            
            // Tampilkan notifikasi
            showNotification('success', selectedLead ? 'Lead Updated' : 'Lead Created', 
                selectedLead ? 'Lead has been updated successfully!' : 'New lead has been created successfully!');
            
        } catch (err) {
            console.error('❌ Save failed:', err);
            showNotification('error', 'Save Failed', err.response?.data?.message || err.message);
        }
    };

    // Handler untuk memulai proses delete
    const handleDelete = (row) => {
        console.log('🗑️ Delete initiated for:', row.id, row.company_name);
        setLeadToDelete(row);
        setDeleteModalOpen(true);
    };

    // Handler untuk konfirmasi delete
    const handleConfirmDelete = async (lead) => {
        console.log('=== HARD DELETE PROCESS ===');
        console.log('Deleting:', lead.id, lead.company_name);

        try {
            // Panggil API untuk HARD DELETE
            const response = await leadsService.delete(lead.id);
            console.log('Hard delete successful:', response.data);
            
            // Update state langsung (INSTANT UI UPDATE)
            setLeads(prevLeads => {
                const newLeads = prevLeads.filter(l => l.id !== lead.id);
                console.log('UI updated:', {
                    before: prevLeads.length,
                    after: newLeads.length,
                    deleted: lead.id
                });
                return newLeads;
            });
            
            // Close delete modal
            setDeleteModalOpen(false);
            
            // Show success notification
            showNotification('success', 'Lead Deleted', `"${lead.company_name}" permanently deleted from database!`);
            
            // Optional: Refresh dari API untuk memastikan
            setTimeout(() => {
                fetchLeads().then(() => {
                    console.log('Data refreshed from API after delete');
                });
            }, 1000);
            
        } catch (err) {
            console.error('DELETE ERROR:', err);
            console.error('Error details:', err.response?.data);
            
            setDeleteModalOpen(false);
            
            // Jika error foreign key, coba soft delete
            if (err.response?.data?.message?.includes('foreign key')) {
                if (confirm(
                    'Hard delete failed due to foreign key constraint.\n\nTry soft delete (mark as deleted instead)?'
                )) {
                    try {
                        await leadsService.softDelete(lead.id);
                        await fetchLeads();
                        showNotification('warning', 'Soft Deleted', 'Lead marked as deleted (soft delete)');
                    } catch (softErr) {
                        showNotification('error', 'Delete Failed', 'Both hard and soft delete failed');
                    }
                }
            } else {
                showNotification('error', 'Delete Failed', err.response?.data?.message || err.message);
            }
        }
    };

    // Search filter
    const filteredLeads = Array.isArray(leads) 
        ? leads.filter(lead => 
            lead.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
            lead.email?.toLowerCase().includes(search.toLowerCase())
          )
        : [];

    // Company options for dropdown
    const companyOptions = Array.isArray(leads) 
        ? [...new Set(leads
            .filter(lead => lead.company_name)
            .map(lead => lead.company_name)
            .sort()
          )]
        : [];

    console.log('🔄 Render - leads:', leads.length, 'filtered:', filteredLeads.length);

    return (
        <>
            <HeaderLayout
                title="Leads Management"
                subtitle="Kelola semua leads perusahaan"
            />

            {/* ACTION BAR */}
            <div className="px-8 mt-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* SEARCH FILTER SECTION */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                    {/* Company Filter Dropdown */}
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-[250px] border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="">All Companies</option>
                            {companyOptions.map((company) => (
                                <option key={company} value={company}>
                                    {company}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search leads by name, contact, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-[300px] pl-10 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* ADD BUTTON */}
                <button
                    onClick={handleAdd}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Lead</span>
                </button>
            </div>

            {/* TABLE SECTION */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg m-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading leads...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg m-8 bg-gray-50">
                    <div className="h-16 w-16 text-gray-400 mb-4">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                        {search ? 'No leads match your search' : 'No leads found'}
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            Clear search and show all
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="px-8 mb-2 text-sm text-gray-600 flex items-center justify-between">
                        <span>
                            Showing <span className="font-semibold">{filteredLeads.length}</span> of <span className="font-semibold">{leads.length}</span> leads
                        </span>
                        <span className="text-xs text-gray-500">
                            Last updated: {new Date().toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="px-8">
                        <TableLayout
                            columns={columns}
                            data={filteredLeads}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            showAction={true}
                        />
                    </div>
                </>
            )}

            {/* LEAD MODAL (Create/Edit) */}
            <LeadModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={selectedLead}
            />

            {/* DELETE CONFIRMATION MODAL */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                lead={leadToDelete}
            />

            {/* NOTIFICATION MODAL */}
            <NotificationModal
                isOpen={notificationModalOpen}
                onClose={() => setNotificationModalOpen(false)}
                type={notificationData.type}
                title={notificationData.title}
                message={notificationData.message}
            />
        </>
    );
}