import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { 
    Edit, 
    Trash2,
    Phone,
    Mail,
    Building,
    User,
    Calendar,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Eye,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    ChevronRight as RightArrow,
    MapPin,
    CheckCircle,
    XCircle
} from 'lucide-react';

const CompaniesTable = ({ 
    companies, 
    filters = {}, 
    onSearch, 
    onFilterChange,
    showActions = true,
    onEditClick,
    onDeleteClick,
    bulkSelect = false,
    selectedIds = [],
    onBulkSelect = null
}) => {
    // State untuk responsive design
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({
        key: '',
        direction: 'asc'
    });
    const searchInputRef = useRef(null);

    // Effect untuk mendeteksi ukuran layar
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 640);
            setIsTablet(width >= 640 && width < 1024);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Effect untuk debounced search dengan auto-focus
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
        
        const timer = setTimeout(() => {
            if (search !== filters.search && onSearch) {
                onSearch(search);
            }
        }, 500);
        
        return () => clearTimeout(timer);
    }, [search, filters.search, onSearch]);

    // Handle sort
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        
        if (onFilterChange) {
            onFilterChange({
                sort_by: key,
                sort_order: direction
            });
        }
    };

    // Fungsi untuk menentukan warna berdasarkan tipe client
    const getTypeColor = (typeName) => {
        const colorMap = {
            'Corporate': {
                badgeBorder: 'border-blue-200',
                badgeText: 'text-blue-700',
                bgColor: 'bg-blue-100',
                dotColor: 'bg-blue-500'
            },
            'Government': {
                badgeBorder: 'border-green-200',
                badgeText: 'text-green-700',
                bgColor: 'bg-green-100',
                dotColor: 'bg-green-500'
            },
            'Individual': {
                badgeBorder: 'border-orange-200',
                badgeText: 'text-orange-700',
                bgColor: 'bg-orange-100',
                dotColor: 'bg-orange-500'
            },
            'NGO': {
                badgeBorder: 'border-purple-200',
                badgeText: 'text-purple-700',
                bgColor: 'bg-purple-100',
                dotColor: 'bg-purple-500'
            },
            'PMDN': {
                badgeBorder: 'border-blue-200',
                badgeText: 'text-blue-700',
                bgColor: 'bg-blue-100',
                dotColor: 'bg-blue-500'
            },
            'PMA': {
                badgeBorder: 'border-green-200',
                badgeText: 'text-green-700',
                bgColor: 'bg-green-100',
                dotColor: 'bg-green-500'
            },
            'KPPA': {
                badgeBorder: 'border-orange-200',
                badgeText: 'text-orange-700',
                bgColor: 'bg-orange-100',
                dotColor: 'bg-orange-500'
            },
            'BUMN': {
                badgeBorder: 'border-red-200',
                badgeText: 'text-red-700',
                bgColor: 'bg-red-100',
                dotColor: 'bg-red-500'
            }
        };

        const defaultColors = {
            badgeBorder: 'border-gray-200',
            badgeText: 'text-gray-700',
            bgColor: 'bg-gray-100',
            dotColor: 'bg-gray-500'
        };

        return colorMap[typeName] || defaultColors;
    };

    // Format phone number
    const formatPhoneNumber = (phone) => {
        if (!phone || phone === 'N/A') return 'N/A';
        
        // Remove all non-numeric characters
        const numericPhone = phone.replace(/\D/g, '');
        
        if (numericPhone.length === 0) return 'N/A';
        
        // Format for Indonesian phone numbers
        if (numericPhone.length === 10) {
            return numericPhone.replace(/(\d{4})(\d{4})(\d{2})/, '$1-$2-$3');
        } else if (numericPhone.length === 11) {
            return numericPhone.replace(/(\d{4})(\d{4})(\d{3})/, '$1-$2-$3');
        } else if (numericPhone.length === 12) {
            return numericPhone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (numericPhone.length === 13) {
            return numericPhone.replace(/(\d{4})(\d{4})(\d{5})/, '$1-$2-$3');
        }
        
        // Default formatting
        return numericPhone.replace(/(\d{4})(?=\d)/g, '$1-');
    };

// Fungsi handleViewClick yang diperbaiki
const handleViewClick = (company) => {
    console.log('=== CLICK COMPANY DETAIL ===');
    console.log('Company ID:', company.id);
    console.log('Company Name:', company.name);
    console.log('Route name:', route('companies.show', company.id));
    console.log('Full route URL:', route('companies.show', { company: company.id }));
    
    // Debug: Cek apakah route ada
    try {
        const routeUrl = route('companies.show', company.id);
        console.log('Route URL generated:', routeUrl);
        
        // Visit dengan timeout untuk debugging
        setTimeout(() => {
            router.visit(routeUrl, {
                onStart: () => console.log('Navigation started...'),
                onFinish: () => console.log('Navigation finished'),
                onError: (error) => console.error('Navigation error:', error)
            });
        }, 100);
        
    } catch (error) {
        console.error('Route generation error:', error);
        console.error('Available routes:', window.routes || 'Not available');
        
        // Fallback: Gunakan URL langsung
        const directUrl = `/companies/${company.id}`;
        console.log('Using direct URL:', directUrl);
        router.visit(directUrl);
    }
};

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get initial for avatar
    const getInitials = (name) => {
        if (!name || name === 'N/A') return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Get contact person data
    const getContactPerson = (company) => {
        return {
            name: company.contact_person || company.primary_contact?.name || 'N/A',
            email: company.email || company.primary_contact?.email || company.contact_email || 'N/A',
            phone: company.phone || company.primary_contact?.phone || company.contact_phone || 'N/A',
            position: company.position || company.primary_contact?.position || company.contact_position || 'Contact Person'
        };
    };

    // Tablet View
    if (isTablet) {
        return (
            <div className="space-y-4">
                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex flex-col gap-3">
                        {/* Search input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search clients by name, code, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                            />
                        </div>
                        
                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filters</span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        {/* Results count */}
                        <div className="text-sm text-gray-600">
                            {companies.total || 0} client{companies.total !== 1 ? 's' : ''} found
                        </div>
                    </div>
                </div>

                {/* Tablet Cards Layout */}
                {companies.data && companies.data.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {companies.data.map((company) => {
                            const colors = getTypeColor(company.client_type_name);
                            const isSelected = bulkSelect && selectedIds.includes(company.id);
                            const contact = getContactPerson(company);
                            const initials = getInitials(contact.name);
                            
                            return (
                                <div 
                                    key={company.id} 
                                    className={`bg-white rounded-lg border transition-all cursor-pointer group hover:border-teal-300 hover:shadow-md ${isSelected ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-200'}`}
                                    onClick={() => handleViewClick(company)}
                                >
                                    <div className="p-4">
                                        {/* Header with checkbox and actions */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                {bulkSelect && onBulkSelect && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            onBulkSelect(company.id, e.target.checked);
                                                        }}
                                                        className="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 z-10"
                                                    />
                                                )}
                                                <div className="flex items-center gap-3 flex-1">
                                                    {company.logo_url ? (
                                                        <img 
                                                            src={company.logo_url} 
                                                            alt={company.name}
                                                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="bg-gradient-to-br from-[#054748] to-[#0a5d5e] w-12 h-12 rounded-lg flex items-center justify-center">
                                                            <Building className="w-6 h-6 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-teal-600 transition-colors flex items-center gap-1">
                                                            {company.name}
                                                            <RightArrow className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </h3>
                                                        <p className="text-xs text-gray-500">{company.client_code}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Action buttons */}
                                            {showActions && (
                                                <div className="flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewClick(company);
                                                        }}
                                                        className="p-1.5 text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditClick && onEditClick(company);
                                                        }}
                                                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteClick && onDeleteClick(company);
                                                        }}
                                                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Company details */}
                                        <div className="space-y-3">
                                            {/* Contact info */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-bold text-teal-700">
                                                                {initials}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {contact.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {contact.position}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 pl-11">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-xs text-gray-600 truncate">{contact.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-xs font-medium bg-yellow-100 px-2 py-1 rounded">
                                                            {formatPhoneNumber(contact.phone)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Address */}
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-600">
                                                        {company.city || ''} {company.province ? `, ${company.province}` : ''}
                                                        {company.country ? `, ${company.country}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bgColor} ${colors.badgeText} border ${colors.badgeBorder}`}>
                                                    <span className={`w-2 h-2 rounded-full mr-1.5 ${colors.dotColor}`}></span>
                                                    {company.client_type_name}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs ${
                                                    company.is_active 
                                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                }`}>
                                                    {company.is_active ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </span>
                                                {company.client_since && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs bg-purple-100 text-purple-800 border border-purple-200">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        Since {company.client_since}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <div className="text-lg font-medium text-gray-500 mb-2">No clients found</div>
                        <p className="text-sm text-gray-400">
                            {search ? 'Try adjusting your search' : 'Get started by adding your first client'}
                        </p>
                    </div>
                )}

                {/* Tablet Pagination */}
                {companies.data && companies.data.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Results info */}
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{companies.from}</span> to{' '}
                                <span className="font-medium">{companies.to}</span> of{' '}
                                <span className="font-medium">{companies.total}</span> results
                            </div>
                            
                            {/* Pagination buttons */}
                            <div className="flex items-center gap-2">
                                {companies.links[0].url && (
                                    <Link
                                        href={companies.links[0].url}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Link>
                                )}
                                
                                <div className="flex items-center gap-1">
                                    {companies.links.slice(1, -1).map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`inline-flex items-center px-3 py-2 text-sm font-medium border ${
                                                link.active
                                                    ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            } rounded-lg`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                                
                                {companies.links[companies.links.length - 1].url && (
                                    <Link
                                        href={companies.links[companies.links.length - 1].url}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Mobile View
    if (isMobile) {
        return (
            <div className="space-y-3">
                {/* Mobile Search */}
                <div className="sticky top-0 z-10 bg-white p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search clients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                    </div>
                </div>

                {/* Mobile Cards */}
                {companies.data && companies.data.length > 0 ? (
                    <div className="px-3 space-y-3 pb-4">
                        {companies.data.map((company) => {
                            const colors = getTypeColor(company.client_type_name);
                            const contact = getContactPerson(company);
                            const initials = getInitials(contact.name);
                            
                            return (
                                <div 
                                    key={company.id} 
                                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer group hover:border-teal-300 hover:shadow-md transition-all"
                                    onClick={() => handleViewClick(company)}
                                >
                                    <div className="space-y-3">
                                        {/* Company header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                {company.logo_url ? (
                                                    <img 
                                                        src={company.logo_url} 
                                                        alt={company.name}
                                                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="bg-gradient-to-br from-[#054748] to-[#0a5d5e] w-10 h-10 rounded-lg flex items-center justify-center">
                                                        <Building className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-teal-600 transition-colors flex items-center gap-1">
                                                        {company.name}
                                                        <RightArrow className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate">{company.client_code}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Status badge */}
                                            <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                                company.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {company.is_active ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="hidden sm:inline">Active</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" />
                                                        <span className="hidden sm:inline">Inactive</span>
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        
                                        {/* Client type */}
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bgColor} ${colors.badgeText}`}>
                                                <span className={`w-2 h-2 rounded-full mr-1.5 ${colors.dotColor}`}></span>
                                                {company.client_type_name}
                                            </span>
                                            
                                            {/* Action buttons */}
                                            {showActions && (
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewClick(company);
                                                        }}
                                                        className="p-1.5 text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditClick && onEditClick(company);
                                                        }}
                                                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Contact info */}
                                        <div className="space-y-2 border-t pt-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-teal-700">{initials}</span>
                                                </div>
                                                <span className="text-xs text-gray-700 truncate">{contact.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                <span className="text-xs font-medium bg-yellow-100 px-2 py-1 rounded">
                                                    {formatPhoneNumber(contact.phone)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-600 truncate">{contact.email}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Address if available */}
                                        {(company.city || company.province) && (
                                            <div className="pt-2 border-t flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                <p className="text-xs text-gray-600 truncate">
                                                    {company.city}{company.province ? `, ${company.province}` : ''}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* Client since */}
                                        {company.client_since && (
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-gray-500">
                                                    Client since: {formatDate(company.client_since)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="px-3 py-8 text-center">
                        <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <div className="text-base font-medium text-gray-500">No clients found</div>
                        <p className="text-sm text-gray-400 mt-1">
                            {search ? 'Try adjusting your search' : 'Get started by adding your first client'}
                        </p>
                    </div>
                )}

                {/* Mobile Pagination */}
                {companies.data && companies.data.length > 0 && (
                    <div className="sticky bottom-0 bg-white border-t p-3">
                        <div className="flex items-center justify-between">
                            {/* Page info */}
                            <div className="text-xs text-gray-700">
                                Page {companies.current_page} of {companies.last_page}
                            </div>
                            
                            {/* Navigation buttons */}
                            <div className="flex items-center gap-2">
                                {companies.links[0].url && (
                                    <Link
                                        href={companies.links[0].url}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                    </Link>
                                )}
                                
                                {companies.links[companies.links.length - 1].url && (
                                    <Link
                                        href={companies.links[companies.links.length - 1].url}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ============= DESKTOP VIEW =============
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table header with search and filters */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search clients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                    </div>
                    
                    {/* Results count */}
                    <div className="text-sm text-gray-600">
                        {companies.total || 0} client{companies.total !== 1 ? 's' : ''} found
                    </div>
                </div>
            </div>

            {/* Table container */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {bulkSelect && (
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                        onChange={(e) => {
                                            if (onBulkSelect) {
                                                companies.data.forEach(company => {
                                                    onBulkSelect(company.id, e.target.checked);
                                                });
                                            }
                                        }}
                                    />
                                </th>
                            )}
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Client Name
                                    {sortConfig.key === 'name' && (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                    )}
                                </div>
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('contact_person')}
                            >
                                <div className="flex items-center gap-1">
                                    Contact Person
                                    {sortConfig.key === 'contact_person' && (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                    )}
                                </div>
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('client_type_name')}
                            >
                                <div className="flex items-center gap-1">
                                    Type & Status
                                    {sortConfig.key === 'client_type_name' && (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                    )}
                                </div>
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('client_since')}
                            >
                                <div className="flex items-center gap-1">
                                    Location & Date
                                    {sortConfig.key === 'client_since' && (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                    )}
                                </div>
                            </th>
                            {showActions && (
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {companies.data && companies.data.length > 0 ? (
                            companies.data.map((company) => {
                                const colors = getTypeColor(company.client_type_name);
                                const isSelected = bulkSelect && selectedIds.includes(company.id);
                                const contact = getContactPerson(company);
                                const initials = getInitials(contact.name);
                                
                                return (
                                    <tr 
                                        key={company.id} 
                                        className={`group transition-colors ${isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                                    >
                                        {bulkSelect && (
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => onBulkSelect && onBulkSelect(company.id, e.target.checked)}
                                                    className="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                                />
                                            </td>
                                        )}
                                        
                                        {/* Client Name Column */}
                                        <td className="px-6 py-4">
                                            <div 
                                                className="flex items-center cursor-pointer"
                                                onClick={() => handleViewClick(company)}
                                            >
                                                <div className="flex-shrink-0">
                                                    {company.logo_url ? (
                                                        <img 
                                                            src={company.logo_url} 
                                                            alt={company.name}
                                                            className="h-12 w-12 rounded-lg object-cover border border-gray-200 group-hover:border-teal-300 transition-colors"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 bg-gradient-to-br from-[#054748] to-[#0a5d5e] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                                            <Building className="w-6 h-6 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-medium text-gray-900 truncate group-hover:text-teal-600 transition-colors">
                                                            {company.name}
                                                        </div>
                                                        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                                                            {company.client_code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact Person Column */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-bold text-teal-700">
                                                                {initials}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {contact.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {contact.position}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 pl-12">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-sm text-gray-900 truncate">{contact.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-sm bg-yellow-100 px-3 py-1 rounded font-medium">
                                                            {formatPhoneNumber(contact.phone)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Type & Status Column */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${colors.bgColor} ${colors.badgeText} border ${colors.badgeBorder}`}>
                                                    <span className={`w-2 h-2 rounded-full mr-2 ${colors.dotColor}`}></span>
                                                    {company.client_type_name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs ${
                                                        company.is_active 
                                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                    }`}>
                                                        {company.is_active ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Location & Date Column */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <div className="text-sm text-gray-900">
                                                        <div className="font-medium">{company.city || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {company.province || ''} {company.country ? `, ${company.country}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    {company.client_since && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Client since: {formatDate(company.client_since)}</span>
                                                        </div>
                                                    )}
                                                    {company.created_at && (
                                                        <div className="text-xs text-gray-500">
                                                            Created: {formatDate(company.created_at)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Actions Column */}
                                        {showActions && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewClick(company)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg border border-teal-200 transition"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => onEditClick && onEditClick(company)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg border border-blue-200 transition"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteClick && onDeleteClick(company)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg border border-red-200 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={showActions ? (bulkSelect ? 6 : 5) : (bulkSelect ? 5 : 4)} className="px-6 py-12 text-center">
                                    <div className="text-gray-500">
                                        <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <div className="text-lg font-medium mb-2">No clients found</div>
                                        <p className="text-sm text-gray-400">
                                            {search ? 'Try adjusting your search' : 'Get started by adding your first client'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Desktop Pagination */}
            {companies.data && companies.data.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        {/* Results info */}
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{companies.from}</span> to{' '}
                            <span className="font-medium">{companies.to}</span> of{' '}
                            <span className="font-medium">{companies.total}</span> results
                        </div>
                        
                        {/* Pagination links */}
                        <nav className="flex items-center">
                            <div className="flex items-center gap-1">
                                {companies.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border ${
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
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompaniesTable;