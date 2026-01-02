import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import TableLayout from "@/Layouts/TableLayout";
import leadsService from "@/services/leadsService";
import LeadModal from "@/Components/LeadModal";
import PrimaryButton from '@/Components/PrimaryButton';
import DeleteConfirmationModal from "@/Components/DeleteConfirmationModal";
import NotificationModal from "@/Components/NotificationModal";
import { useTranslation } from "react-i18next";

export default function LeadsIndex({ leads = [], auth }) {
    // Gunakan SEMUA leads dari props
    const [leadsData, setLeadsData] = useState(leads);
    const { t } = useTranslation();
    
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

    // Get current user
    const currentUser = auth?.user || null;
    const isAdmin = currentUser?.is_admin || false;

    // Debug info
    useEffect(() => {
        console.log('=== ALL LEADS FROM DATABASE ===');
        console.log('Total leads:', leads.length);
        console.log('Current user:', currentUser);
        
        if (leads.length > 0) {
            console.log('First 3 leads:', leads.slice(0, 3));
        }
    }, [leads, currentUser]);

    // Columns definition - TAMPILKAN SEMUA DATA
    const columns = [
        { 
            key: "company_name", 
            label: t('leads.table.company_name') || 'Company Name'
        },
        { 
            key: "address", 
            label: t('leads.table.address') || 'Address'
        },
        { 
            key: "contact_person", 
            label: t('leads.table.contact_person') || 'Contact Person'
        },
        {
            key: "email",
            label: t('leads.table.email_phone') || 'Email & Phone',
            render: (_, row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.email || '-'}</div>
                    <div className="text-gray-500 text-sm mt-1">{row.phone || '-'}</div>
                </div>
            ),
        },
        {
            key: "assigned_user",
            label: t('leads.table.assigned_to') || 'Assigned To',
            render: (assignedUser, row) => {
                if (assignedUser && assignedUser.name) {
                    const isCurrentUser = currentUser && assignedUser.id === currentUser.id;
                    
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                                {assignedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {assignedUser.name}
                                    {isCurrentUser && (
                                        <span className="ml-1 text-xs font-normal text-green-600">(You)</span>
                                    )}
                                </div>
                                {assignedUser.email && (
                                    <div className="text-xs text-gray-500 truncate">
                                        {assignedUser.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }
                
                // Jika ada assigned_to tapi tidak ada user data
                if (row.assigned_to && !assignedUser) {
                    return (
                        <div className="text-sm text-gray-600">
                            <span className="text-gray-400">User ID:</span> {row.assigned_to.substring(0, 8)}...
                        </div>
                    );
                }
                
                return <span className="text-gray-400 text-sm">Unassigned</span>;
            },
        },
        {
            key: "status_name",
            label: t('leads.table.status') || 'Status',
            render: (statusName, row) => {
                const statusColor = row.status_color || '#3b82f6';
                const displayName = statusName || 'New';
                
                return (
                    <span 
                        className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor
                        }}
                    >
                        {displayName}
                    </span>
                );
            },
        },
        {
            key: "created_at",
            label: t('leads.table.created_at') || 'Created At',
            render: (createdAt) => (
                <div className="text-sm text-gray-600">
                    {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
                </div>
            ),
        },
    ];

    // Show notification function
    const showNotification = (type, title, message) => {
        setNotificationData({ type, title, message });
        setNotificationModalOpen(true);
    };

    // Add new lead
    const handleAdd = () => {
        if (!currentUser) {
            showNotification('error', 'Authentication Required', 'Please login to create a lead');
            return;
        }
        setSelectedLead(null);
        setModalOpen(true);
    };

    // Edit lead - SEMUA USER BISA EDIT SEMUA LEADS
    const handleEdit = (row) => {
        if (!currentUser) {
            showNotification('error', 'Authentication Required', 'Please login to edit leads');
            return;
        }
        
        setSelectedLead(row);
        setModalOpen(true);
    };

    // Submit lead (create/update)
    const handleSubmit = async (payload) => {
        console.log('Submitting lead:', payload);
        
        try {
            // Auto-assign to current user for NEW leads
            if (!selectedLead && currentUser) {
                payload.assigned_to = currentUser.id;
            }
            
            if (selectedLead) {
                await leadsService.update(selectedLead.id, payload);
                showNotification('success', 'Success', 'Lead updated successfully!');
            } else {
                await leadsService.create(payload);
                showNotification('success', 'Success', 'Lead created successfully!');
            }
            
            setModalOpen(false);
            
            // RELOAD PAGE untuk mengambil data terbaru dari database
            window.location.reload();
            
        } catch (err) {
            console.error('Submit error:', err);
            showNotification('error', 'Save Failed', err.response?.data?.message || err.message);
        }
    };

    // Handle delete initiation
    const handleDelete = (row) => {
        if (!currentUser) {
            showNotification('error', 'Authentication Required', 'Please login to delete leads');
            return;
        }
        
        setLeadToDelete(row);
        setDeleteModalOpen(true);
    };

    // Handle confirmed delete
    const handleConfirmDelete = async (lead) => {
        try {
            await leadsService.delete(lead.id);
            
            // Hapus dari state lokal
            setLeadsData(prev => prev.filter(l => l.id !== lead.id));
            setDeleteModalOpen(false);
            showNotification('success', 'Deleted', `"${lead.company_name}" has been deleted.`);
            
            // Tunggu sebentar lalu reload page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (err) {
            setDeleteModalOpen(false);
            showNotification('error', 'Delete Failed', err.response?.data?.message || err.message);
        }
    };

    // Filter leads based on search - FILTER UNTUK SEARCH SAJA
    const filteredLeads = Array.isArray(leadsData) 
        ? leadsData.filter(lead =>
            lead.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
            lead.email?.toLowerCase().includes(search.toLowerCase()) ||
            (lead.assigned_user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (lead.assigned_user?.email || '').toLowerCase().includes(search.toLowerCase())
          )
        : [];

    // Get unique company names for dropdown
    const companyOptions = Array.isArray(leadsData) 
        ? [...new Set(leadsData
            .filter(lead => lead.company_name)
            .map(lead => lead.company_name)
            .sort()
          )]
        : [];

    return (
        <>
            <HeaderLayout
                title={t('leads.title') || 'Leads Management'}
                subtitle={t('leads.sub_title') || 'Manage all company leads'}
            />

            {/* INFO BANNER */}
            <div className="bg-blue-50 border-b border-blue-200 px-8 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-900">
                                All Leads Database
                            </div>
                            <div className="text-xs text-gray-600">
                                Showing {leadsData.length} leads from system
                            </div>
                        </div>
                    </div>
                    
                    {currentUser && (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-semibold text-xs">
                                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="font-medium">{currentUser.name}</span>
                                <span className="text-gray-500 ml-2">{currentUser.email}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ACTION BAR */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* SEARCH AND FILTERS */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Company Filter */}
                        {companyOptions.length > 0 && (
                            <div className="relative">
                                <select
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:w-[220px] border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="">All Companies ({companyOptions.length})</option>
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
                        )}

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
                        disabled={!currentUser}
                        className={`w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            !currentUser 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                        }`}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add New Lead</span>
                    </PrimaryButton>
                </div>
                
                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-600 flex items-center gap-4">
                    <div>
                        <span className="font-medium">Total:</span> {leadsData.length} leads
                    </div>
                    <div>
                        <span className="font-medium">Filtered:</span> {filteredLeads.length} leads
                    </div>
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Clear filter
                        </button>
                    )}
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="px-8 py-6">
                {!currentUser ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="h-12 w-12 text-gray-300 mb-4">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-2">
                            Please login to view leads
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                            You need to be authenticated to access this page
                        </p>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="h-12 w-12 text-gray-300 mb-4">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-2">
                            {search ? 'No matching leads found' : 'No leads in database'}
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                            {search 
                                ? 'Try a different search term' 
                                : 'Start by adding your first lead'
                            }
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Clear search
                            </button>
                        )}
                        {!search && (
                            <PrimaryButton
                                onClick={handleAdd}
                                className="mt-2 px-5 py-2.5 text-sm font-medium"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Your First Lead
                            </PrimaryButton>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <TableLayout
                                columns={columns}
                                data={filteredLeads}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                showAction={true}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <LeadModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={selectedLead}
                currentUser={currentUser}
                isAdmin={isAdmin}
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