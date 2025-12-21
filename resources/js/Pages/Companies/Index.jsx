// resources/js/Pages/Companies/Index.jsx
import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import HeaderLayout from '@/Layouts/HeaderLayout';
import TableLayout from '@/Layouts/TableLayout';
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
    Calendar
} from 'lucide-react';

const CompaniesIndex = () => {
    const { companies, statistics, types, filters } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.client_type_id || '');

    // Handle search with debounce
    const handleSearch = (value) => {
        setSearch(value);
        router.get('/companies', { 
            search: value,
            client_type_id: selectedType,
        }, {
            preserveState: true,
            replace: true
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

        // Default colors untuk type yang tidak terdefinisi
        const defaultColors = {
            color: 'text-gray-600',
            border: 'border-gray-600',
            bg: 'bg-gray-50',
            badgeBorder: 'border-gray-200',
            badgeText: 'text-gray-700'
        };

        return colorMap[typeName] || defaultColors;
    };

    // Table columns
    const columns = [
        'Client Name',
        'Address',
        'Contact Person',
        'Email & Phone',
        'Status',
        'Actions'
    ];

    return (
        <HeaderLayout>
            <Head title="CLIENT MANAGEMENT" />

            <div className="space-y-6">
                {/* Header: Judul di kiri, tombol di kanan */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">CLIENT</h1>
                        <p className="text-gray-600 mt-1">Manage your client portfolio</p>
                    </div>
                    <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md">
                        <FileText className="w-5 h-5" />
                        Add Quotation
                    </button>
                </div>

                {/* Stat Cards: Mengambil data dari client_type table */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statistics.client_types?.map((typeData) => {
                        const colors = getTypeColor(typeData.name);
                        
                        return (
                            <div 
                                key={typeData.id}
                                className={`bg-white rounded-lg border-l-4 ${colors.border} p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`text-lg font-semibold ${colors.color}`}>
                                            {typeData.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {typeData.label || `${typeData.name} Companies`}
                                        </p>
                                    </div>
                                    <span className={`text-2xl font-bold ${colors.color}`}>
                                        {typeData.count}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <button 
                                        onClick={() => handleTypeFilter(typeData.id)}
                                        className={`text-sm ${selectedType === typeData.id ? colors.bg + ' ' + colors.color : 'text-gray-600 hover:text-gray-900'} px-3 py-1 rounded-full hover:bg-gray-100 transition`}
                                    >
                                        {selectedType === typeData.id ? '✓ Filtered' : 'View All'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search clients by name, email, or phone..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <select
                                value={selectedType}
                                onChange={(e) => handleTypeFilter(e.target.value)}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="">All Types</option>
                                {types.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            
                            {selectedType && (
                                <button
                                    onClick={() => {
                                        setSelectedType('');
                                        router.get('/companies', { search }, {
                                            preserveState: true,
                                            replace: true
                                        });
                                    }}
                                    className="px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-300"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <TableLayout columns={columns}>
                        {companies.data.length > 0 ? (
                            companies.data.map((company) => {
                                const colors = getTypeColor(company.client_type_name);
                                
                                return (
                                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Building className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">{company.name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
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
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {company.address || 'No address provided'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-teal-700" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {company.contact_person}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {company.position || 'Contact Person'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${colors.badgeBorder} ${colors.badgeText} bg-white`}>
                                                <span className={`w-2 h-2 rounded-full mr-2 ${colors.badgeText.replace('text-', 'bg-')}`}></span>
                                                {company.client_type_name}
                                            </span>
                                            <div className="mt-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                                    company.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {company.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="text-gray-500">
                                        <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <div className="text-lg font-medium mb-2">No clients found</div>
                                        <p className="text-sm text-gray-400 mb-4">
                                            {search || selectedType ? 'Try adjusting your search or filter' : 'Get started by adding your first client'}
                                        </p>
                                        <Link
                                            href={route('companies.create')}
                                            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            <PlusCircle className="w-5 h-5" />
                                            Add New Client
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </TableLayout>

                    {/* Pagination */}
                    {companies.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{companies.from}</span> to{' '}
                                    <span className="font-medium">{companies.to}</span> of{' '}
                                    <span className="font-medium">{companies.total}</span> results
                                </div>
                                
                                <nav className="flex items-center gap-1">
                                    {/* Previous Button */}
                                    {companies.links[0].url && (
                                        <Link
                                            href={companies.links[0].url}
                                            className="relative inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md bg-white text-gray-500 hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}

                                    {/* Page Numbers */}
                                    {companies.links.slice(1, -1).map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border ${
                                                link.active
                                                    ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}

                                    {/* Next Button */}
                                    {companies.links[companies.links.length - 1].url && (
                                        <Link
                                            href={companies.links[companies.links.length - 1].url}
                                            className="relative inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 rounded-r-md bg-white text-gray-500 hover:bg-gray-50"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Summary */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border border-gray-200 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
                            <div className="text-sm text-gray-600">Total Clients</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                            <div className="text-sm text-gray-600">Active</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{statistics.inactive}</div>
                            <div className="text-sm text-gray-600">Inactive</div>
                        </div>
                        <div className="text-center p-4 border border-gray-200 rounded-lg">
                            <div className="text-2xl font-bold text-teal-600">{companies.total}</div>
                            <div className="text-sm text-gray-600">Showing</div>
                        </div>
                    </div>
                </div>
            </div>
        </HeaderLayout>
    );
};

export default CompaniesIndex;