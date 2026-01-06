// resources/js/Pages/Companies/Index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import HeaderLayout from '@/Layouts/HeaderLayout';
import TableLayout from '@/Layouts/TableLayout';
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
    Users,
    CheckCircle,
    XCircle,
    ChevronRight
} from 'lucide-react';

const CompaniesIndex = () => {
    const { companies, statistics, types, filters, fromQuotation, quotationId } = usePage().props;
    const { t } = useTranslation();
    
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.client_type_id || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedCompanies, setSelectedCompanies] = useState([]);

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
            const allIds = companies.data?.map(company => company.id) || [];
            setSelectedCompanies(allIds);
        } else {
            setSelectedCompanies([]);
        }
    };

    // Handle row click to show company details
    const handleRowClick = (company) => {
        router.visit(`/companies/${company.id}`);
    };

    // Prepare columns for TableLayout
    const columns = [
        {
            key: "client_code",
            label: t('companies.table.client_code'),
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleRowClick(row);
                        }}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                    >
                        {value || '-'}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            )
        },
        {
            key: "name",
            label: t('companies.table.company_name'),
            render: (value, row) => {
                const isActive = row.is_active;
                return (
                    <div>
                        <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {value || '-'}
                        </span>
                        {!isActive && (
                            <div className="text-xs text-gray-400 mt-0.5">
                                {t('companies.inactive')}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: "client_type_name",
            label: t('companies.table.client_type'),
            render: (value) => (
                <span className="text-gray-700">
                    {value || '-'}
                </span>
            )
        },
        {
            key: "contact_person",
            label: t('companies.table.contact_person'),
        },
        {
            key: "email",
            label: t('companies.table.email'),
            render: (value) => (
                <span className="text-gray-700">
                    {value || '-'}
                </span>
            )
        },
        {
            key: "phone",
            label: t('companies.table.phone'),
            render: (value) => (
                <span className="text-gray-700">
                    {value || '-'}
                </span>
            )
        },
        {
            key: "is_active",
            label: t('companies.table.status'),
            render: (value) => {
                const isActive = Boolean(value);
                return (
                    <span className={`text-xs font-bold py-1 px-2 rounded-lg border-2 ${isActive ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-500 text-gray-700 bg-gray-50'}`}>
                        {isActive ? t('companies.active') : t('companies.inactive')}
                    </span>
                );
            }
        },
        {
            key: "client_since",
            label: t('companies.table.client_since'),
            render: (value) => (
                <div className="text-sm text-gray-600">
                    {value ? new Date(value).toLocaleDateString() : '-'}
                </div>
            ),
        },
    ];

    // Prepare data for TableLayout
    const tableData = companies.data?.map((company, index) => ({
        id: company.id,
        client_code: company.client_code || '-',
        name: company.name || '-',
        client_type_name: company.client_type?.name || t('companies.unknown'),
        contact_person: company.contact_person || '-',
        email: company.email || '-',
        phone: company.phone || '-',
        is_active: company.is_active || false,
        client_since: company.client_since || '-',
        address: company.address || '',
        created_at: company.created_at || ''
    })) || [];

    return (
        <>
            <HeaderLayout
                title={t('companies.title')}
                subtitle={t('companies.subtitle')}
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
                                        {t('companies.from_quotation_notification')}
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

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center rounded-md border border-transparent px-5 py-2.5 text-sm font-medium font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out bg-[rgb(17,94,89)] hover:bg-[rgb(13,75,71)] focus:bg-[rgb(13,75,71)] focus:outline-none focus:ring-2 focus:ring-[rgb(17,94,89)] focus:ring-offset-2 active:bg-[rgb(10,60,57)] w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm hover:shadow"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="font-semibold">{t('companies.add_new_client')}</span>
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
                    {/* Client Type Cards */}
                    {statistics.client_types?.map((typeData, index) => {
                        const colors = [
                            { border: 'border-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
                            { border: 'border-green-500', text: 'text-green-700', bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
                            { border: 'border-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
                            { border: 'border-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' }
                        ][index % 4];
                        
                        return (
                            <div 
                                key={typeData.id}
                                className={`rounded-xl p-5 shadow-sm border-l-4 ${colors.border} border border-gray-200 bg-white transition-transform hover:scale-[1.02] hover:shadow-md min-h-[120px] flex flex-col justify-between`}
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
                                        className={`text-sm font-medium ${colors.text} ${colors.bg} hover:opacity-90 px-4 py-1.5 rounded-full transition-colors duration-200 w-full text-center`}
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        {/* FILTERS SECTION */}
                        <div className="w-full">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Search Input */}
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={t('companies.search_placeholder')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                                    />
                                </div>

                                {/* Client Type Filter */}
                                <div className="w-full sm:w-auto">
                                    <div className="relative">
                                        <select
                                            value={selectedType}
                                            onChange={(e) => handleTypeFilter(e.target.value)}
                                            className="w-full sm:w-64 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
                                        >
                                            <option value="">{t('companies.all_client_types')}</option>
                                            {types.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Clear Filters Button */}
                                {(search || selectedType) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <X className="h-4 w-4" />
                                        {t('companies.clear_filters')}
                                    </button>
                                )}
                            </div>

                            {/* Active Filters Display */}
                            {(search || selectedType) && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {search && (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {t('companies.search_label', { search: search })}
                                            <button 
                                                onClick={() => setSearch("")}
                                                className="ml-1.5 text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {selectedType && (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {`${t('companies.type_label')}: ${types.find(t => t.id === selectedType)?.name || t('companies.selected')}`}
                                            <button 
                                                onClick={() => setSelectedType("")}
                                                className="ml-1.5 text-green-600 hover:text-green-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Companies Table Section */}
                <div className="py-6">
                    <div className="overflow-x-auto -mx-4 px-4">
                        <TableLayout
                            columns={columns}
                            data={tableData}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            showAction={true}
                            pagination={{
                                currentPage: companies.current_page || 1,
                                totalPages: companies.last_page || 1,
                                totalItems: companies.total || 0,
                                itemsPerPage: companies.per_page || 10,
                                onPageChange: (page) => {
                                    router.get('/companies', {
                                        page: page,
                                        search: search,
                                        client_type_id: selectedType
                                    }, {
                                        preserveState: true,
                                        replace: true
                                    });
                                }
                            }}
                            onRowClick={handleRowClick}
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
            </div>
        </>
    );
};

export default CompaniesIndex;