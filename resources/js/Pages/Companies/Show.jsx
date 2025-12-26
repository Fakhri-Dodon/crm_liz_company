// resources/js/Pages/Companies/Show.jsx
import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Building,
    MapPin,
    Globe,
    Phone,
    Mail,
    Users,
    Calendar,
    FileText,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    ChevronRight,
    Home,
    File,
    CreditCard,
    Settings,
    User,
    Shield,
    Download,
    Eye,
    Edit,
    Trash2,
    ArrowLeft,
    Plus
} from 'lucide-react';
import Layout from '@/Layouts/Layout';
import StatusBadge from '@/Components/StatusBadge';
import CompanySidebar from '@/Components/Companies/CompanySidebar';

export default function CompanyShow({ 
    company, 
    statistics, 
    recent_quotations, 
    recent_invoices,
    auth 
}) {
    const [activeTab, setActiveTab] = useState('profile');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Navigation items
    const navItems = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'quotation', label: 'Quotation', icon: FileText },
        { id: 'invoice', label: 'Invoice', icon: CreditCard },
        { id: 'contract', label: 'Contract', icon: File },
        { id: 'project', label: 'Project', icon: Settings },
        { id: 'document', label: 'Document', icon: File },
        { id: 'activity', label: 'Activity', icon: Calendar },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // Status colors for quotations
    const getQuotationStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'expired':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Layout user={auth.user}>
            <Head title={`${company.name} - Company Profile`} />
            
            {/* Back button */}
            <div className="mb-6">
                <Link
                    href={route('companies.index')}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Companies
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar */}
                <CompanySidebar 
                    company={company}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    navItems={navItems}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                {/* Main Content */}
                <div className="flex-1">
                    {/* Header Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            {/* Company Info */}
                            <div className="flex-1">
                                <div className="flex items-start gap-4">
                                    {/* Company Logo */}
                                    <div className="flex-shrink-0">
                                        <div className="h-20 w-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl border border-teal-200 flex items-center justify-center">
                                            {company.logo_url ? (
                                                <img 
                                                    src={company.logo_url} 
                                                    alt={company.name}
                                                    className="h-16 w-16 object-contain rounded-lg"
                                                />
                                            ) : (
                                                <Building className="h-10 w-10 text-teal-600" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Company Details */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800 border border-teal-200">
                                                        {company.client_code}
                                                    </span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                        company.is_active 
                                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                                            : 'bg-red-100 text-red-800 border-red-200'
                                                    }`}>
                                                        {company.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {company.client_type_name && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                            {company.client_type_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('companies.edit', company.id)}
                                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this company?')) {
                                                            router.delete(route('companies.destroy', company.id));
                                                        }
                                                    }}
                                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Contact Info */}
                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Address</p>
                                                        <p className="text-gray-900">{company.address || 'No address provided'}</p>
                                                        {(company.city || company.province) && (
                                                            <p className="text-sm text-gray-500">
                                                                {[company.city, company.province].filter(Boolean).join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <Globe className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Website</p>
                                                        <a 
                                                            href={company.website || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-teal-600 hover:text-teal-800 hover:underline"
                                                        >
                                                            {company.website || 'No website'}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Phone</p>
                                                        <p className="text-gray-900">{company.phone || 'No phone number'}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Email</p>
                                                        <a 
                                                            href={`mailto:${company.email}`}
                                                            className="text-teal-600 hover:text-teal-800 hover:underline"
                                                        >
                                                            {company.email || 'No email'}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Additional Info */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Contact Person</p>
                                            <p className="font-medium text-gray-900">{company.contact_person || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Position</p>
                                            <p className="font-medium text-gray-900">{company.position || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Client Since</p>
                                            <p className="font-medium text-gray-900">
                                                {company.client_since ? formatDate(company.client_since) : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tax Number (NPWP)</p>
                                            <p className="font-medium text-gray-900">{company.tax_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Statistics Cards */}
                            <div className="md:w-80 space-y-4">
                                <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-5">
                                    <h3 className="text-sm font-semibold text-teal-900 mb-4">QUOTATION SUMMARY</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Quotation</span>
                                            <span className="text-lg font-bold text-gray-900">{statistics.total_quotations}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Accepted</span>
                                            <span className="text-lg font-bold text-green-600">{statistics.accepted_quotations}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Expired</span>
                                            <span className="text-lg font-bold text-orange-600">{statistics.expired_quotations}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Cancelled</span>
                                            <span className="text-lg font-bold text-red-600">{statistics.cancelled_quotations}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-4">INVOICE SUMMARY</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Invoice</span>
                                            <span className="text-lg font-bold text-gray-900">{statistics.total_invoices}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Paid</span>
                                            <span className="text-lg font-bold text-green-600">{statistics.paid_invoices}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Pending</span>
                                            <span className="text-lg font-bold text-yellow-600">{statistics.pending_invoices}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Overdue</span>
                                            <span className="text-lg font-bold text-red-600">{statistics.overdue_invoices}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200">
                            <nav className="flex overflow-x-auto">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                                activeTab === item.id
                                                    ? 'border-teal-500 text-teal-600 bg-teal-50'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                            {item.id === 'quotation' && statistics.total_quotations > 0 && (
                                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
                                                    {statistics.total_quotations}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Description</h3>
                                        <p className="text-gray-600">
                                            {company.description || 'No description provided.'}
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Business Information</h4>
                                            <dl className="space-y-3">
                                                <div className="flex justify-between">
                                                    <dt className="text-sm text-gray-500">Industry</dt>
                                                    <dd className="text-sm text-gray-900">{company.industry || 'N/A'}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-sm text-gray-500">Company Size</dt>
                                                    <dd className="text-sm text-gray-900">{company.company_size || 'N/A'}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-sm text-gray-500">Annual Revenue</dt>
                                                    <dd className="text-sm text-gray-900">
                                                        {company.annual_revenue ? formatCurrency(company.annual_revenue) : 'N/A'}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Contacts</h4>
                                            <dl className="space-y-3">
                                                <div className="flex justify-between">
                                                    <dt className="text-sm text-gray-500">Secondary Email</dt>
                                                    <dd className="text-sm text-gray-900">{company.secondary_email || 'N/A'}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-sm text-gray-500">Secondary Phone</dt>
                                                    <dd className="text-sm text-gray-900">{company.secondary_phone || 'N/A'}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'quotation' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Quotations</h3>
                                        <Link
                                            href={route('quotations.create', { company_id: company.id })}
                                            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Quotation
                                        </Link>
                                    </div>
                                    
                                    {recent_quotations.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Quotation No.
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Amount
                                                        </th>
                                                        <th className="px 6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {recent_quotations.map((quotation) => (
                                                        <tr key={quotation.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {quotation.quotation_number}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {quotation.subject}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(quotation.issue_date)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {formatCurrency(quotation.total_amount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getQuotationStatusColor(quotation.status)}`}>
                                                                    {quotation.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <button className="text-blue-600 hover:text-blue-900">
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button className="text-gray-600 hover:text-gray-900">
                                                                        <Download className="w-4 h-4" />
                                                                    </button>
                                                                    <button className="text-teal-600 hover:text-teal-900">
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                            <p className="text-gray-500">No quotations found for this company.</p>
                                            <Link
                                                href={route('quotations.create', { company_id: company.id })}
                                                className="inline-flex items-center mt-4 text-teal-600 hover:text-teal-800"
                                            >
                                                Create your first quotation
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'invoice' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                                        <Link
                                            href={route('invoices.create', { company_id: company.id })}
                                            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Invoice
                                        </Link>
                                    </div>
                                    
                                    {/* Similar table structure for invoices */}
                                    {/* ... */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}