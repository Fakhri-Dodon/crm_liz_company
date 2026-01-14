import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import HeaderLayout from '@/Layouts/HeaderLayout';
import TableLayout from '@/Layouts/TableLayout';
import ProjectModal from '@/Components/Project/ProjectModal';
import DeleteModal from '@/Components/DeleteModal';
import { Search, Filter, Plus, Calendar, Download, RefreshCw, FileText } from 'lucide-react';

export default function Index({ 
    projects, 
    summary, 
    filters, 
    years, 
    companies, 
    quotations,
    statusOptions,
    auth_permissions
}) {
    const { props } = usePage();
    const flash = props.flash || {};
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [editingProject, setEditingProject] = useState(null);
    const [localFilters, setLocalFilters] = useState({
        search: filters?.search || '',
        status: filters?.status || 'all',
        month: filters?.month || '',
        year: filters?.year || ''
    });

    // State untuk dropdown status
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRefs = useRef({});

    const canRead = auth_permissions.can_read === 1;
    const canCreate = auth_permissions.can_create === 1;
    const canUpdate = auth_permissions.can_update === 1;
    const canDelete = auth_permissions.can_delete === 1;

    const { data, setData, get, reset } = useForm({
        search: localFilters.search,
        status: localFilters.status,
        month: localFilters.month,
        year: localFilters.year
    });

    // Status colors
    const statusColors = {
        in_progress: { 
            bg: 'bg-blue-100', 
            text: 'text-blue-800',
            border: 'border-blue-200'
        },
        completed: { 
            bg: 'bg-green-100', 
            text: 'text-green-800',
            border: 'border-green-200'
        },
        pending: { 
            bg: 'bg-yellow-100', 
            text: 'text-yellow-800',
            border: 'border-yellow-200'
        },
        cancelled: { 
            bg: 'bg-red-100', 
            text: 'text-red-800',
            border: 'border-red-200'
        }
    };

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedOutside = Object.values(dropdownRefs.current).every(ref => 
                ref && !ref.contains(event.target)
            );
            
            if (clickedOutside) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle flash messages
    useEffect(() => {
        if (flash.success || flash.error) {
            const message = flash.success || flash.error;
            const type = flash.success ? 'success' : 'error';
            
            showToast(message, type);
        }
    }, [flash]);

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4">
                    ✕
                </button>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    };

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
        setData(key, value);
    };

    const applyFilters = () => {
        get(route('projects.index'), {
            preserveState: true,
            preserveScroll: true,
            data: {
                search: data.search,
                status: data.status !== 'all' ? data.status : '',
                month: data.month,
                year: data.year
            }
        });
    };

    const resetFilters = () => {
        setLocalFilters({
            search: '',
            status: 'all',
            month: '',
            year: ''
        });
        setData({
            search: '',
            status: 'all',
            month: '',
            year: ''
        });
        get(route('projects.index'), {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleEdit = (project) => {
        console.log('Editing project ID:', project.id);
        setSelectedProjectId(project.id);
        setEditingProject(project);
        setShowEditModal(true);
    };

const handleStatusChange = async (projectId, newStatus) => {
    try {
        // Close dropdown
        setOpenDropdownId(null);
        
        // Update status via PUT method dengan reload otomatis
        await router.put(route('projects.status.update', projectId), {
            status: newStatus
        }, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Status updated successfully');
                // Tidak perlu showToast karena flash message sudah dari controller
            },
            onError: (errors) => {
                console.error('Status update error:', errors);
                showToast('Failed to update status!', 'error');
            }
        });
        
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status!', 'error');
    }
};

    const handleDelete = (project) => {
        setSelectedProjectId(project.id);
        setEditingProject(project);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (selectedProjectId) {
            router.delete(route('projects.destroy', selectedProjectId), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedProjectId(null);
                    setEditingProject(null);
                    showToast('Project deleted successfully!', 'success');
                },
                onError: () => {
                    showToast('Failed to delete project!', 'error');
                }
            });
        }
    };

    const months = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'Jan' },
        { value: '2', label: 'Feb' },
        { value: '3', label: 'Mar' },
        { value: '4', label: 'Apr' },
        { value: '5', label: 'May' },
        { value: '6', label: 'Jun' },
        { value: '7', label: 'Jul' },
        { value: '8', label: 'Aug' },
        { value: '9', label: 'Sep' },
        { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' },
        { value: '12', label: 'Dec' }
    ];

    // Status yang akan ditampilkan di summary cards
    const statusesToShow = ['in_progress', 'completed', 'pending', 'cancelled'];

    // Component untuk dropdown status sederhana
    const StatusDropdown = ({ project }) => {
        const isOpen = openDropdownId === project.id;
        
        if (!canUpdate) {
            // Jika tidak punya permission, tampilkan badge saja
            const statusLabel = statusOptions?.find(opt => opt.value === project.status)?.label || project.status;
            const colors = statusColors[project.status] || statusColors.pending;
            
            return (
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                    {statusLabel}
                </span>
            );
        }

        const currentStatus = statusOptions?.find(opt => opt.value === project.status);
        const colors = statusColors[project.status] || statusColors.pending;

        return (
            <div 
                className="relative inline-block"
                ref={el => dropdownRefs.current[project.id] = el}
            >
                {/* Status Button */}
                <button
                    type="button"
                    onClick={() => setOpenDropdownId(isOpen ? null : project.id)}
                    className={`px-3 py-1.5 rounded text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border} hover:opacity-90 transition-colors`}
                >
                    {currentStatus?.label || project.status}
                    <span className="ml-1">▼</span>
                </button>

                {/* Dropdown Menu - Style sederhana */}
                {isOpen && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-[140px]">
                        <div className="py-1">
                            {statusOptions?.map(option => {
                                const optionColors = statusColors[option.value] || statusColors.pending;
                                const isSelected = project.status === option.value;
                                
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleStatusChange(project.id, option.value)}
                                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${optionColors.bg}`}></div>
                                            {option.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <HeaderLayout>
        <div className="px-4 md:px-8 py-6">
            <Head title="Project Management" />
            
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">PROJECT</h1>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-3 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] flex items-center gap-2 transition-colors shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">Add Project</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {statusesToShow.map((status) => {
                    const colors = statusColors[status];
                    const statusLabel = statusOptions?.find(opt => opt.value === status)?.label || 
                                      status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    
                    return (
                        <div 
                            key={status}
                            className={`rounded-xl p-5 shadow-sm border ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}>
                                        {statusLabel}
                                    </p>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                        {summary[status] || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">Total Project</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Projects
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by project description, company, or note..."
                                value={localFilters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent transition-colors"
                            />
                        </div>
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-2 lg:flex lg:space-x-4 gap-4">
                        {/* Status Filter */}
                        <div className="lg:w-40">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={localFilters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                            >
                                <option value="all">All Status</option>
                                {statusOptions?.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Month Filter */}
                        <div className="lg:w-40">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Month
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={localFilters.month}
                                    onChange={(e) => handleFilterChange('month', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                                >
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Year Filter */}
                        <div className="lg:w-32">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year
                            </label>
                            <select
                                value={localFilters.year}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                            >
                                <option value="">All Years</option>
                                {(years || []).map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2.5 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] flex items-center gap-2 transition-colors justify-center text-sm font-medium"
                        >
                            <Filter className="w-4 h-4" />
                            Apply
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center text-sm font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Projects Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <TableLayout
                    columns={[
                        { 
                            key: 'project_description', 
                            label: 'Description',
                            render: (val, project) => {
                                return (
                                    <div className="min-w-[200px] max-w-[300px]">
                                        <div className="font-medium text-gray-900 truncate">
                                            {val || '-'}
                                        </div>
                                        {project.note && (
                                            <div className="text-xs text-gray-500 truncate mt-1">
                                                {project.note}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        },
                        { 
                            key: 'client', 
                            label: 'Client', 
                            render: (val, project) => {
                                return (
                                    <div className="min-w-[180px]">
                                        {/* Tampilkan company name dari leads */}
                                        {project.company?.lead?.company_name ? (
                                            <>
                                                <div className="font-medium text-gray-900">
                                                    {project.company.lead.company_name}
                                                </div>
                                                {project.company?.client_code && (
                                                    <div className="text-xs text-gray-500">
                                                        Code: {project.company.client_code}
                                                    </div>
                                                )}
                                            </>
                                        ) : project.company?.client_code ? (
                                            <>
                                                <div className="font-medium text-gray-900">
                                                    {project.company.client_code}
                                                </div>
                                                <div className="text-xs text-gray-400 italic">
                                                    No company name
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-gray-400 italic">N/A</div>
                                        )}
                                        
                                        {/* Tampilkan kota jika ada */}
                                        {project.company?.city && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                📍 {project.company.city}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        },
                        { 
                            key: 'start_date', 
                            label: 'Start Date', 
                            render: (val) => val ? new Date(val).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                            }) : '-' 
                        },
                        { 
                            key: 'deadline', 
                            label: 'Deadline', 
                            render: (val) => val ? new Date(val).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                            }) : '-' 
                        },
                        { 
                            key: 'status', 
                            label: 'Status', 
                            render: (val, project) => (
                                <StatusDropdown project={project} />
                            ),
                            className: "min-w-[140px]"
                        },
                        { 
                            key: 'quotation', 
                            label: 'Quotation', 
                            render: (val, project) => (
                                <div className="min-w-[120px]">
                                    {project.quotation?.quotation_number ? (
                                        <span className="text-sm text-gray-700">
                                            {project.quotation.quotation_number}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">No quotation</span>
                                    )}
                                </div>
                            )
                        },
                    ]}
                    data={projects.data || []}
                    onEdit={canUpdate ? handleEdit : null}
                    onDelete={canDelete ? handleDelete : null}
                    showAction={canUpdate || canDelete}
                    pagination={{
                        currentPage: projects.current_page,
                        totalPages: projects.last_page,
                        totalItems: projects.total,
                        itemsPerPage: projects.per_page,
                        onPageChange: (page) => get(route('projects.index', { ...data, page }), { preserveScroll: true })
                    }}
                />
            </div>

            {/* Modals */}
            <ProjectModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                companies={companies || []}
                quotations={quotations || []}
                statusOptions={statusOptions || []}
                title="Add Project"
            />

            {selectedProjectId && (
                <>
                    {/* Edit Modal */}
                    <ProjectModal
                        show={showEditModal}
                        onClose={() => {
                            setShowEditModal(false);
                            setSelectedProjectId(null);
                            setEditingProject(null);
                        }}
                        projectId={selectedProjectId}
                        companies={companies || []}
                        quotations={quotations || []}
                        statusOptions={statusOptions || []}
                        isEdit={true}
                        title="Edit Project"
                    />

                    <DeleteModal
                        show={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setSelectedProjectId(null);
                            setEditingProject(null);
                        }}
                        onConfirm={confirmDelete}
                        title="Delete Project"
                        message={`Are you sure you want to delete project "${editingProject?.project_description}"? This action cannot be undone.`}
                    />
                </>
            )}
        </div>
        </HeaderLayout>
    );
}