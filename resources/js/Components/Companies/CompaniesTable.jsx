import React, { useState, useEffect } from 'react';
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
    ChevronRight
} from 'lucide-react';

const CompaniesTable = ({ 
    companies, 
    filters = {}, 
    onSearch, 
    onFilterChange,
    showActions = true 
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [search, setSearch] = useState(filters.search || '');

    // Check screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onSearch) onSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, onSearch]);

    // Define color mapping for different client types
    const getTypeColor = (typeName) => {
        const colorMap = {
            'PMDN': {
                badgeBorder: 'border-blue-200',
                badgeText: 'text-blue-700',
                bgColor: 'bg-blue-100'
            },
            'PMA': {
                badgeBorder: 'border-green-200',
                badgeText: 'text-green-700',
                bgColor: 'bg-green-100'
            },
            'KPPA': {
                badgeBorder: 'border-orange-200',
                badgeText: 'text-orange-700',
                bgColor: 'bg-orange-100'
            },
            'BUMN': {
                badgeBorder: 'border-red-200',
                badgeText: 'text-red-700',
                bgColor: 'bg-red-100'
            }
        };

        const defaultColors = {
            badgeBorder: 'border-gray-200',
            badgeText: 'text-gray-700',
            bgColor: 'bg-gray-100'
        };

        return colorMap[typeName] || defaultColors;
    };

    // Mobile view
    if (isMobile) {
        return (
            <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Mobile Cards */}
                {companies.data.length > 0 ? (
                    companies.data.map((company) => {
                        const colors = getTypeColor(company.client_type_name);
                        
                        return (
                            <div key={company.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-100 p-2 rounded-lg">
                                                <Building className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{company.name}</h3>
                                                <p className="text-xs text-gray-500">{company.client_code}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm text-gray-700">{company.contact_person}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm text-gray-600 truncate">{company.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm bg-yellow-200 px-2 py-1 rounded font-medium">
                                                    {company.phone}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors.badgeBorder} ${colors.badgeText} ${colors.bgColor}`}>
                                                {company.client_type_name}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                                company.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {company.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {showActions && (
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                href={route('companies.edit', company.id)}
                                                className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this client?')) {
                                                        router.delete(route('companies.destroy', company.id));
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <div className="text-base font-medium text-gray-500">No clients found</div>
                    </div>
                )}

                {/* Mobile Pagination */}
                {companies.data.length > 0 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
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
                )}
            </div>
        );
    }

    // Desktop view
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Client Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Address
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact Person
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email & Phone
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            {showActions && (
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {companies.data.length > 0 ? (
                            companies.data.map((company) => {
                                const colors = getTypeColor(company.client_type_name);
                                
                                return (
                                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Client Name */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Building className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div className="ml-4 min-w-0 flex-1">
                                                    <div className="font-medium text-gray-900 truncate">
                                                        {company.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                            {company.client_code}
                                                        </span>
                                                        {company.client_since && (
                                                            <span className="flex items-center gap-1 text-xs">
                                                                <Calendar className="w-3 h-3" />
                                                                Since {company.client_since}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Address */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {company.address || 'No address'}
                                            </div>
                                            {(company.city || company.province || company.country) && (
                                                <div className="text-xs text-gray-500 mt-1 truncate">
                                                    {[company.city, company.province, company.country].filter(Boolean).join(', ')}
                                                </div>
                                            )}
                                        </td>

                                        {/* Contact Person */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-teal-700" />
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

                                        {/* Email & Phone */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm text-gray-900 truncate">{company.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm bg-yellow-200 px-3 py-1.5 rounded font-medium">
                                                        {company.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${colors.badgeBorder} ${colors.badgeText} bg-white`}>
                                                    <span className={`w-2 h-2 rounded-full mr-2 ${colors.badgeText.replace('text-', 'bg-')}`}></span>
                                                    {company.client_type_name}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                                    company.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {company.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        {showActions && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route('companies.edit', company.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this client?')) {
                                                                router.delete(route('companies.destroy', company.id));
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={showActions ? 6 : 5} className="px-6 py-12 text-center">
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
            {companies.data.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{companies.from}</span> to{' '}
                            <span className="font-medium">{companies.to}</span> of{' '}
                            <span className="font-medium">{companies.total}</span> results
                        </div>
                        
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