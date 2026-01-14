// resources/js/Pages/Companies/Index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    ChevronRight,
    ChevronDown,
    Check,
    Loader2
} from 'lucide-react';

const CompaniesIndex = () => {
    // Ambil semua props termasuk clientTypes
    const { companies, statistics, types, filters, fromQuotation, quotationId, clientTypes } = usePage().props;
    const { t } = useTranslation();

    console.log('DEBUG: Props Received:', { 
        companiesCount: companies?.data?.length,
        clientTypesCount: clientTypes?.length || types?.length,
        typesCount: types?.length,
        companySample: companies?.data?.[0] 
    });
    
    // State management
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.client_type_id || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const statusDropdownRef = useRef(null);

    // Auto-open modal jika datang dari quotation
    useEffect(() => {
        if (fromQuotation && quotationId) {
            setIsCreateModalOpen(true);
        }
    }, [fromQuotation, quotationId]);

    // Close dropdown ketika klik di luar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setStatusDropdownOpen(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Clear semua filter
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

    // FUNGSI UNTUK HANDLE EDIT - DIPERBAIKI
    const handleEditClick = (company) => {
        console.log('=== EDIT CLICKED ===');
        console.log('Original company data:', company);
        console.log('Lead data:', company.lead);
        console.log('Primary contact:', company.primary_contact);
        
        // **PERBAIKAN UTAMA: Siapkan data untuk modal edit**
        const companyData = {
            // ID dan identifikasi
            id: company.id,
            client_code: company.client_code || '',
            
            // **PERBAIKAN: Ambil company_name dari lead atau fallback ke client_code**
            company_name: company.company_name || 
                         company.lead?.company_name || 
                         company.client_code || 
                         company.name || 
                         '',
            
            // Data contact person
            contact_person: company.contact_person || 
                          company.primary_contact?.name || 
                          company.lead?.contact_person || 
                          '',
            contact_email: company.email || 
                         company.primary_contact?.email || 
                         company.lead?.email || 
                         '',
            contact_phone: company.phone || 
                         company.primary_contact?.phone || 
                         company.lead?.phone || 
                         '',
            contact_position: company.contact_position || 
                            company.primary_contact?.position || 
                            company.lead?.position || 
                            '',
            
            // Company fields untuk form
            client_type_id: company.client_type_id || '',
            city: company.city || '',
            province: company.province || '',
            country: company.country || '',
            postal_code: company.postal_code?.toString() || '',
            vat_number: company.vat_number?.toString() || '',
            nib: company.nib || '',
            website: company.website || '',
            logo_url: company.logo_url || '',
            is_active: company.is_active || false,
            
            // Data asli untuk referensi
            primary_contact: company.primary_contact,
            lead: company.lead,
            name: company.name
        };
        
        console.log('Prepared company data for edit:', companyData);
        console.log('Company Name source:', {
            fromCompanyProp: company.company_name,
            fromLead: company.lead?.company_name,
            fromClientCode: company.client_code,
            finalValue: companyData.company_name
        });
        
        setSelectedCompany(companyData);
        setIsEditModalOpen(true);
    };

    // Fungsi untuk handle delete
    const handleDeleteClick = (company) => {
        console.log('Delete clicked for:', company.id);
        setSelectedCompany(company);
        setIsDeleteModalOpen(true);
    };

    // Fungsi untuk handle update success
    const handleUpdateSuccess = (updatedCompany) => {
        console.log('Update successful:', updatedCompany);
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

    // Status update handler
    const handleStatusUpdate = async (companyId, newStatus) => {
        setUpdatingStatus(companyId);
        
        try {
            router.patch(`/companies/${companyId}/status`, {
                is_active: newStatus
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    const event = new CustomEvent('show-toast', {
                        detail: {
                            type: 'success',
                            message: t('companies.status_updated_successfully')
                        }
                    });
                    window.dispatchEvent(event);
                },
                onError: (errors) => {
                    const event = new CustomEvent('show-toast', {
                        detail: {
                            type: 'error',
                            message: t('companies.status_update_failed')
                        }
                    });
                    window.dispatchEvent(event);
                },
                onFinish: () => {
                    setUpdatingStatus(null);
                    setStatusDropdownOpen(null);
                }
            });
            
        } catch (error) {
            alert(t('companies.status_update_failed'));
            setUpdatingStatus(null);
            setStatusDropdownOpen(null);
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

    // Prepare columns untuk TableLayout - DIPERBAIKI
    const columns = [
        {
            key: "client_name",
            label: t('companies.table.client_name'),
            render: (value, row) => {
                const displayName = row.company_name || row.lead?.company_name || row.name || '-';
                return (
                    <div className="flex flex-col">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(row);
                            }}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                        >
                            {displayName}
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <span className="text-xs text-gray-500 mt-1">{row.client_code}</span>
                    </div>
                );
            }
        },
        {
            key: "address",
            label: t('companies.table.address'),
            render: (value, row) => {
                const isActive = row.is_active;
                const addressParts = [row.city, row.province, row.country].filter(Boolean);
                const displayAddress = addressParts.length > 0 
                    ? addressParts.join(', ') 
                    : (row.address || '-');
                return (
                    <div>
                        <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{displayAddress}</span>
                        {!isActive && (
                            <div className="text-xs text-gray-400 mt-0.5">{t('companies.inactive')}</div>
                        )}
                    </div>
                );
            }
        },
        {
            key: "contact_person",
            label: t('companies.table.contact_person'),
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{value || '-'}</span>
                    <span className="text-xs text-gray-500 font-normal">{row.contact_position || '-'}</span>
                </div>
            )
        },
        {
            key: "contact_info",
            label: t('companies.table.contact'),
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{record.email || '-'}</span>
                    <span className="text-xs text-gray-500 font-normal">{record.phone || '-'}</span>
                </div>
            )
        },
        {
            key: "client_type_name",
            label: t('companies.table.status'),
            render: (value) => (
                <span className="font-semibold text-green-700 bg-green-50 rounded px-2 py-1 text-xs">{value || '-'}</span>
            )
        },
        {
            key: "client_since",
            label: t('companies.table.client_since'),
            render: (value) => (
                <div className="text-sm text-gray-600">{value ? new Date(value).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</div>
            ),
        },
    ];

    // Prepare data untuk TableLayout - DIPERBAIKI
    const tableData = companies.data?.map((company, index) => {
        // **PERBAIKAN: Ambil company_name dari lead atau client_code**
        const companyName = company.company_name || 
                          company.lead?.company_name || 
                          company.client_code || 
                          company.name || 
                          '-';
        
        return {
            id: company.id,
            // **PERBAIKAN: Untuk display di tabel**
            client_name: companyName,
            
            // **PERBAIKAN: Simpan untuk modal edit**
            company_name: companyName,
            
            // Address components
            address: company.address || '-',
            city: company.city || '',
            province: company.province || '',
            country: company.country || '',
            
            // Contact info
            contact_person: company.contact_person || '-',
            email: company.email || '-',
            phone: company.phone || '-',
            contact_position: company.contact_position || '',
            
            // Company info
            client_code: company.client_code || '',
            client_type_name: company.client_type_name || t('companies.unknown'),
            client_type_id: company.client_type_id || '',
            
            // Status dan dates
            is_active: company.is_active || false,
            client_since: company.client_since || '-',
            created_at: company.created_at || '',
            
            // Business details
            postal_code: company.postal_code || '',
            vat_number: company.vat_number || '',
            nib: company.nib || '',
            website: company.website || '',
            logo_url: company.logo_url || '',
            
            // Relations
            primary_contact: company.primary_contact,
            lead: company.lead,
            
            // Original data untuk fallback
            name: company.name
        };
    }) || [];

    // Handle row click untuk melihat detail company
    const handleRowClick = (company) => {
        router.visit(`/companies/${company.id}`);
    };

    // Toggle status dropdown
    const toggleStatusDropdown = (companyId, event) => {
        event.stopPropagation();
        setStatusDropdownOpen(statusDropdownOpen === companyId ? null : companyId);
    };

    return (
        <>
            <HeaderLayout
                title={t('companies.title')}
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
                
                {/* Edit Modal dengan data yang benar */}
                {isEditModalOpen && selectedCompany && (
                    <EditModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedCompany(null);
                        }}
                        company={selectedCompany}
                        clientTypes={clientTypes || types}
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
                    {statistics.client_types?.map((typeData, index) => {
                        const cardColors = [
                            'border-blue-200 bg-blue-100',
                            'border-green-200 bg-green-100',
                            'border-orange-200 bg-orange-100',
                            'border-purple-200 bg-purple-100'
                        ];
                        const colorClass = cardColors[index % cardColors.length];
                        return (
                            <div 
                                key={typeData.id}
                                className={`rounded-xl p-5 shadow-sm border ${colorClass} transition-transform hover:scale-[1.02] hover:shadow-md min-h-[120px] flex flex-col justify-between`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                            {typeData.name}
                                        </p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                            {typeData.count}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-white">
                                        <Building className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
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

                {/* Info Summary */}
                {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                            <strong>Total:</strong> {companies.total || 0} clients | 
                            <strong> Active:</strong> {statistics.active || 0} | 
                            <strong> Inactive:</strong> {statistics.inactive || 0}
                        </p>
                    </div>
                </div> */}
            </div>
        </>
    );
};

export default CompaniesIndex;