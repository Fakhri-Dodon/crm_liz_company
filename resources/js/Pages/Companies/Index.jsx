// resources/js/Pages/Companies/Index.jsx
import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import HeaderLayout from '@/Layouts/HeaderLayout';
import TableLayout from '@/Layouts/TableLayout';
import CompaniesTable from '@/Components/Companies/CompaniesTable';
import Create from '@/Components/Companies/Create';
import { 
    PlusCircle, 
    Edit, 
    Trash2,
    Phone,
    Mail,
    Search,
    FileText,
    Building,
    User,
    Calendar,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    AlertCircle
} from 'lucide-react';

const CompaniesIndex = () => {
    const { companies, statistics, types, filters, fromQuotation, quotationId } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.client_type_id || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState([]);

    // Check screen size on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            
            // Update visible columns based on screen size
            const columns = [
                { key: 'name', label: 'Client Name', showOnMobile: true },
                { key: 'address', label: 'Address', showOnMobile: false },
                { key: 'contact', label: 'Contact Person', showOnMobile: false },
                { key: 'email', label: 'Email & Phone', showOnMobile: true },
                { key: 'status', label: 'Status', showOnMobile: true },
                { key: 'actions', label: 'Actions', showOnMobile: true }
            ];
            
            const visible = mobile 
                ? columns.filter(col => col.showOnMobile).map(col => col.label)
                : columns.map(col => col.label);
            
            setVisibleColumns(visible);
        };

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

    // Handle search with debounce
    const handleSearch = (value) => {
        setSearch(value);
        router.get('/companies', { 
            search: value,
            client_type_id: selectedType,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Handle type filter
    const handleTypeFilter = (typeId) => {
        const newType = typeId === selectedType ? '' : typeId;
        setSelectedType(newType);
        router.get('/companies', { 
            search,
            client_type_id: newType,
        }, {
            preserveState: true,
            replace: true
        });
        setShowMobileFilters(false);
    };

    // Clear all filters
    const clearFilters = () => {
        setSearch('');
        setSelectedType('');
        router.get('/companies', {}, {
            preserveState: true,
            replace: true
        });
    };

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
            <Head title="CLIENT MANAGEMENT" />

            <div className="space-y-4 md:space-y-6 px-3 md:px-0 pb-16 md:pb-0">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 md:pt-0">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CLIENT</h1>
                        <p className="text-sm md:text-base text-gray-600 mt-1">Manage your client portfolio</p>
                    </div>
                    
                    {/* Quotation Notification Banner */}
                    {fromQuotation && quotationId && (
                        <div className="w-full sm:w-auto bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 sm:mb-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">
                                        Creating client from quotation
                                    </span>
                                </div>
                                <button
                                    onClick={() => router.get('/companies')}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-medium transition-colors shadow-md"
                    >
                        <FileText className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-sm md:text-base">Add Quotation</span>
                    </button>
                </div>

                {/* Create Modal */}
                <Create 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    clientTypes={types}
                    quotationId={quotationId}
                />

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
                                        onClick={() => handleTypeFilter(typeData.id)}
                                        className={`text-xs md:text-sm ${selectedType === typeData.id ? colors.bg + ' ' + colors.color : 'text-gray-600 hover:text-gray-900'} px-2 md:px-3 py-1 rounded-full hover:bg-gray-100 transition w-full text-center`}
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
                                placeholder="Search clients..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm md:text-base"
                            />
                        </div>

                        {/* Desktop Filters */}
                        <div className="hidden md:flex items-center gap-3">
                            <select
                                value={selectedType}
                                onChange={(e) => handleTypeFilter(e.target.value)}
                                className="px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm md:text-base flex-1"
                            >
                                <option value="">All Types</option>
                                {types.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            
                            {(search || selectedType) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 md:px-4 py-2 md:py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-300 text-sm md:text-base"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
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
                                            className="w-full px-4 py-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium hover:bg-red-100"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <TableLayout columns={visibleColumns}>
                            {companies.data.length > 0 ? (
                                companies.data.map((company) => {
                                    const colors = getTypeColor(company.client_type_name);
                                    
                                    return (
                                        <tr key={company.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                            {/* Client Name */}
                                            <td className="px-3 md:px-6 py-3 md:py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Building className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                                                    </div>
                                                    <div className="ml-2 md:ml-4 min-w-0 flex-1">
                                                        <div className="font-medium text-gray-900 text-sm md:text-base truncate">
                                                            {company.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 flex-wrap">
                                                            <span className="bg-gray-100 px-1.5 md:px-2 py-0.5 rounded text-xs">
                                                                {company.client_code}
                                                            </span>
                                                            {company.client_since && !isMobile && (
                                                                <span className="hidden md:flex items-center gap-1 text-xs">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Since {company.client_since}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isMobile && (
                                                            <div className="mt-2 space-y-1">
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-3 h-3 text-gray-400" />
                                                                    <span className="text-xs text-gray-700 truncate">
                                                                        {company.contact_person}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                                    <span className="text-xs text-gray-600 truncate">
                                                                        {company.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Address - Hidden on mobile */}
                                            {!isMobile && (
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                                        {company.address || 'No address'}
                                                    </div>
                                                </td>
                                            )}

                                            {/* Contact Person - Hidden on mobile */}
                                            {!isMobile && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center">
                                                            <User className="w-3 h-3 md:w-4 md:h-4 text-teal-700" />
                                                        </div>
                                                        <div className="ml-3 min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {company.contact_person}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {company.position || 'Contact Person'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}

                                            {/* Email & Phone */}
                                            {!isMobile ? (
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            <span className="text-sm text-gray-900 truncate">{company.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            <span className="text-sm bg-yellow-200 px-2 md:px-3 py-1 md:py-1.5 rounded font-medium">
                                                                {company.phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            ) : (
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm bg-yellow-200 px-2 py-1 rounded font-medium truncate">
                                                            {company.phone}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}

                                            {/* Status */}
                                            <td className="px-3 md:px-6 py-3 md:py-4">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium border ${colors.badgeBorder} ${colors.badgeText} bg-white`}>
                                                        <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1 md:mr-2 ${colors.badgeText.replace('text-', 'bg-')}`}></span>
                                                        <span className="truncate">{company.client_type_name}</span>
                                                    </span>
                                                    <span className={`inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs ${
                                                        company.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {company.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 md:px-6 py-3 md:py-4">
                                                <div className="flex items-center gap-1 md:gap-2">
                                                    <Link
                                                        href={route('companies.edit', company.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-1.5 md:p-2 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4 md:w-5 md:h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this client?')) {
                                                                router.delete(route('companies.destroy', company.id));
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900 p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                                    </button>
                                                    {isMobile && (
                                                        <button
                                                            className="text-gray-600 hover:text-gray-900 p-1.5 hover:bg-gray-100 rounded-lg transition"
                                                            title="More options"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns.length} className="px-3 md:px-6 py-8 md:py-12 text-center">
                                        <div className="text-gray-500">
                                            <Building className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-300" />
                                            <div className="text-base md:text-lg font-medium mb-2">No clients found</div>
                                            <p className="text-xs md:text-sm text-gray-400 mb-4 px-4">
                                                {search || selectedType ? 'Try adjusting your search or filter' : 'Get started by adding your first client'}
                                            </p>
                                            <button 
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-3 md:px-4 py-2 md:py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
                                            >
                                                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                                                Add Client
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </TableLayout>
                    </div>

                    {/* Pagination */}
                    {companies.data.length > 0 && (
                        <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                                <div className="text-xs md:text-sm text-gray-700">
                                    Showing <span className="font-medium">{companies.from}</span> to{' '}
                                    <span className="font-medium">{companies.to}</span> of{' '}
                                    <span className="font-medium">{companies.total}</span> results
                                </div>
                                
                                <nav className="flex items-center">
                                    {isMobile ? (
                                        <div className="flex items-center gap-2">
                                            {companies.links[0].url && (
                                                <Link
                                                    href={companies.links[0].url}
                                                    className="p-2 border border-gray-300 rounded-lg bg-white text-gray-500 hover:bg-gray-50"
                                                    title="Previous"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Link>
                                            )}
                                            <div className="text-sm text-gray-700">
                                                Page {companies.current_page} of {companies.last_page}
                                            </div>
                                            {companies.links[companies.links.length - 1].url && (
                                                <Link
                                                    href={companies.links[companies.links.length - 1].url}
                                                    className="p-2 border border-gray-300 rounded-lg bg-white text-gray-500 hover:bg-gray-50"
                                                    title="Next"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            {companies.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-2 md:px-3 py-1.5 md:py-2 text-sm font-medium border ${
                                                        link.active
                                                            ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    } ${index === 0 ? 'rounded-l-md' : ''} ${
                                                        index === companies.links.length - 1 ? 'rounded-r-md' : ''
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Summary */}
                <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Quick Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg">
                            <div className="text-lg md:text-2xl font-bold text-gray-900">{statistics.total}</div>
                            <div className="text-xs md:text-sm text-gray-600">Total Clients</div>
                        </div>
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg">
                            <div className="text-lg md:text-2xl font-bold text-green-600">{statistics.active}</div>
                            <div className="text-xs md:text-sm text-gray-600">Active</div>
                        </div>
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg">
                            <div className="text-lg md:text-2xl font-bold text-red-600">{statistics.inactive}</div>
                            <div className="text-xs md:text-sm text-gray-600">Inactive</div>
                        </div>
                        <div className="text-center p-2 md:p-4 border border-gray-200 rounded-lg">
                            <div className="text-lg md:text-2xl font-bold text-teal-600">{companies.total}</div>
                            <div className="text-xs md:text-sm text-gray-600">Showing</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile bottom action bar */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-40 md:hidden">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
                    >
                        <FileText className="w-5 h-5" />
                        Add Quotation
                    </button>
                </div>
            )}
        </HeaderLayout>
    );
};

export default CompaniesIndex;