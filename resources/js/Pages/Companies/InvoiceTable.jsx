// resources/js/Pages/Companies/InvoiceTable.jsx
import React, { useState } from 'react';
import { 
    FileText, Calendar, DollarSign, CheckCircle, Clock, 
    AlertCircle, TrendingUp, Percent, Eye, Check, User,
    Download, Printer, Mail, Search, Filter, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const InvoiceTable = ({ data }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const [tooltip, setTooltip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    
    console.log('InvoiceTable data received:', data);
    
    // Filter dan sort data
    const filteredData = data
        .filter(invoice => {
            // Search filter
            const matchesSearch = searchTerm === '' || 
                invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.contact_person?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.quotation?.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
            if (sortBy === 'amount') {
                return sortOrder === 'desc' ? 
                    (b.invoice_amount || 0) - (a.invoice_amount || 0) : 
                    (a.invoice_amount || 0) - (b.invoice_amount || 0);
            }
            if (sortBy === 'due') {
                return sortOrder === 'desc' ? 
                    (b.amount_due || 0) - (a.amount_due || 0) : 
                    (a.amount_due || 0) - (b.amount_due || 0);
            }
            return 0;
        });
    
    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return t('invoice_table.currency_format', { amount: 0 });
        
        if (amount >= 1000000000) return t('invoice_table.currency_m', { amount: (amount / 1000000000).toFixed(1) });
        if (amount >= 1000000) return t('invoice_table.currency_jt', { amount: (amount / 1000000).toFixed(1) });
        if (amount >= 1000) return t('invoice_table.currency_rb', { amount: (amount / 1000).toFixed(0) });
        return t('invoice_table.currency_format', { amount: amount });
    };

    const formatFullCurrency = (amount) => {
        if (!amount && amount !== 0) return t('invoice_table.currency_format', { amount: 0 });
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('invoice_table.not_available');
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return t('invoice_table.invalid_date');
            
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return t('invoice_table.invalid_date');
        }
    };

    const formatDateWithTooltip = (dateString) => {
        if (!dateString) return { display: t('invoice_table.not_available'), tooltip: '' };
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return { display: t('invoice_table.invalid_date'), tooltip: '' };
            
            const display = formatDate(dateString);
            const tooltip = date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            return { display, tooltip };
        } catch (e) {
            return { display: t('invoice_table.invalid_date'), tooltip: '' };
        }
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
        switch (status) {
            case 'paid':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span>{t('invoice_table.status_paid')}</span>
                    </span>
                );
            case 'unpaid':
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{t('invoice_table.status_unpaid')}</span>
                    </span>
                );
            case 'invoice':
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                        <FileText className="w-3 h-3 mr-1" />
                        <span>{t('invoice_table.status_invoice_sent')}</span>
                    </span>
                );
            case 'cancelled':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800`}>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>{t('invoice_table.status_cancelled')}</span>
                    </span>
                );
            case 'draft':
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        <FileText className="w-3 h-3 mr-1" />
                        <span>{t('invoice_table.status_draft')}</span>
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {status || t('invoice_table.status_unknown')}
                    </span>
                );
        }
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const getSortIcon = (column) => {
        if (sortBy !== column) return null;
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    const handleSelectInvoice = (id) => {
        setSelectedInvoices(prev => 
            prev.includes(id) 
                ? prev.filter(invoiceId => invoiceId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedInvoices.length === filteredData.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(filteredData.map(invoice => invoice.id));
        }
    };

    // Mobile Card View
    const MobileCardView = ({ invoice }) => {
        const dateInfo = formatDateWithTooltip(invoice.date);
        
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                        />
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                                {invoice.invoice_number || t('invoice_table.no_number')}
                            </h3>
                            <p 
                                className="text-xs text-gray-500 cursor-help"
                                onMouseEnter={() => dateInfo.tooltip && setTooltip(dateInfo.tooltip)}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                {dateInfo.display}
                            </p>
                        </div>
                    </div>
                    {getStatusBadge(invoice.status)}
                </div>
                
                <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                            {invoice.contact_person?.name || t('invoice_table.no_contact_person')}
                        </span>
                    </div>
                    
                    {invoice.quotation && (
                        <div className="text-xs text-gray-500">
                            {t('invoice_table.quotation_label')}: {invoice.quotation.quotation_number}
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <p className="text-xs text-gray-500">{t('invoice_table.amount')}</p>
                        <p 
                            className="text-sm font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(invoice.invoice_amount))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(invoice.invoice_amount)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t('invoice_table.due')}</p>
                        <p 
                            className="text-sm font-bold text-red-600 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(invoice.amount_due))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(invoice.amount_due)}
                        </p>
                    </div>
                </div>
                
                <div className="flex justify-between">
                    <button className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100">
                        <Eye className="w-3 h-3" />
                        <span>{t('invoice_table.view')}</span>
                    </button>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-700 rounded text-xs hover:bg-gray-100">
                        <Download className="w-3 h-3" />
                        <span>{t('invoice_table.download')}</span>
                    </button>
                    <button className={`flex items-center space-x-1 px-3 py-1 rounded text-xs ${
                        invoice.status !== 'paid' 
                            ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-500'
                    }`}>
                        <Check className="w-3 h-3" />
                        <span>{invoice.status !== 'paid' ? t('invoice_table.mark_paid') : t('invoice_table.paid')}</span>
                    </button>
                </div>
            </div>
        );
    };

    // Empty State
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('invoice_table.no_invoices_found')}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {t('invoice_table.no_invoices_message')}
                </p>
                <button className="px-4 py-2 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors">
                    {t('invoice_table.create_first_invoice')}
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Tooltip */}
            {tooltip && (
                <div className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none">
                    {tooltip}
                </div>
            )}

            {/* Header with Stats */}
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    {t('invoice_table.invoice_list')}
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                    {t('invoice_table.invoice_count', {
                        count: data.length,
                        plural: data.length !== 1 ? 's' : '',
                        filteredCount: filteredData.length,
                        pluralFiltered: filteredData.length !== 1 ? 'es' : ''
                    })}
                </p>
            </div>

            {/* Filters and Actions */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('invoice_table.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="w-full sm:w-48">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">{t('invoice_table.all_status')}</option>
                                <option value="paid">{t('invoice_table.status_paid')}</option>
                                <option value="unpaid">{t('invoice_table.status_unpaid')}</option>
                                <option value="invoice">{t('invoice_table.status_invoice_sent')}</option>
                                <option value="draft">{t('invoice_table.status_draft')}</option>
                                <option value="cancelled">{t('invoice_table.status_cancelled')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                {/* Bulk Actions */}
                {selectedInvoices.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">
                                    {t('invoice_table.selected_count', {
                                        count: selectedInvoices.length,
                                        plural: selectedInvoices.length !== 1 ? 's' : ''
                                    })}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded text-sm hover:bg-blue-50">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    {t('invoice_table.send_email')}
                                </button>
                                <button className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded text-sm hover:bg-blue-50">
                                    <Download className="w-4 h-4 inline mr-1" />
                                    {t('invoice_table.download_selected')}
                                </button>
                                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                                    {t('invoice_table.mark_as_paid')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile View */}
            <div className="sm:hidden space-y-3">
                {filteredData.map((invoice) => (
                    <MobileCardView key={invoice.id} invoice={invoice} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f8fafc]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    <input
                                        type="checkbox"
                                        checked={selectedInvoices.length === filteredData.length && filteredData.length > 0}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {t('invoice_table.date')} {getSortIcon('date')}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    {t('invoice_table.invoice_number')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    {t('invoice_table.contact_person')}
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        {t('invoice_table.amount')} {getSortIcon('amount')}
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('due')}
                                >
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {t('invoice_table.due')} {getSortIcon('due')}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    {t('invoice_table.status')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    {t('invoice_table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map((invoice) => {
                                const dateInfo = formatDateWithTooltip(invoice.date);
                                
                                return (
                                    <tr 
                                        key={invoice.id} 
                                        className={`hover:bg-gray-50 ${selectedInvoices.includes(invoice.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedInvoices.includes(invoice.id)}
                                                onChange={() => handleSelectInvoice(invoice.id)}
                                                className="h-4 w-4 text-blue-600 rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div 
                                                className="text-gray-900 cursor-help"
                                                onMouseEnter={() => dateInfo.tooltip && setTooltip(dateInfo.tooltip)}
                                                onMouseLeave={() => setTooltip(null)}
                                            >
                                                {dateInfo.display}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">
                                                {invoice.invoice_number || t('invoice_table.not_available')}
                                            </div>
                                            {invoice.quotation && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {t('invoice_table.quotation_short')}: {invoice.quotation.quotation_number}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {invoice.contact_person?.name || t('invoice_table.not_available')}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {invoice.contact_person?.position || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div 
                                                className="font-semibold text-gray-900 cursor-help"
                                                onMouseEnter={() => setTooltip(formatFullCurrency(invoice.invoice_amount))}
                                                onMouseLeave={() => setTooltip(null)}
                                            >
                                                {formatCurrency(invoice.invoice_amount)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div 
                                                className="font-bold text-red-600 cursor-help"
                                                onMouseEnter={() => setTooltip(formatFullCurrency(invoice.amount_due))}
                                                onMouseLeave={() => setTooltip(null)}
                                            >
                                                {formatCurrency(invoice.amount_due)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                <button 
                                                    title={t('invoice_table.view_invoice')}
                                                    className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title={t('invoice_table.download_pdf')}
                                                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title={t('invoice_table.print')}
                                                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title={t('invoice_table.send_email')}
                                                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {t('invoice_table.invoice_summary')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FileText className="w-5 h-5 text-blue-600 mr-2" />
                            <p className="text-sm text-gray-600">{t('invoice_table.total_invoices')}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{data.length}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('invoice_table.match_filter', { count: filteredData.length })}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                            <p className="text-sm text-gray-600">{t('invoice_table.total_amount')}</p>
                        </div>
                        <p 
                            className="text-2xl font-bold text-gray-900 mt-2 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('invoice_table.all_invoices')}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            <p className="text-sm text-gray-600">{t('invoice_table.total_due')}</p>
                        </div>
                        <p 
                            className="text-2xl font-bold text-red-600 mt-2 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, i) => sum + (i.amount_due || 0), 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, i) => sum + (i.amount_due || 0), 0))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('invoice_table.unpaid_balance')}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <Percent className="w-5 h-5 text-purple-600 mr-2" />
                            <p className="text-sm text-gray-600">{t('invoice_table.tax_summary')}</p>
                        </div>
                        <p 
                            className="text-2xl font-bold text-gray-900 mt-2 cursor-help"
                            onMouseEnter={() => {
                                const totalPpn = data.reduce((sum, i) => sum + (i.ppn || 0), 0);
                                const totalPph = data.reduce((sum, i) => sum + (i.pph || 0), 0);
                                setTooltip(`${t('invoice_table.ppn')}: ${formatFullCurrency(totalPpn)}\n${t('invoice_table.pph')}: ${formatFullCurrency(totalPph)}`);
                            }}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, i) => sum + (i.ppn || 0), 0))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('invoice_table.total_ppn')}</p>
                    </div>
                </div>
                
                {/* Additional Stats */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.paid_invoices')}</p>
                        <p className="text-xl font-bold text-green-600">
                            {data.filter(i => i.status === 'paid').length}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.unpaid_invoices')}</p>
                        <p className="text-xl font-bold text-yellow-600">
                            {data.filter(i => i.status === 'unpaid').length}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.average_invoice')}</p>
                        <p 
                            className="text-xl font-bold text-blue-600 cursor-help"
                            onMouseEnter={() => {
                                const avg = data.length > 0 
                                    ? data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0) / data.length 
                                    : 0;
                                setTooltip(formatFullCurrency(avg));
                            }}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.length > 0 
                                ? data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0) / data.length 
                                : 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <details>
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                            {t('invoice_table.debug_info')}
                        </summary>
                        <div className="mt-2 text-xs text-gray-600 space-y-2">
                            <div>{t('invoice_table.total_from_api', { count: data.length })}</div>
                            <div>{t('invoice_table.filtered_invoices', { count: filteredData.length })}</div>
                            <div>{t('invoice_table.sample_data')}</div>
                            <pre className="bg-white p-2 rounded border overflow-auto max-h-40">
                                {JSON.stringify(data[0] || {}, null, 2)}
                            </pre>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default InvoiceTable;