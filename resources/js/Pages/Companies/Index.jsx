// resources/js/Pages/Companies/Index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
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
    Calendar,
    Phone,
    Mail,
    User
} from 'lucide-react';

const CompaniesIndex = () => {
    const { companies, statistics, types, filters, fromQuotation, quotationId } = usePage().props;
    
    // Debug props yang diterima
    console.log('Props received:', { 
        companies: companies?.data?.length, 
        statistics, 
        types: types?.length,
        filters,
        fromQuotation,
        quotationId 
    });
    
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.client_type_id || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedCompanies, setSelectedCompanies] = useState([]);

    // Check screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-open modal if coming from quotation
    useEffect(() => {
        console.log('Auto-open modal check:', { fromQuotation, quotationId });
        if (fromQuotation && quotationId) {
            console.log('Opening modal for quotation:', quotationId);
            setIsCreateModalOpen(true);
        }
    }, [fromQuotation, quotationId]);

    // Handle search dengan debounce
    const handleSearch = useCallback((value) => {
        console.log('Searching for:', value);
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
        console.log('Filter by type:', newType);
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
        console.log('Clearing filters');
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
        console.log('Client created successfully');
        setIsCreateModalOpen(false);
        // Refresh the page data without full reload
        router.reload({ 
            only: ['companies', 'statistics'],
            preserveScroll: true 
        });
    };

    // Fungsi untuk handle edit
    const handleEditClick = (company) => {
        console.log('Edit clicked for company:', company.id);
        setSelectedCompany(company);
        setIsEditModalOpen(true);
    };

    // Fungsi untuk handle delete
    const handleDeleteClick = (company) => {
        console.log('Delete clicked for company:', company.id);
        setSelectedCompany(company);
        setIsDeleteModalOpen(true);
    };

    // Fungsi untuk handle update success
    const handleUpdateSuccess = (updatedCompany) => {
        console.log('Update success for company:', updatedCompany.id);
        setIsEditModalOpen(false);
        setSelectedCompany(null);
        // Refresh data
        router.reload({ 
            only: ['companies', 'statistics'],
            preserveScroll: true 
        });
    };

    // Fungsi untuk handle delete success
    const handleDeleteSuccess = async (deleteType) => {
        console.log('Delete success, type:', deleteType);
        if (!selectedCompany) return;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            let url = `/companies/${selectedCompany.id}`;
            if (deleteType === 'permanent') {
                url = `/companies/force-delete/${selectedCompany.id}`;
            }

            console.log('Deleting company:', selectedCompany.id, 'URL:', url);

            const response = await fetch(url, {
                method: deleteType === 'permanent' ? 'DELETE' : 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            console.log('Delete response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete');
            }

            alert(data.message || 'Client deleted successfully!');
            setIsDeleteModalOpen(false);
            setSelectedCompany(null);
            
            // Refresh data
            router.reload({ 
                only: ['companies', 'statistics'],
                preserveScroll: true 
            });
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    };

    // Handle search input with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) {
                console.log('Debounced search:', search);
                handleSearch(search);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Define color mapping for different client types
    const getTypeColor = (typeName) => {
        const colorMap = {
            'PMDN': {
                color: 'text-blue-600',
                border: 'border-blue-600',
                bg: 'bg-blue-50',
                badgeBorder: 'border-blue-200',
                badgeText: 'text-blue-700'
            },
            'PMA': {
                color: 'text-green-600',
                border: 'border-green-600',
                bg: 'bg-green-50',
                badgeBorder: 'border-green-200',
                badgeText: 'text-green-700'
            },
            'KPPA': {
                color: 'text-orange-600',
                border: 'border-orange-600',
                bg: 'bg-orange-50',
                badgeBorder: 'border-orange-200',
                badgeText: 'text-orange-700'
            },
            'BUMN': {
                color: 'text-red-600',
                border: 'border-red-600',
                bg: 'bg-red-50',
                badgeBorder: 'border-red-200',
                badgeText: 'text-red-700'
            }
        };

        const defaultColors = {
            color: 'text-gray-600',
            border: 'border-gray-600',
            bg: 'bg-gray-50',
            badgeBorder: 'border-gray-200',
            badgeText: 'text-gray-700'
        };

        return colorMap[typeName] || defaultColors;
    };

    return (
        <HeaderLayout>
        <div className="px-8 py-6">
            <Head title="CLIENT MANAGEMENT" />

            <div className="space-y-4 md:space-y-6 px-3 md:px-0 pb-16 md:pb-0">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 md:pt-0">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CLIENT MANAGEMENT</h1>
                        <p className="text-sm md:text-base text-gray-600 mt-1">Manage your client portfolio</p>
                    </div>
                    
                    {/* Quotation Notification Banner */}
                    {fromQuotation && quotationId && (
                        <div className="w-full sm:w-auto bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 sm:mb-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">
                                        Creating client from quotation #{quotationId}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        console.log('Skipping quotation creation');
                                        router.get('/companies');
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => {
                            console.log('Opening create modal manually');
                            setIsCreateModalOpen(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-medium transition-colors shadow-md"
                    >
                        <FileText className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-sm md:text-base">Add New Client</span>
                    </button>
                </div>

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <Create 
                        isOpen={isCreateModalOpen}
                        onClose={() => {
                            console.log('Closing create modal');
                            setIsCreateModalOpen(false);
                        }}
                        clientTypes={types}
                        quotationId={quotationId}
                        onSuccess={handleClientCreated}
                    />
                )}
                
                {isEditModalOpen && selectedCompany && (
                    <EditModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            console.log('Closing edit modal');
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
                            console.log('Closing delete modal');
                            setIsDeleteModalOpen(false);
                            setSelectedCompany(null);
                        }}
                        company={selectedCompany}
                        onDelete={handleDeleteSuccess}
                    />
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {statistics.client_types?.map((typeData) => {
                        const colors = getTypeColor(typeData.name);
                        
                        return (
                            <div 
                                key={typeData.id}
                                className={`bg-white rounded-lg border-l-4 ${colors.border} p-3 md:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`text-base md:text-lg font-semibold ${colors.color}`}>
                                            {typeData.name}
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-1">
                                            {typeData.label || `${typeData.name} Companies`}
                                        </p>
                                    </div>
                                    <span className={`text-xl md:text-2xl font-bold ${colors.color}`}>
                                        {typeData.count}
                                    </span>
                                </div>
                                <div className="mt-3 md:mt-4">
                                    <button 
                                        onClick={() => {
                                            console.log('Filter by type:', typeData.id);
                                            handleTypeFilter(typeData.id);
                                        }}
                                        className={`text-xs md:text-sm ${
                                            selectedType === typeData.id 
                                                ? `${colors.bg} ${colors.color} font-medium` 
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        } px-2 md:px-3 py-1 rounded-full transition w-full text-center`}
                                    >
                                        {selectedType === typeData.id ? '✓ Filtered' : 'View All'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-3 md:p-4">
                    <div className="flex flex-col gap-3 md:gap-4">
                        {/* Search Bar */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                            <input
                                type="text"
                                placeholder="Search clients by name, email, or phone..."
                                value={search}
                                onChange={(e) => {
                                    console.log('Search input:', e.target.value);
                                    setSearch(e.target.value);
                                }}
                                className="w-full pl-10 pr-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm md:text-base"
                            />
                        </div>

                        {/* Desktop Filters */}
                        <div className="hidden md:flex items-center gap-3">
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    console.log('Type filter changed:', e.target.value);
                                    handleTypeFilter(e.target.value);
                                }}
                                className="px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm md:text-base flex-1"
                            >
                                <option value="">All Client Types</option>
                                {types.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            
                            {(search || selectedType) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 md:px-4 py-2 md:py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-300 text-sm md:text-base flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => {
                                console.log('Mobile filter toggled');
                                setShowMobileFilters(!showMobileFilters);
                            }}
                            className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {(search || selectedType) && (
                                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full">
                                    Active
                                </span>
                            )}
                        </button>

                        {/* Mobile Filters Panel */}
                        {showMobileFilters && (
                            <div className="md:hidden bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium text-gray-900">Filters</h3>
                                    <button
                                        onClick={() => setShowMobileFilters(false)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Client Type
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleTypeFilter('')}
                                                className={`px-3 py-2 rounded-lg border text-sm ${
                                                    !selectedType
                                                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                All Types
                                            </button>
                                            {types.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => handleTypeFilter(type.id)}
                                                    className={`px-3 py-2 rounded-lg border text-sm ${
                                                        selectedType === type.id
                                                            ? 'bg-teal-50 border-teal-500 text-teal-700'
                                                            : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {type.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(search || selectedType) && (
                                        <button
                                            onClick={clearFilters}
                                            className="w-full px-4 py-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Companies Table Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Client List</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {companies.total} total clients • {statistics.active} active • {statistics.inactive} inactive
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-600">
                                    Showing {companies.from || 0} to {companies.to || 0} of {companies.total || 0} results
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Companies Table Component */}
                    <CompaniesTable 
                        companies={companies}
                        filters={{ search, client_type_id: selectedType }}
                        onSearch={handleSearch}
                        onFilterChange={handleTypeFilter}
                        showActions={true}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDeleteClick}
                    />
                </div>

                {/* Quick Summary */}
                <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Quick Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-lg md:text-2xl font-bold text-gray-900">{statistics.total || 0}</div>
                            <div className="text-xs md:text-sm text-gray-600">Total Clients</div>
                        </div>
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-lg md:text-2xl font-bold text-green-600">{statistics.active || 0}</div>
                            <div className="text-xs md:text-sm text-gray-600">Active</div>
                        </div>
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-lg md:text-2xl font-bold text-red-600">{statistics.inactive || 0}</div>
                            <div className="text-xs md:text-sm text-gray-600">Inactive</div>
                        </div>
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-lg md:text-2xl font-bold text-teal-600">{companies.data?.length || 0}</div>
                            <div className="text-xs md:text-sm text-gray-600">Currently Displayed</div>
                        </div>
                    </div>
                    
                    {/* Additional Stats */}
                    <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
                        <h4 className="text-sm md:text-base font-medium text-gray-900 mb-2 md:mb-3">Client Distribution</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                            {statistics.client_types?.map((type) => {
                                const colors = getTypeColor(type.name);
                                const percentage = statistics.total > 0 
                                    ? Math.round((type.count / statistics.total) * 100) 
                                    : 0;
                                
                                return (
                                    <div key={type.id} className="text-center p-2 md:p-3 border border-gray-200 rounded-lg">
                                        <div className={`text-base md:text-xl font-bold ${colors.color}`}>
                                            {type.count}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">{type.name}</div>
                                        <div className="mt-1">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full ${colors.bg.replace('bg-', 'bg-')}`}
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Need Help?
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                        Tips for managing your clients effectively:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                        <li>Use the search bar to quickly find specific clients</li>
                        <li>Filter by client type to organize your portfolio</li>
                        <li>Click on any client to view detailed information</li>
                        <li>Use the "Add New Client" button to expand your client base</li>
                    </ul>
                </div>
            </div>

            {/* Mobile bottom action bar */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-40 md:hidden">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            <div className="font-medium">{companies.total || 0} clients</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>{statistics.active || 0} active</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span>{statistics.inactive || 0} inactive</span>
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
                        >
                            <FileText className="w-5 h-5" />
                            Add Client
                        </button>
                    </div>
                </div>
            )}
        </div>
        </HeaderLayout>
    );
};

export default CompaniesIndex;