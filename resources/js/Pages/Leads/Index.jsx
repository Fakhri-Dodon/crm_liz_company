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

export default function LeadsIndex({ leads = [], auth, auth_permissions }) {
    // Gunakan SEMUA leads dari props
    const [leadsData, setLeadsData] = useState(leads);
    const [users, setUsers] = useState([]); // State untuk users
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    const { t } = useTranslation();

    const canRead = auth_permissions.can_read === 1;
    const canCreate = auth_permissions.can_create === 1;
    const canUpdate = auth_permissions.can_update === 1;
    const canDelete = auth_permissions.can_delete === 1;
    
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

    // State untuk status dropdown
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null); // null = tidak ada yang terbuka, id lead = terbuka untuk lead tersebut
    const [leadStatuses, setLeadStatuses] = useState([]); // State untuk menyimpan data dari tabel lead_statuses
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 }); // Posisi dropdown

    // Get current user
    const currentUser = auth?.user || null;
    const isAdmin = currentUser?.is_admin || false;

    // Fetch users dan lead_statuses dari API
    useEffect(() => {
        fetchUsers();
        fetchLeadStatuses();
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

    // Fetch lead_statuses dari API
    const fetchLeadStatuses = async () => {
        try {
            const response = await fetch('/api/lead-statuses'); // Endpoint untuk mengambil data lead_statuses
            if (response.ok) {
                const data = await response.json();
                setLeadStatuses(data);
            } else {
                console.error('Failed to fetch lead statuses:', response.status);
                // Jika endpoint tidak tersedia, coba fetch dari endpoint lain atau gunakan data dari props jika ada
                fetchLeadStatusesAlternative();
            }
        } catch (err) {
            console.error('Error fetching lead statuses:', err);
            // Fallback: coba endpoint alternatif
            fetchLeadStatusesAlternative();
        }
    };

    // Alternative method untuk fetch lead_statuses
    const fetchLeadStatusesAlternative = async () => {
        try {
            // Coba endpoint lain jika /api/lead-statuses tidak tersedia
            const response = await fetch('/api/lead-status'); // Alternative endpoint
            if (response.ok) {
                const data = await response.json();
                setLeadStatuses(data);
            } else {
                // Jika masih gagal, coba ambil dari endpoint leads yang mungkin menyertakan statuses
                const leadsResponse = await fetch('/api/leads');
                if (leadsResponse.ok) {
                    const leadsData = await leadsResponse.json();
                    // Extract unique statuses from leads data
                    const uniqueStatuses = [];
                    const seenStatuses = new Set();
                    
                    leadsData.forEach(lead => {
                        if (lead.status_id && lead.status_name && lead.status_color && !seenStatuses.has(lead.status_id)) {
                            seenStatuses.add(lead.status_id);
                            uniqueStatuses.push({
                                id: lead.status_id,
                                name: lead.status_name,
                                color: lead.status_color
                            });
                        }
                    });
                    
                    if (uniqueStatuses.length > 0) {
                        setLeadStatuses(uniqueStatuses);
                    } else {
                        // Jika tidak ada data status sama sekali, tampilkan pesan error
                        console.error('No lead statuses available');
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching lead statuses from alternative source:', err);
        }
    };

    // Debug info
    useEffect(() => {
        console.log('=== LEAD STATUSES FROM DATABASE ===');
        console.log('Total statuses:', leadStatuses.length);
        console.log('Statuses data:', leadStatuses);
    }, [leadStatuses]);

    // Handle status change
    const handleStatusChange = async (leadId, newStatusId) => {
        try {
            setLoading(true);
            
            // Find the status object
            const statusObj = leadStatuses.find(s => s.id === newStatusId);
            
            if (!statusObj) {
                throw new Error('Status not found');
            }
            
            console.log('Selected status object:', statusObj);
            console.log('Lead ID to update:', leadId);
            
            // Siapkan payload sesuai dengan field di database (lead_statuses_id)
            const payload = {
                lead_statuses_id: newStatusId, // Gunakan field yang sesuai dengan database
                status: statusObj.name,
                status_name: statusObj.name,
                status_color: statusObj.color || '#3b82f6',
                _method: 'PUT' // Untuk Laravel method spoofing
            };
            
            console.log('Updating status with payload:', payload);
            
            try {
                // Gunakan fetch langsung
                const response = await fetch(`/api/leads/${leadId}`, {
                    method: 'POST', // Untuk Laravel method spoofing
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                console.log('Update response:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || data.error || `Update failed with status ${response.status}`);
                }
                
                // Update local state - SESUAIKAN DENGAN FIELD DATABASE
                setLeadsData(prev => prev.map(lead => {
                    if (lead.id === leadId) {
                        return {
                            ...lead,
                            lead_statuses_id: newStatusId, // Perhatikan field name
                            status_id: newStatusId, // Untuk kompatibilitas
                            status_name: statusObj.name,
                            status_color: statusObj.color || '#3b82f6',
                            status: statusObj.name
                        };
                    }
                    return lead;
                }));
                
                // Close dropdown
                setStatusDropdownOpen(null);
                
                // Show notification
                showNotification('success', 'Status Updated', `Lead status changed to ${statusObj.name}`);
                
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw fetchError;
            }
            
        } catch (err) {
            console.error('Status update error:', err);
            console.error('Full error:', err);
            
            // Tampilkan error yang lebih spesifik
            let errorMessage = 'Failed to update status';
            if (err.response?.data) {
                errorMessage = err.response.data.message || 
                            err.response.data.error || 
                            JSON.stringify(err.response.data.errors || err.response.data);
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            showNotification('error', 'Update Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Toggle status dropdown dengan mendapatkan posisi
    const toggleStatusDropdown = (e, leadId) => {
        if (!currentUser) {
            showNotification('error', 'Authentication Required', 'Please login to update lead status');
            return;
        }
        
        // Cek apakah ada data status
        if (leadStatuses.length === 0) {
            showNotification('error', 'No Status Available', 'Cannot update status: No status data available');
            return;
        }
        
        // Dapatkan posisi tombol
        const buttonRect = e.currentTarget.getBoundingClientRect();
        
        // Hitung posisi untuk dropdown
        const x = buttonRect.left;
        const y = buttonRect.bottom + window.scrollY;
        
        setDropdownPosition({ x, y });
        
        // Toggle dropdown
        setStatusDropdownOpen(statusDropdownOpen === leadId ? null : leadId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownOpen && !event.target.closest('.status-dropdown-container')) {
                setStatusDropdownOpen(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [statusDropdownOpen]);

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
            render: (_, row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.contact_person || '-'}</div>
                    <div className="text-gray-500 text-sm mt-1">{row.position || '-'}</div>
                </div>
            ),
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
                // Cari status berdasarkan status_id atau status_name dari data lead_statuses
                const currentStatus = leadStatuses.find(status => 
                    status.id === row.status_id || status.name === (row.status_name || row.status)
                );
                
                const statusColor = currentStatus?.color || row.status_color || '#3b82f6';
                const displayName = currentStatus?.name || row.status_name || row.status || 'New';
                const isDropdownOpen = statusDropdownOpen === row.id;
                
                return (
                    <div className="relative status-dropdown-container">
                        <button
                            type="button"
                            onClick={(e) => toggleStatusDropdown(e, row.id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:shadow-sm ${
                                isDropdownOpen ? 'ring-2 ring-blue-300 ring-offset-1' : ''
                            }`}
                            style={{
                                backgroundColor: `${statusColor}15`,
                                color: statusColor,
                                border: `1px solid ${statusColor}30`,
                                cursor: currentUser ? 'pointer' : 'default'
                            }}
                            disabled={!currentUser || leadStatuses.length === 0}
                        >
                            {displayName}
                            {currentUser && leadStatuses.length > 0 && (
                                <svg 
                                    className={`ml-1.5 h-3.5 w-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </button>
                    </div>
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

    // Render dropdown secara terpisah di luar table
    const renderStatusDropdown = () => {
        if (!statusDropdownOpen || !currentUser || leadStatuses.length === 0) return null;
        
        // Temukan lead yang sedang dipilih
        const currentLead = leadsData.find(lead => lead.id === statusDropdownOpen);
        if (!currentLead) return null;
        
        // Cari status saat ini
        const currentStatus = leadStatuses.find(status => 
            status.id === currentLead.status_id || status.name === (currentLead.status_name || currentLead.status)
        );
        
        const displayName = currentStatus?.name || currentLead.status_name || currentLead.status || 'New';
        
        return (
            <div 
                className="fixed z-[9999] min-w-[200px] bg-white shadow-lg border border-gray-200 rounded-lg py-1"
                style={{
                    left: `${dropdownPosition.x}px`,
                    top: `${dropdownPosition.y + 5}px`, // Tambah sedikit jarak dari tombol
                }}
            >
                {leadStatuses.map((status) => {
                    const isCurrentStatus = currentStatus?.id === status.id || 
                                           displayName === status.name;
                    return (
                        <button
                            key={status.id}
                            type="button"
                            onClick={() => handleStatusChange(statusDropdownOpen, status.id)}
                            className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between ${
                                isCurrentStatus ? 'bg-blue-50' : ''
                            }`}
                        >
                            <div className="flex items-center">
                                <div 
                                    className="w-2.5 h-2.5 rounded-full mr-3"
                                    style={{ backgroundColor: status.color || '#3b82f6' }}
                                ></div>
                                <span className="text-sm font-medium text-gray-900">
                                    {status.name}
                                </span>
                            </div>
                            {isCurrentStatus && (
                                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    );
                })}
                {loading && (
                    <div className="px-3 py-2 border-t border-gray-100">
                        <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-xs text-gray-500">Updating...</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

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

            {/* TITLE SECTION - DIMODIFIKASI: Button sejajar dengan title, subtitle dihilangkan */}
            <div className="px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('leads.title')}
                        </h2>
                    </div>
                    <div className="sm:w-auto">
                        {canCreate && (
                            <PrimaryButton
                                onClick={handleAdd}
                                disabled={!currentUser}
                                className="inline-flex items-center rounded-md border border-transparent px-5 py-2.5 text-sm font-medium font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out bg-[rgb(17,94,89)] hover:bg-[rgb(13,75,71)] focus:bg-[rgb(13,75,71)] focus:outline-none focus:ring-2 focus:ring-[rgb(17,94,89)] focus:ring-offset-2 active:bg-[rgb(10,60,57)] w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm hover:shadow"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="font-semibold">{t('leads.button_add') || 'Add New Lead'}</span>
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </div>

            {/* ACTION BAR */}
            <div className="bg-white border-b border-gray-200 px-8">
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
                                    placeholder={t('leads.filters.search_placeholder')}
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

                    {/* ADD BUTTON DIHAPUS DARI SINI karena sudah dipindah ke atas */}
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
                                onEdit={canUpdate ? handleEdit : null}
                                onDelete={canDelete ? handleDelete : null}
                                showAction={canUpdate || canDelete}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* RENDER STATUS DROPDOWN DI LUAR TABLE */}
            {renderStatusDropdown()}

            {/* MODALS */}
            <LeadModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={selectedLead}
                currentUser={currentUser}
                isAdmin={isAdmin}
                users={users} // Kirim users data ke modal
                statuses={leadStatuses} // Kirim statuses ke modal
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