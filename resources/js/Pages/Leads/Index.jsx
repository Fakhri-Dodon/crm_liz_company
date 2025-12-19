import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import TableLayout from "@/Layouts/TableLayout";
import leadsService from "@/services/leadsService";
import LeadModal from "@/Components/LeadModal";
import PrimaryButton from '@/Components/PrimaryButton';
import DeleteConfirmationModal from "@/Components/DeleteConfirmationModal";
import NotificationModal from "@/Components/NotificationModal";

export default function LeadsIndex({ leads: initialLeads = [] }) {
    // State untuk leads dengan pengecekan array
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
    
    // State untuk modals
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [notificationData, setNotificationData] = useState({ 
        type: 'success', 
        title: '', 
        message: '' 
    });
    const [leadToDelete, setLeadToDelete] = useState(null);

    // Columns definition
    const columns = [
        { 
            key: "company_name", 
            label: "Company Name" 
        },
        { 
            key: "address", 
            label: "Address" 
        },
        { 
            key: "contact_person", 
            label: "Contact Person" 
        },
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
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    value === 'new' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                }`}>
                    {value || 'NEW'}
                </span>
            ),
        },
    ];

    // Fetch data saat pertama load
    useEffect(() => {
        if (leads.length === 0) {
            fetchLeads();
        }
    }, []);

    // Fetch leads dari API
    const fetchLeads = async () => {
        try {
            setLoading(true);
            const res = await leadsService.getAll();
            
            if (Array.isArray(res.data)) {
                setLeads(res.data);
            } else {
                setLeads([]);
                showNotification('error', 'Data Error', 'Invalid data format received');
            }
        } catch (err) {
            console.error("Fetch leads failed:", err);
            showNotification('error', 'Fetch Failed', 'Failed to load leads from server');
        } finally {
            setLoading(false);
        }
    };

    // Show notification function
    const showNotification = (type, title, message) => {
        setNotificationData({ type, title, message });
        setNotificationModalOpen(true);
    };

    // Add new lead
    const handleAdd = () => {
        setSelectedLead(null);
        setModalOpen(true);
    };

    // Edit lead
    const handleEdit = (row) => {
        setSelectedLead(row);
        setModalOpen(true);
    };

    // Submit lead (create/update)
    const handleSubmit = async (payload) => {
        try {
            if (selectedLead) {
                await leadsService.update(selectedLead.id, payload);
                showNotification('success', 'Success', 'Lead updated successfully!');
            } else {
                await leadsService.create(payload);
                showNotification('success', 'Success', 'Lead created successfully!');
            }
            
            setModalOpen(false);
            await fetchLeads();
            
        } catch (err) {
            showNotification('error', 'Save Failed', err.response?.data?.message || err.message);
        }
    };

    // Handle delete initiation
    const handleDelete = (row) => {
        setLeadToDelete(row);
        setDeleteModalOpen(true);
    };

    // Handle confirmed delete
    const handleConfirmDelete = async (lead) => {
        try {
            await leadsService.delete(lead.id);
            
            // Update state langsung
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            
            setDeleteModalOpen(false);
            showNotification('success', 'Deleted', `"${lead.company_name}" has been deleted.`);
            
        } catch (err) {
            setDeleteModalOpen(false);
            showNotification('error', 'Delete Failed', err.response?.data?.message || err.message);
        }
    };

    // Filter leads based on search
    const filteredLeads = Array.isArray(leads) 
        ? leads.filter(lead => 
            lead.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
            lead.email?.toLowerCase().includes(search.toLowerCase())
          )
        : [];

    // Get unique company names for dropdown
    const companyOptions = Array.isArray(leads) 
        ? [...new Set(leads
            .filter(lead => lead.company_name)
            .map(lead => lead.company_name)
            .sort()
          )]
        : [];

    return (
        <>
            <HeaderLayout
                title="Leads Management"
                subtitle="Manage all company leads"
            />

            {/* ACTION BAR */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* SEARCH AND FILTERS */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Company Filter */}
                        <div className="relative">
                            <select
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-[220px] border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="">All Companies</option>
                                {companyOptions.map((company) => (
                                    <option key={company} value={company}>
                                        {company}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-[280px] pl-10 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* ADD BUTTON */}
                    <PrimaryButton
                        onClick={handleAdd}
                        className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add New Lead</span>
                    </PrimaryButton>
                </div>
                
                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-600">
                    <span className="font-medium">{filteredLeads.length}</span> of <span className="font-medium">{leads.length}</span> leads shown
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="px-8 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading leads...</p>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="h-12 w-12 text-gray-300 mb-4">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-2">
                            {search ? 'No matching leads found' : 'No leads available'}
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                            {search ? 'Try a different search term' : 'Start by adding your first lead'}
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <TableLayout
                            columns={columns}
                            data={filteredLeads}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            showAction={true}
                        />
                    </div>
                )}
            </div>

            {/* MODALS */}
            <LeadModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={selectedLead}
            />

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                lead={leadToDelete}
            />

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