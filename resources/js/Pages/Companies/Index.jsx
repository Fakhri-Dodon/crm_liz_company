// resources/js/Pages/Companies/Index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import HeaderLayout from '@/Layouts/HeaderLayout';
import CompaniesTable from '@/Components/Companies/CompaniesTable';
import Create from '@/Components/Companies/Create';
import EditModal from '@/Components/Companies/EditModal';
import DeleteModal from '@/Components/Companies/DeleteModal';
import { 
    FileText,
    Building,
    Search,
    Filter,
    X,
    Plus,
    Edit,
    Trash2,
    Users,
    CheckCircle,
    XCircle
} from 'lucide-react';

const CompaniesIndex = () => {
    const { companies, statistics, types, filters, fromQuotation, quotationId } = usePage().props;
    const { t } = useTranslation();
    
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.client_type_id || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedCompanies, setSelectedCompanies] = useState([]);

    // Predefined color palette untuk semua card
    const typeColors = [
        {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            accentBorder: 'border-blue-500',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-100',
            buttonText: 'text-blue-700',
            buttonHover: 'hover:bg-blue-200'
        },
        {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            accentBorder: 'border-green-500',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            buttonBg: 'bg-green-100',
            buttonText: 'text-green-700',
            buttonHover: 'hover:bg-green-200'
        },
        {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-800',
            accentBorder: 'border-orange-500',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            buttonBg: 'bg-orange-100',
            buttonText: 'text-orange-700',
            buttonHover: 'hover:bg-orange-200'
        },
        {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-800',
            accentBorder: 'border-purple-500',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            buttonBg: 'bg-purple-100',
            buttonText: 'text-purple-700',
            buttonHover: 'hover:bg-purple-200'
        }
    ];

    // Get color berdasarkan index (bisa dirotasi)
    const getColorByIndex = (index) => {
        return typeColors[index % typeColors.length];
    };

    // Check screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-open modal if coming from quotation
    useEffect(() => {
        if (fromQuotation && quotationId) {
            setIsCreateModalOpen(true);
        }
    }, [fromQuotation, quotationId]);

    // Handle search dengan debounce
    const handleSearch = useCallback((value) => {
        router.get('/companies', { 
            search: value,
            client_type_id: selectedType,
        }, {
            preserveState: true,
            replace: true,
            only: ['companies', 'filters', 'statistics']
        });
    }, [selectedType]);

    // Handle type filter
    const handleTypeFilter = useCallback((typeId) => {
        const newType = typeId === selectedType ? '' : typeId;
        setSelectedType(newType);
        router.get('/companies', { 
            search,
            client_type_id: newType,
        }, {
            preserveState: true,
            replace: true,
            only: ['companies', 'filters', 'statistics']
        });
        setShowMobileFilters(false);
    }, [search, selectedType]);

    // Clear all filters
    const clearFilters = () => {
        setSearch('');
        setSelectedType('');
        router.get('/companies', {}, {
            preserveState: true,
            replace: true,
            only: ['companies', 'filters', 'statistics']
        });
        setShowMobileFilters(false);
    };

    // Handle successful client creation
    const handleClientCreated = () => {
        setIsCreateModalOpen(false);
        router.reload({ 
            only: ['companies', 'statistics'],
            preserveScroll: true 
        });
    };

    // Fungsi untuk handle edit
    const handleEditClick = (company) => {
        setSelectedCompany(company);
        setIsEditModalOpen(true);
    };

    // Fungsi untuk handle delete
    const handleDeleteClick = (company) => {
        setSelectedCompany(company);
        setIsDeleteModalOpen(true);
    };

    // Fungsi untuk handle update success
    const handleUpdateSuccess = (updatedCompany) => {
        setIsEditModalOpen(false);
        setSelectedCompany(null);
        router.reload({ 
            only: ['companies', 'statistics'],
            preserveScroll: true 
        });
    };

    // Fungsi untuk handle delete success
    const handleDeleteSuccess = async (deleteType) => {
        if (!selectedCompany) return;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            let url = `/companies/${selectedCompany.id}`;
            if (deleteType === 'permanent') {
                url = `/companies/force-delete/${selectedCompany.id}`;
            }

            const response = await fetch(url, {
                method: deleteType === 'permanent' ? 'DELETE' : 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t('companies.delete_failed'));
            }

            alert(data.message || t('companies.client_deleted_successfully'));
            setIsDeleteModalOpen(false);
            setSelectedCompany(null);
            
            router.reload({ 
                only: ['companies', 'statistics'],
                preserveScroll: true 
            });
        } catch (error) {
            console.error('Delete error:', error);
            alert(t('companies.delete_failed_try_again'));
        }
    };

    // Handle search input with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) {
                handleSearch(search);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Function to handle bulk actions
    const handleBulkAction = (action) => {
        if (selectedCompanies.length === 0) {
            alert(t('companies.please_select_companies_first'));
            return;
        }
        
        alert(t('companies.bulk_action_coming_soon', { 
            action: action, 
            count: selectedCompanies.length 
        }));
    };

    // Handle company selection for bulk actions
    const handleCompanySelect = (companyId, isSelected) => {
        if (isSelected) {
            setSelectedCompanies(prev => [...prev, companyId]);
        } else {
            setSelectedCompanies(prev => prev.filter(id => id !== companyId));
        }
    };

    // Handle select all companies
    const handleSelectAll = (isSelected) => {
        if (isSelected) {
            const allIds = companies.data.map(company => company.id);
            setSelectedCompanies(allIds);
        } else {
            setSelectedCompanies([]);
        }
    };

    // Format companies data untuk CompaniesTable component
    const formatCompaniesForTable = () => {
        if (!companies.data) return { data: [] };
        
        return {
            ...companies,
            data: companies.data.map(company => ({
                ...company,
                client_type_name: company.client_type?.name || t('companies.unknown'),
                name: company.name || '',
                client_code: company.client_code || '',
                contact_person: company.contact_person || '',
                email: company.email || '',
                phone: company.phone || '',
                address: company.address || '',
                is_active: company.is_active || false,
                client_since: company.client_since || '',
                updated_at: company.updated_at || '',
                created_at: company.created_at || ''
            }))
        };
    };

    const formattedCompanies = formatCompaniesForTable();

    return (
        <>
            <HeaderLayout
                title={t('companies.title')}
                subtitle={t('companies.manage_your_client_portfolio')}
            />

            <div className="px-8 py-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-widest text-gray-800">
                            {t('companies.title')}
                        </h1>
                    </div>

                    {/* Quotation Notification Banner */}
                    {fromQuotation && quotationId && (
                        <div className="w-full sm:w-auto bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2 sm:mb-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">
                                        {t('companies.creating_client_from_accepted_quotation')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => router.get('/companies')}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    {t('companies.skip')}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="w-full sm:w-auto">
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Plus className="w-4 h-4" />
                            {t('companies.add_new_client')}
                        </button>
                    </div>
                </div>

                {/* Modals */}
                {isCreateModalOpen && (
                    <Create 
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        clientTypes={types}
                        quotationId={quotationId}
                        onSuccess={handleClientCreated}
                    />
                )}
                
                {isEditModalOpen && selectedCompany && (
                    <EditModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedCompany(null);
                        }}
                        company={selectedCompany}
                        clientTypes={types}
                        onUpdate={handleUpdateSuccess}
                    />
                )}

                {isDeleteModalOpen && (
                    <DeleteModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => {
                            setIsDeleteModalOpen(false);
                            setSelectedCompany(null);
                        }}
                        company={selectedCompany}
                        onDelete={handleDeleteSuccess}
                    />
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 my-7">
                    {/* Total Clients Card */}
                    <div className="rounded-xl p-5 shadow-sm border border-gray-200 bg-white transition-transform hover:scale-[1.02] hover:shadow-md min-h-[120px] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                    {t('companies.total_clients')}
                                </p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                    {statistics.total || 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    {statistics.active || 0} {t('companies.active')}
                                </span>
                                <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                                    <XCircle className="w-4 h-4" />
                                    {statistics.inactive || 0} {t('companies.inactive')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Client Type Cards - Menggunakan typeColors yang telah didefinisikan */}
                    {statistics.client_types?.map((typeData, index) => {
                        const colors = getColorByIndex(index);
                        
                        return (
                            <div 
                                key={typeData.id}
                                className={`rounded-xl p-5 shadow-sm border-l-4 ${colors.accentBorder} ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md min-h-[120px] flex flex-col justify-between`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}>
                                            {typeData.name}
                                        </p>
                                        <p className={`text-2xl md:text-3xl font-bold ${colors.text} mt-2`}>
                                            {typeData.count}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${colors.iconBg}`}>
                                        <Building className={`w-6 h-6 ${colors.iconColor}`} />
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <button 
                                        onClick={() => handleTypeFilter(typeData.id)}
                                        className={`text-sm font-medium ${colors.buttonText} ${colors.buttonBg} ${colors.buttonHover} px-4 py-1.5 rounded-full transition-colors duration-200 w-full text-center`}
                                    >
                                        {selectedType === typeData.id 
                                            ? t('companies.filter_applied') 
                                            : t('companies.view_clients')
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                        {/* Search Input */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('companies.search_clients_placeholder')}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder={t('companies.search_clients_placeholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                            </div>
                        </div>

                        {/* Filter Grid */}
                        <div className="grid grid-cols-2 lg:flex lg:space-x-4 gap-4">
                            {/* Client Type Filter */}
                            <div className="lg:w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('companies.client_type')}
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => handleTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                >
                                    <option value="">{t('companies.all_client_types')}</option>
                                    {types.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Bulk Actions (Desktop) */}
                            {selectedCompanies.length > 0 && (
                                <div className="lg:w-48">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('companies.bulk_actions_with_count', { count: selectedCompanies.length })}
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            onChange={(e) => handleBulkAction(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                        >
                                            <option value="">{t('companies.select_action')}</option>
                                            <option value="activate">{t('companies.mark_as_active')}</option>
                                            <option value="deactivate">{t('companies.mark_as_inactive')}</option>
                                            <option value="delete">{t('companies.delete_selected')}</option>
                                        </select>
                                        <button
                                            onClick={() => setSelectedCompanies([])}
                                            className="px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300"
                                        >
                                            {t('companies.clear')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => {}}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors justify-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Filter className="w-4 h-4" />
                                {t('companies.apply_filters')}
                            </button>
                            {(search || selectedType) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center text-sm font-medium"
                                >
                                    <X className="w-4 h-4" />
                                    {t('companies.clear_filters')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Companies Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {t('companies.client_list')}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {companies.total} {t('companies.total_clients_lower')} • {statistics.active} {t('companies.active_lower')} • {statistics.inactive} {t('companies.inactive_lower')}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-600">
                                    {t('companies.showing_results', { 
                                        from: companies.from || 0, 
                                        to: companies.to || 0, 
                                        total: companies.total || 0 
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CompaniesTable Component */}
                    <div className="overflow-x-auto -mx-6 px-6">
                        <CompaniesTable 
                            companies={formattedCompanies}
                            filters={filters}
                            onSearch={handleSearch}
                            onFilterChange={(filters) => {
                                router.get('/companies', filters, {
                                    preserveState: true,
                                    replace: true,
                                    only: ['companies', 'filters', 'statistics']
                                });
                            }}
                            showActions={true}
                            onEditClick={handleEditClick}
                            onDeleteClick={handleDeleteClick}
                            bulkSelect={true}
                            selectedIds={selectedCompanies}
                            onBulkSelect={handleCompanySelect}
                        />
                    </div>
                </div>

                {/* Quick Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t('companies.quick_summary')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl font-bold text-gray-900">{statistics.total || 0}</div>
                            <div className="text-sm text-gray-600">{t('companies.total_clients')}</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl font-bold text-green-600">{statistics.active || 0}</div>
                            <div className="text-sm text-gray-600">{t('companies.active')}</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl font-bold text-red-600">{statistics.inactive || 0}</div>
                            <div className="text-sm text-gray-600">{t('companies.inactive')}</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl font-bold text-blue-600">{companies.data?.length || 0}</div>
                            <div className="text-sm text-gray-600">{t('companies.currently_displayed')}</div>
                        </div>
                    </div>
                    
                    {/* Client Distribution */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-base font-medium text-gray-900 mb-3">
                            {t('companies.client_distribution')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {statistics.client_types?.map((type, index) => {
                                const colors = getColorByIndex(index);
                                const percentage = statistics.total > 0 
                                    ? Math.round((type.count / statistics.total) * 100) 
                                    : 0;
                                
                                return (
                                    <div key={type.id} className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className={`text-xl font-bold ${colors.text}`}>
                                            {type.count}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">{type.name}</div>
                                        <div className="mt-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${colors.bg.replace('bg-', 'bg-')}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {t('companies.need_help')}
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                        {t('companies.tips_for_managing_clients')}
                    </p>
                    <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
                        <li>{t('companies.tip_use_search_bar')}</li>
                        <li>{t('companies.tip_filter_by_type')}</li>
                        <li>{t('companies.tip_click_client_details')}</li>
                        <li>{t('companies.tip_add_new_client')}</li>
                        <li>{t('companies.tip_select_multiple_clients')}</li>
                    </ul>
                </div>

                {/* Mobile bottom action bar */}
                {isMobile && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40 md:hidden">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-600">
                                <div className="font-medium">{companies.total || 0} {t('companies.clients_lower')}</div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>{statistics.active || 0} {t('companies.active_lower')}</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span>{statistics.inactive || 0} {t('companies.inactive_lower')}</span>
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="w-5 h-5" />
                                {t('companies.add_client')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CompaniesIndex;