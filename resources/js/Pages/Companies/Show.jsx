// resources/js/Pages/Companies/Show.jsx
import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Building, 
    Phone, 
    Mail, 
    MapPin, 
    Calendar, 
    User,
    FileText,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Edit,
    ArrowLeft,
    MoreVertical,
    Download,
    Share2,
    Printer,
    Eye,
    EyeOff,
    ChevronRight,
    BarChart3,
    CreditCard,
    Briefcase
} from 'lucide-react';

const CompanyShow = ({ 
    company, 
    statistics, 
    recent_quotations, 
    recent_invoices,
    auth 
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showFinancialDetails, setShowFinancialDetails] = useState(false);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'active':
            case 'paid':
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'overdue':
            case 'expired':
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Get client type color
    const getClientTypeColor = (typeName) => {
        const colorMap = {
            'PMDN': 'bg-blue-100 text-blue-800 border-blue-200',
            'PMA': 'bg-green-100 text-green-800 border-green-200',
            'KPPA': 'bg-orange-100 text-orange-800 border-orange-200',
            'BUMN': 'bg-red-100 text-red-800 border-red-200',
        };
        return colorMap[typeName] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Calculate quotation totals
    const calculateQuotationTotals = () => {
        const acceptedQuotations = recent_quotations?.filter(q => q.status === 'accepted') || [];
        const totalAmount = acceptedQuotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
        return {
            count: acceptedQuotations.length,
            total: totalAmount,
            average: acceptedQuotations.length > 0 ? totalAmount / acceptedQuotations.length : 0
        };
    };

    // Calculate invoice totals
    const calculateInvoiceTotals = () => {
        const paidInvoices = recent_invoices?.filter(i => i.status === 'paid') || [];
        const pendingInvoices = recent_invoices?.filter(i => i.status === 'pending') || [];
        const overdueInvoices = recent_invoices?.filter(i => i.status === 'overdue') || [];
        
        const paidTotal = paidInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
        const pendingTotal = pendingInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
        const overdueTotal = overdueInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
        
        return {
            paid: { count: paidInvoices.length, total: paidTotal },
            pending: { count: pendingInvoices.length, total: pendingTotal },
            overdue: { count: overdueInvoices.length, total: overdueTotal },
            overall: paidTotal + pendingTotal + overdueTotal
        };
    };

    const quotationTotals = calculateQuotationTotals();
    const invoiceTotals = calculateInvoiceTotals();

    // Tabs configuration
    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'invoices', label: 'Invoices', icon: CreditCard },
        { id: 'activities', label: 'Activities', icon: Clock },
        { id: 'documents', label: 'Documents', icon: Briefcase },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link 
                            href={route('companies.index')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Building className="w-7 h-7 text-teal-600" />
                                {company.name}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <span className="font-medium">{company.client_code}</span>
                                • 
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Client since: {company.client_since || 'N/A'}
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.get(route('companies.edit', company.id))}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Company
                        </button>
                        
                        <div className="relative group">
                            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export Data
                                </button>
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <Printer className="w-4 h-4" />
                                    Print Details
                                </button>
                                <button 
                                    onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    {showFinancialDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {showFinancialDetails ? 'Hide Financials' : 'Show Financials'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${company.name} - Company Details`} />

            {/* Company Status Bar */}
            <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getClientTypeColor(company.client_type?.name)}`}>
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            {company.client_type?.name || 'No Type'}
                        </span>
                        
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                            company.is_active 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                            {company.is_active ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Active Client
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4" />
                                    Inactive Client
                                </>
                            )}
                        </span>
                        
                        {company.updated_at && (
                            <span className="text-sm text-gray-600">
                                Last updated: {formatDate(company.updated_at)}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(invoiceTotals.overall)}
                            </div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Company Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Navigation */}
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="border-b border-gray-200">
                            <nav className="flex overflow-x-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                                activeTab === tab.id
                                                    ? 'border-teal-500 text-teal-600 bg-teal-50'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Contact Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-gray-400" />
                                            Contact Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Contact Person</div>
                                                        <div className="text-lg font-semibold text-gray-900">{company.contact_person}</div>
                                                        <div className="text-sm text-gray-600">{company.position || 'No position specified'}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Phone Number</div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {company.phone || 'No phone number'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Email Address</div>
                                                        <div className="text-lg font-semibold text-gray-900 truncate">
                                                            {company.email || 'No email address'}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-500">Address</div>
                                                        <div className="text-gray-700 whitespace-pre-line">
                                                            {company.address || 'No address specified'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statistics Cards */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-sm font-medium text-gray-500">Total Quotations</div>
                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div className="text-3xl font-bold text-gray-900">{statistics.total_quotations}</div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="text-sm text-green-600 flex items-center gap-1">
                                                        <TrendingUp className="w-4 h-4" />
                                                        {statistics.accepted_quotations} accepted
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-sm font-medium text-gray-500">Total Invoices</div>
                                                    <CreditCard className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div className="text-3xl font-bold text-gray-900">{statistics.total_invoices}</div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="text-sm text-green-600 flex items-center gap-1">
                                                        <CheckCircle className="w-4 h-4" />
                                                        {statistics.paid_invoices} paid
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-sm font-medium text-gray-500">Conversion Rate</div>
                                                    <BarChart3 className="w-5 h-5 text-purple-500" />
                                                </div>
                                                <div className="text-3xl font-bold text-gray-900">
                                                    {statistics.total_quotations > 0 
                                                        ? `${((statistics.accepted_quotations / statistics.total_quotations) * 100).toFixed(1)}%`
                                                        : '0%'
                                                    }
                                                </div>
                                                <div className="text-sm text-gray-500 mt-2">
                                                    Quotation to Invoice
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activities - Placeholder */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                                            <div className="text-center py-8">
                                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <div className="text-gray-500">No recent activities recorded</div>
                                                <div className="text-sm text-gray-400 mt-1">
                                                    Activities will appear here
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'quotations' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Quotations</h3>
                                        <Link 
                                            href={route('companies.quotations.create', company.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            New Quotation
                                        </Link>
                                    </div>
                                    
                                    {recent_quotations && recent_quotations.length > 0 ? (
                                        <div className="space-y-3">
                                            {recent_quotations.map((quotation) => (
                                                <div key={quotation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{quotation.quotation_number}</div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                Created: {formatDate(quotation.created_at)}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-gray-900">
                                                                    {formatCurrency(quotation.total_amount)}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Valid until: {formatDate(quotation.valid_until)}
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(quotation.status)}`}>
                                                                {quotation.status?.toUpperCase()}
                                                            </span>
                                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <div className="text-gray-500 mb-2">No quotations found</div>
                                            <div className="text-sm text-gray-400">
                                                Create your first quotation for this client
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'invoices' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                                        <Link 
                                            href={route('companies.invoices.create', company.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            New Invoice
                                        </Link>
                                    </div>
                                    
                                    {recent_invoices && recent_invoices.length > 0 ? (
                                        <div className="space-y-3">
                                            {recent_invoices.map((invoice) => (
                                                <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                Issued: {formatDate(invoice.issue_date)}
                                                            </div>
                                                            {invoice.due_date && (
                                                                <div className={`text-xs mt-1 ${
                                                                    new Date(invoice.due_date) < new Date() 
                                                                        ? 'text-red-600' 
                                                                        : 'text-gray-500'
                                                                }`}>
                                                                    Due: {formatDate(invoice.due_date)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-gray-900">
                                                                    {formatCurrency(invoice.total_amount)}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Balance: {formatCurrency(invoice.balance_due)}
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                                                                {invoice.status?.toUpperCase()}
                                                            </span>
                                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <div className="text-gray-500 mb-2">No invoices found</div>
                                            <div className="text-sm text-gray-400">
                                                Create your first invoice for this client
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Add other tabs content similarly */}
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* Financial Summary (Conditional) */}
                    {showFinancialDetails && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-gray-400" />
                                Financial Summary
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-1">Accepted Quotations</div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(quotationTotals.total)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ({quotationTotals.count} quotations)
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Average: {formatCurrency(quotationTotals.average)}
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="text-sm font-medium text-gray-500 mb-1">Invoice Breakdown</div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Paid</span>
                                            <div className="text-right">
                                                <div className="font-semibold text-green-600">
                                                    {formatCurrency(invoiceTotals.paid.total)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {invoiceTotals.paid.count} invoices
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Pending</span>
                                            <div className="text-right">
                                                <div className="font-semibold text-yellow-600">
                                                    {formatCurrency(invoiceTotals.pending.total)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {invoiceTotals.pending.count} invoices
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Overdue</span>
                                            <div className="text-right">
                                                <div className="font-semibold text-red-600">
                                                    {formatCurrency(invoiceTotals.overdue.total)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {invoiceTotals.overdue.count} invoices
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link 
                                href={route('companies.quotations.create', company.id)}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="font-medium text-gray-700">Create Quotation</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                            
                            <Link 
                                href={route('companies.invoices.create', company.id)}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CreditCard className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="font-medium text-gray-700">Create Invoice</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                            
                            <button 
                                onClick={() => router.get(route('companies.edit', company.id))}
                                className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 rounded-lg">
                                        <Edit className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <span className="font-medium text-gray-700">Edit Company</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            </button>
                            
                            <button 
                                onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                                className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        {showFinancialDetails ? (
                                            <EyeOff className="w-5 h-5 text-purple-600" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-purple-600" />
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-700">
                                        {showFinancialDetails ? 'Hide Financials' : 'Show Financials'}
                                    </span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                        <div className="text-center py-8">
                            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <div className="text-gray-500">No notes added</div>
                            <div className="text-sm text-gray-400 mt-1">
                                Add notes about this client
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default CompanyShow;