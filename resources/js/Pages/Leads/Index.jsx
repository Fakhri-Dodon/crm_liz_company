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
    const [users, setUsers] = useState([]); // State untuk users
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    const { t } = useTranslation();
    
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [search, setSearch] = useState("");
    const [assignedFilter, setAssignedFilter] = useState(""); // Filter assigned user
    
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

    // Fetch users untuk filter
    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch users dari API
    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Debug info
    useEffect(() => {
        console.log('=== ALL LEADS FROM DATABASE ===');
        console.log('Total leads:', leads.length);
        console.log('Current user:', currentUser);
        console.log('Available users:', users.length);
    }, [leads, currentUser, users]);

    // Columns definition - TAMPILKAN SEMUA DATA
    const columns = [
        { 
            key: "company_name", 
            label: t('leads.table.company_name') || 'Company Name',
            sortable: true
        },
        { 
            key: "address", 
            label: t('leads.table.address') || 'Address'
        },
        { 
            key: "contact_person", 
            label: t('leads.table.contact_person') || 'Contact Person',
            sortable: true
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
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                    {assignedUser.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {assignedUser.name}
                                    {isCurrentUser && (
                                        <span className="ml-1 text-xs font-normal text-green-600">(You)</span>
                                    )}
                                </div>
                                {assignedUser.email && (
                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
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
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-500 font-semibold text-sm">
                                    ?
                                </span>
                            </div>
                            <div className="text-sm text-gray-500">
                                User ID: {row.assigned_to.substring(0, 8)}...
                            </div>
                        </div>
                    );
                }
                
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <span className="text-gray-400 text-sm">Unassigned</span>
                    </div>
                );
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
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: `${statusColor}15`,
                            color: statusColor,
                            border: `1px solid ${statusColor}30`
                        }}
                    >
                        <div 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: statusColor }}
                        ></div>
                        {displayName}
                    </span>
                );
            },
        },
        {
            key: "created_at",
            label: t('leads.table.created_at') || 'Created',
            render: (createdAt) => (
                <div className="text-sm text-gray-600">
                    {createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }) : '-'}
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

    // Edit lead
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

    // Filter leads berdasarkan search dan assigned filter
    const filteredLeads = Array.isArray(leadsData) 
        ? leadsData.filter(lead => {
            // Filter berdasarkan search term
            const searchMatch = 
                lead.company_name?.toLowerCase().includes(search.toLowerCase()) ||
                lead.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
                lead.email?.toLowerCase().includes(search.toLowerCase()) ||
                (lead.assigned_user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (lead.assigned_user?.email || '').toLowerCase().includes(search.toLowerCase());
            
            // Filter berdasarkan assigned user
            let assignedMatch = true;
            if (assignedFilter) {
                if (assignedFilter === "unassigned") {
                    assignedMatch = !lead.assigned_to || lead.assigned_to === "";
                } else if (assignedFilter === "me") {
                    assignedMatch = currentUser && lead.assigned_to === currentUser.id;
                } else if (assignedFilter === "others") {
                    assignedMatch = currentUser && lead.assigned_to && lead.assigned_to !== currentUser.id;
                } else {
                    assignedMatch = lead.assigned_to === assignedFilter;
                }
            }
            
            return searchMatch && assignedMatch;
          })
        : [];

    // Get unique company names untuk dropdown
    const companyOptions = Array.isArray(leadsData) 
        ? [...new Set(leadsData
            .filter(lead => lead.company_name)
            .map(lead => lead.company_name)
            .sort()
          )]
        : [];

    // Reset semua filter
    const resetFilters = () => {
        setSearch("");
        setAssignedFilter("");
    };

    // Check if any filter is active
    const hasActiveFilters = search || assignedFilter;

    return (
        <>
            <HeaderLayout
                title={t('leads.title') || 'Leads Management'}
                subtitle={t('leads.sub_title') || 'Manage all company leads'}
            />

            {/* INFO BANNER */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-8 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                {t('leads.headers.all_lead_database') || 'All Leads Database'}
                            </h3>
                            <p className="text-xs text-gray-600">
                                {leadsData.length} {t('leads.headers.leads') || 'leads'} • {filteredLeads.length} {t('leads.headers.filtered') || 'filtered'}
                            </p>
                        </div>
                    </div>
                    
                    {currentUser && (
                        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    {currentUser.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {currentUser.email}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ACTION BAR */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* FILTERS SECTION */}
                    <div className="w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search leads by company, contact, or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                                />
                            </div>

                            {/* Assigned To Filter */}
                            <div className="w-full sm:w-auto">
                                <div className="relative">
                                    <select
                                        value={assignedFilter}
                                        onChange={(e) => setAssignedFilter(e.target.value)}
                                        className="w-full sm:w-64 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
                                    >
                                        <option value="">{t('leads.filters.all_assignments') || 'All Assignments'}</option>
                                        <option value="me">{t('leads.filters.assigned_to_me') || 'Assigned to Me'}</option>
                                        <option value="unassigned">{t('leads.filters.unassigned') || 'Unassigned'}</option>
                                        <option value="others">{t('leads.filters.assined_to_others') || 'Assigned to Others'}</option>
                                        <optgroup label={t('leads.filters.specific_user') || 'Specific Users'}>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} {currentUser && user.id === currentUser.id && "(You)"}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {t('leads.filters.clear_search') || 'Clear Filters'}
                                </button>
                            )}
                        </div>

                        {/* Active Filters Display */}
                        {hasActiveFilters && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {search && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Search: "{search}"
                                        <button 
                                            onClick={() => setSearch("")}
                                            className="ml-1.5 text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {assignedFilter && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {assignedFilter === "me" && "Assigned to Me"}
                                        {assignedFilter === "unassigned" && "Unassigned"}
                                        {assignedFilter === "others" && "Assigned to Others"}
                                        {!["me", "unassigned", "others"].includes(assignedFilter) && 
                                            `Assigned to: ${users.find(u => u.id === assignedFilter)?.name || 'User'}`
                                        }
                                        <button 
                                            onClick={() => setAssignedFilter("")}
                                            className="ml-1.5 text-green-600 hover:text-green-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ADD BUTTON */}
                    <div className="w-full sm:w-auto">
                        <PrimaryButton
                            onClick={handleAdd}
                            disabled={!currentUser}
                            className={`w-full sm:w-auto px-6 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                !currentUser 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white focus:ring-blue-500 border border-blue-600'
                            }`}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-semibold">{t('leads.button_add') || 'Add New Lead'}</span>
                        </PrimaryButton>
                    </div>
                </div>
                
                {/* Results Summary */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{t("leads.filters.showing_info", { 
                                    count: filteredLeads.length, 
                                    total: leadsData.length 
                                })}
                            </span>
                            {hasActiveFilters && " (filtered)"}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span>{t("leads.status_labels.new")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>{t("leads.status_labels.contacted")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span>{t("leads.status_labels.qualified")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="px-8 py-6">
                {!currentUser ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <div className="h-16 w-16 text-gray-300 mb-5">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-2 text-lg">
                            Authentication Required
                        </p>
                        <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
                            You need to be logged in to view and manage leads. Please sign in to continue.
                        </p>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <div className="h-16 w-16 text-gray-300 mb-5">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-2 text-lg">
                            {hasActiveFilters ? 'No matching leads found' : 'No leads in database'}
                        </p>
                        <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
                            {hasActiveFilters 
                                ? 'Try adjusting your search criteria or filters' 
                                : 'Get started by adding your first lead to the system'
                            }
                        </p>
                        <div className="flex gap-3">
                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            )}
                            {!hasActiveFilters && (
                                <PrimaryButton
                                    onClick={handleAdd}
                                    className="px-6 py-3 text-sm font-semibold"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Your First Lead
                                </PrimaryButton>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <TableLayout
                                columns={columns}
                                data={filteredLeads}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                showAction={true}
                            />
                        </div>
                        
                        {/* Table Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-600">
                                    {t("leads.table.showing_info", { count: filteredLeads.length })}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {t("leads.table.last_updated")}: {new Date().toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
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
                users={users} // Kirim users data ke modal
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