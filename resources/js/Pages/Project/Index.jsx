// resources/js/Pages/Projects/Index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import HeaderLayout from '@/Layouts/HeaderLayout';
import TableLayout from '@/Layouts/TableLayout';
import ProjectModal from '@/Components/Project/ProjectModal';
import DeleteModal from '@/Components/DeleteModal';
import { Search, Filter, Plus, Calendar, RefreshCw, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash || {};
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [editingProject, setEditingProject] = useState(null);
    
    const canRead = auth_permissions.can_read === 1;
    const canCreate = auth_permissions.can_create === 1;
    const canUpdate = auth_permissions.can_update === 1;
    const canDelete = auth_permissions.can_delete === 1;

    // Gunakan useForm untuk filter dengan initial values dari props
    const { data: filterData, setData: setFilterData, get, processing, reset: resetFilterForm } = useForm({
        search: filters?.search || '',
        status: filters?.status || 'all',
        month: filters?.month || '',
        year: filters?.year || ''
    });

    // Helper function untuk mendapatkan class card berdasarkan status
    const getStatusCardClass = (status) => {
        switch(status) {
            case 'in_progress':
                return {
                    card: "rounded-xl p-5 shadow-sm border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 transition-all hover:scale-[1.02] hover:shadow-md hover:border-blue-300",
                    text: "text-blue-800",
                    count: "text-blue-900",
                    subtext: "text-blue-700",
                    icon: "⚡", // Emoji untuk in progress
                    iconBg: "bg-blue-100"
                };
            case 'completed':
                return {
                    card: "rounded-xl p-5 shadow-sm border border-green-200 bg-gradient-to-r from-green-50 to-green-100 transition-all hover:scale-[1.02] hover:shadow-md hover:border-green-300",
                    text: "text-green-800",
                    count: "text-green-900",
                    subtext: "text-green-700",
                    icon: "✅", // Emoji untuk completed
                    iconBg: "bg-green-100"
                };
            case 'pending':
                return {
                    card: "rounded-xl p-5 shadow-sm border border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100 transition-all hover:scale-[1.02] hover:shadow-md hover:border-yellow-300",
                    text: "text-yellow-800",
                    count: "text-yellow-900",
                    subtext: "text-yellow-700",
                    icon: "⏳", // Emoji untuk pending
                    iconBg: "bg-yellow-100"
                };
            case 'cancelled':
                return {
                    card: "rounded-xl p-5 shadow-sm border border-red-200 bg-gradient-to-r from-red-50 to-red-100 transition-all hover:scale-[1.02] hover:shadow-md hover:border-red-300",
                    text: "text-red-800",
                    count: "text-red-900",
                    subtext: "text-red-700",
                    icon: "❌", // Emoji untuk cancelled
                    iconBg: "bg-red-100"
                };
            default:
                return {
                    card: "rounded-xl p-5 shadow-sm border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 transition-all hover:scale-[1.02] hover:shadow-md hover:border-gray-300",
                    text: "text-gray-800",
                    count: "text-gray-900",
                    subtext: "text-gray-700",
                    icon: "📊", // Emoji default
                    iconBg: "bg-gray-100"
                };
        }
    };

    // Status colors untuk dropdown
    const statusColors = {
        in_progress: { 
            bg: 'bg-blue-50', 
            text: 'text-blue-700',
            border: 'border-blue-500'
        },
        completed: { 
            bg: 'bg-green-50', 
            text: 'text-green-700',
            border: 'border-green-500'
        },
        pending: { 
            bg: 'bg-yellow-50', 
            text: 'text-yellow-700',
            border: 'border-yellow-500'
        },
        cancelled: { 
            bg: 'bg-red-50', 
            text: 'text-red-700',
            border: 'border-red-500'
        }
    };

    // Debug log untuk melihat perubahan props
    useEffect(() => {
        console.log('Projects data updated:', {
            total: projects?.total,
            current_page: projects?.current_page,
            data_length: projects?.data?.length,
            filters_from_props: filters
        });
    }, [projects, filters]);

    // Update filter form ketika filters dari props berubah
    useEffect(() => {
        console.log('Filters props changed:', filters);
        if (filters) {
            setFilterData({
                search: filters.search || '',
                status: filters.status || 'all',
                month: filters.month || '',
                year: filters.year || ''
            });
        }
    }, [filters]);

    // Handle flash messages
    useEffect(() => {
        if (flash.success || flash.error) {
            const message = flash.success || flash.error;
            const type = flash.success ? 'success' : 'error';
            
            showToast(message, type);
        }
    }, [flash]);

    const showToast = (message, type = 'success') => {
        const existingToasts = document.querySelectorAll('[data-toast]');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.setAttribute('data-toast', 'true');
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
        console.log(`Filter changed: ${key} = ${value}`);
        setFilterData(key, value);
    };

    const applyFilters = useCallback(() => {
        console.log('Current filter data:', filterData);
        
        // Prepare filter parameters sesuai dengan format yang diharapkan backend
        const params = new URLSearchParams();
        
        // Tambahkan parameter hanya jika memiliki nilai
        if (filterData.search && filterData.search.trim() !== '') {
            params.append('search', filterData.search);
        }
        
        if (filterData.status && filterData.status !== 'all') {
            params.append('status', filterData.status);
        }
        
        if (filterData.month && filterData.month !== '') {
            params.append('month', filterData.month);
        }
        
        if (filterData.year && filterData.year !== '') {
            params.append('year', filterData.year);
        }
        
        // Reset ke page 1 saat apply filter baru
        params.append('page', '1');
        
        console.log('Applying filters with params:', Object.fromEntries(params));
        
        // Menggunakan router.get dengan query parameters
        router.get(route('projects.index') + '?' + params.toString(), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('Filters applied successfully - Response data:', {
                    total: projects?.total,
                    data_length: projects?.data?.length
                });
                showToast(t('projects_index.filter_applied'), 'success');
            },
            onError: (errors) => {
                console.error('Filter error:', errors);
                showToast(t('projects_index.filter_failed'), 'error');
            }
        });
    }, [filterData, router, projects, t]);

    const resetFilters = useCallback(() => {
        console.log('Resetting filters...');
        
        const resetValues = {
            search: '',
            status: 'all',
            month: '',
            year: ''
        };
        
        resetFilterForm(resetValues);
        
        // Setelah reset form, langsung apply filter kosong
        const params = new URLSearchParams();
        params.append('page', '1');
        
        router.get(route('projects.index') + '?' + params.toString(), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('Filters reset successfully');
                showToast(t('projects_index.filters_reset'), 'success');
            },
            onError: (errors) => {
                console.error('Reset filter error:', errors);
                showToast(t('projects_index.reset_failed'), 'error');
            }
        });
    }, [resetFilterForm, router, t]);

    const handleEdit = (project) => {
        setSelectedProjectId(project.id);
        setEditingProject(project);
        setShowEditModal(true);
    };

    const handleStatusChange = async (projectId, newStatus) => {
        try {
            await router.put(route('projects.status.update', projectId), {
                status: newStatus
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    showToast(t('projects_index.status_updated'), 'success');
                    // Refresh data setelah update status
                    applyFilters();
                },
                onError: (errors) => {
                    console.error('Status update error:', errors);
                    showToast(t('projects_index.status_update_failed'), 'error');
                }
            });
            
        } catch (error) {
            console.error('Error updating status:', error);
            showToast(t('projects_index.status_update_failed'), 'error');
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
                    showToast(t('projects_index.project_deleted'), 'success');
                    // Refresh data setelah delete
                    applyFilters();
                },
                onError: () => {
                    showToast(t('projects_index.delete_failed'), 'error');
                }
            });
        }
    };

    // Handler untuk auto close modal create - dengan reset form
    const handleCreateSuccess = useCallback(() => {
        console.log('Create modal success callback called - CLOSING MODAL AND RESETTING');
        // Tutup modal create LANGSUNG
        setShowCreateModal(false);
        
        // Tampilkan toast success
        showToast(t('projects_index.project_created'), 'success');
        
        // Refresh data tanpa delay
        applyFilters();
    }, [applyFilters, t]);

    // Handler untuk auto close modal edit - dengan reset form
    const handleEditSuccess = useCallback(() => {
        console.log('Edit modal success callback called - CLOSING MODAL AND RESETTING');
        // Tutup modal edit LANGSUNG
        setShowEditModal(false);
        setSelectedProjectId(null);
        setEditingProject(null);
        
        // Tampilkan toast success
        showToast(t('projects_index.project_updated'), 'success');
        
        // Refresh data tanpa delay
        applyFilters();
    }, [applyFilters, t]);

    const months = [
        { value: '', label: t('projects_index.all_months') },
        { value: '1', label: t('projects_index.jan') },
        { value: '2', label: t('projects_index.feb') },
        { value: '3', label: t('projects_index.mar') },
        { value: '4', label: t('projects_index.apr') },
        { value: '5', label: t('projects_index.may') },
        { value: '6', label: t('projects_index.jun') },
        { value: '7', label: t('projects_index.jul') },
        { value: '8', label: t('projects_index.aug') },
        { value: '9', label: t('projects_index.sep') },
        { value: '10', label: t('projects_index.oct') },
        { value: '11', label: t('projects_index.nov') },
        { value: '12', label: t('projects_index.dec') }
    ];

    // Status yang akan ditampilkan di summary cards
    const statusesToShow = ['in_progress', 'completed', 'pending', 'cancelled'];

    // Component untuk status dropdown menggunakan select element
    const StatusDropdown = ({ project }) => {
        const colors = statusColors[project.status] || statusColors.pending;
        const statusLabel = statusOptions?.find(opt => opt.value === project.status)?.label || project.status;
        
        // Jika tidak punya permission untuk update, tampilkan badge saja
        if (!canUpdate) {
            return (
                <span className={`px-2 py-1 rounded text-xs font-bold ${colors.bg} ${colors.text} border-2 ${colors.border} truncate max-w-[120px] inline-block`}>
                    {statusLabel.toUpperCase()}
                </span>
            );
        }

        return (
            <div className="relative min-w-[100px]">
                <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project.id, e.target.value)}
                    className={`appearance-none text-xs font-bold py-1 px-2 rounded-lg border-2 focus:ring-0 cursor-pointer transition-all truncate w-full ${colors.border} ${colors.text} ${colors.bg}`}
                    style={{ 
                        backgroundImage: 'none', 
                        appearance: 'none',
                        MozAppearance: 'none',
                        WebkitAppearance: 'none',
                        paddingRight: '1.5rem'
                    }}
                >
                    {statusOptions?.map(option => {
                        const optionColors = statusColors[option.value] || statusColors.pending;
                        return (
                            <option 
                                key={option.value} 
                                value={option.value}
                                className={`${optionColors.text} ${optionColors.bg}`}
                            >
                                {option.label.toUpperCase()}
                            </option>
                        );
                    })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                    <ChevronDown className="w-3 h-3" />
                </div>
            </div>
        );
    };

    // Handler untuk pagination dengan filter
    const handlePageChange = useCallback((page) => {
        console.log('Changing to page:', page);
        
        const params = new URLSearchParams();
        
        if (filterData.search && filterData.search.trim() !== '') {
            params.append('search', filterData.search);
        }
        
        if (filterData.status && filterData.status !== 'all') {
            params.append('status', filterData.status);
        }
        
        if (filterData.month && filterData.month !== '') {
            params.append('month', filterData.month);
        }
        
        if (filterData.year && filterData.year !== '') {
            params.append('year', filterData.year);
        }
        
        params.append('page', page);
        
        router.get(route('projects.index') + '?' + params.toString(), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                console.log('Page changed successfully');
            }
        });
    }, [filterData, router]);

    return (
        <HeaderLayout>
            <div className="px-2 sm:px-4 md:px-8 py-4 sm:py-6">
                <Head title={t('projects_index.page_title')} />
                
                {/* Header Section */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                {t('projects_index.header_title')}
                            </h1>
                        </div>
                        {canCreate && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] flex items-center gap-1 sm:gap-2 transition-colors shadow-sm hover:shadow-md w-full sm:w-auto justify-center text-sm sm:text-base"
                                disabled={processing}
                            >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="font-medium">{t('projects_index.add_project')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Cards - Responsive dengan styling baru */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                    {statusesToShow.map((status) => {
                        const statusClass = getStatusCardClass(status);
                        const statusLabel = statusOptions?.find(opt => opt.value === status)?.label || 
                                          status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        
                        return (
                            <div 
                                key={status}
                                className={statusClass.card}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs sm:text-sm font-medium ${statusClass.text} uppercase tracking-wide`}>
                                            {statusLabel}
                                        </p>
                                        <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${statusClass.count} mt-1 sm:mt-2`}>
                                            {summary[status] || 0}
                                        </p>
                                        <p className={`text-xs ${statusClass.subtext} mt-1 sm:mt-2`}>
                                            {t('projects_index.total_project')}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${statusClass.iconBg}`}>
                                        <span className="text-lg">
                                            {statusClass.icon}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filter Section - Responsive */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-6 sm:mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3 sm:gap-4">
                        {/* Search Input */}
                        <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                {t('projects_index.search_projects')}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder={t('projects_index.search_placeholder')}
                                    value={filterData.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent transition-colors text-sm"
                                    disabled={processing}
                                />
                            </div>
                        </div>

                        {/* Filter Grid */}
                        <div className="grid grid-cols-2 sm:flex sm:space-x-3 gap-3">
                            {/* Status Filter */}
                            <div className="sm:w-32 lg:w-40">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    {t('projects_index.status')}
                                </label>
                                <select
                                    value={filterData.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-xs sm:text-sm"
                                    disabled={processing}
                                >
                                    <option value="all">{t('projects_index.all_status')}</option>
                                    {statusOptions?.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Month Filter */}
                            <div className="sm:w-32 lg:w-40">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    {t('projects_index.month')}
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                                    <select
                                        value={filterData.month}
                                        onChange={(e) => handleFilterChange('month', e.target.value)}
                                        className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-xs sm:text-sm"
                                        disabled={processing}
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
                            <div className="sm:w-28 lg:w-32">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    {t('projects_index.year')}
                                </label>
                                <select
                                    value={filterData.year}
                                    onChange={(e) => handleFilterChange('year', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-xs sm:text-sm"
                                    disabled={processing}
                                >
                                    <option value="">{t('projects_index.all_years')}</option>
                                    {(years || []).map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 sm:pt-2">
                            <button
                                onClick={applyFilters}
                                disabled={processing}
                                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] flex items-center gap-1 sm:gap-2 transition-colors justify-center text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                            >
                                {processing ? (
                                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                    <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                                <span>{processing ? t('projects_index.applying') : t('projects_index.apply')}</span>
                            </button>
                            <button
                                onClick={resetFilters}
                                disabled={processing}
                                className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-2 justify-center text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                            >
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{t('projects_index.reset')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Projects Table Section */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <TableLayout
                            columns={[
                                { 
                                    key: 'project_description', 
                                    label: t('projects_index.description'),
                                    className: "min-w-[140px] sm:min-w-[200px]",
                                    render: (val, project) => {
                                        return (
                                            <div className="min-w-[140px] sm:min-w-[200px] max-w-[250px]">
                                                <div className="font-medium text-gray-900 truncate text-sm">
                                                    {val || '-'}
                                                </div>
                                                {/* {project.note && (
                                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                                        {project.note}
                                                    </div>
                                                )} */}
                                            </div>
                                        );
                                    }
                                },
                                { 
                                    key: 'client', 
                                    label: t('projects_index.client'),
                                    className: "min-w-[140px] sm:min-w-[160px]",
                                    render: (val, project) => {
                                        return (
                                            <div className="min-w-[140px] sm:min-w-[160px] max-w-[200px]">
                                                {project.company?.lead?.company_name ? (
                                                    <>
                                                        <div className="font-medium text-gray-900 text-sm truncate">
                                                            {project.company.lead.company_name}
                                                        </div>
                                                        {project.company?.client_code && (
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {t('projects_index.code')}: {project.company.client_code}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : project.company?.client_code ? (
                                                    <>
                                                        <div className="font-medium text-gray-900 text-sm truncate">
                                                            {project.company.client_code}
                                                        </div>
                                                        <div className="text-xs text-gray-400 italic truncate">
                                                            {t('projects_index.no_company_name')}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-gray-400 italic text-sm">{t('projects_index.not_available')}</div>
                                                )}
                                            </div>
                                        );
                                    }
                                },
                                { 
                                    key: 'start_date', 
                                    label: t('projects_index.start_date'),
                                    className: "min-w-[110px] sm:min-w-[120px]",
                                    render: (val) => val ? new Date(val).toLocaleDateString('id-ID', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                    }) : '-' 
                                },
                                { 
                                    key: 'deadline', 
                                    label: t('projects_index.deadline'),
                                    className: "min-w-[110px] sm:min-w-[120px]",
                                    render: (val) => val ? new Date(val).toLocaleDateString('id-ID', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                    }) : '-' 
                                },                                
                                { 
                                    key: 'quotation', 
                                    label: t('projects_index.quotation'),
                                    className: "min-w-[90px] sm:min-w-[100px]",
                                    render: (val, project) => (
                                        <div className="min-w-[90px] sm:min-w-[100px] max-w-[120px]">
                                            {project.quotation?.quotation_number ? (
                                                <span className="text-xs sm:text-sm text-gray-700 truncate block">
                                                    {project.quotation.quotation_number}
                                                </span>
                                            ) : (
                                                <span className="text-xs sm:text-sm text-gray-400 truncate block">
                                                    {t('projects_index.no_quotation')}
                                                </span>
                                            )}
                                        </div>
                                    )
                                },
                                { 
                                    key: 'status', 
                                    label: t('projects_index.status'),
                                    className: "min-w-[100px] sm:min-w-[120px]",
                                    render: (val, project) => (
                                        <StatusDropdown project={project} />
                                    )
                                },
                                { 
                                    key: 'note', 
                                    // label: t('projects_index.status'),
                                    label: "Note",
                                    className: "min-w-[100px] sm:min-w-[120px]",
                                    render: (val, project) => (
                                        <div className="font-medium text-gray-900 truncate text-s">
                                            {project.note}
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
                                onPageChange: handlePageChange
                            }}
                            emptyStateMessage={t('projects_index.no_data')}
                        />
                    </div>
                </div>

                {/* Create Modal */}
                <ProjectModal
                    show={showCreateModal}
                    onClose={() => {
                        console.log('Closing create modal');
                        setShowCreateModal(false);
                    }}
                    companies={companies || []}
                    quotations={quotations || []}
                    statusOptions={statusOptions || []}
                    title={t('projects_index.add_project')}
                    onSuccess={handleCreateSuccess}
                    key={showCreateModal ? 'create-modal' : 'create-modal-closed'}
                />

                {selectedProjectId && (
                    <>
                        {/* Edit Modal */}
                        <ProjectModal
                            show={showEditModal}
                            onClose={() => {
                                console.log('Closing edit modal');
                                setShowEditModal(false);
                                setSelectedProjectId(null);
                                setEditingProject(null);
                            }}
                            projectId={selectedProjectId}
                            companies={companies || []}
                            quotations={quotations || []}
                            statusOptions={statusOptions || []}
                            isEdit={true}
                            title={t('projects_index.edit_project')}
                            onSuccess={handleEditSuccess}
                            key={`edit-modal-${selectedProjectId}-${showEditModal}`}
                        />

                        {/* Delete Modal */}
                        <DeleteModal
                            show={showDeleteModal}
                            onClose={() => {
                                setShowDeleteModal(false);
                                setSelectedProjectId(null);
                                setEditingProject(null);
                            }}
                            onConfirm={confirmDelete}
                            title={t('projects_index.delete_confirm_title')}
                            message={t('projects_index.delete_confirm_message', { 
                                projectName: editingProject?.project_description 
                            })}
                        />
                    </>
                )}
            </div>
        </HeaderLayout>
    );
}