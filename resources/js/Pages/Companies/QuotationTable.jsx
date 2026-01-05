// resources/js/Pages/Companies/QuotationTable.jsx
import React, { useState } from 'react';
import { 
    FileText, Calendar, DollarSign, CheckCircle, Clock, XCircle, 
    Download, Eye, Users, ChevronDown, ChevronUp, ExternalLink,
    FileSignature, AlertCircle, Send, RefreshCw, Filter, Edit, Trash2
} from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const QuotationTable = ({ data, groupedData = [], companyId }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const [viewMode, setViewMode] = useState('table');
    const [expandedLead, setExpandedLead] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    
    // Format currency untuk mobile friendly
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return t('quotation_table.currency_format', { amount: 0 });
        
        if (amount >= 1000000000) {
            return t('quotation_table.currency_m', { amount: (amount / 1000000000).toFixed(1) });
        }
        if (amount >= 1000000) {
            return t('quotation_table.currency_jt', { amount: (amount / 1000000).toFixed(1) });
        }
        if (amount >= 1000) {
            return t('quotation_table.currency_rb', { amount: (amount / 1000).toFixed(0) });
        }
        return t('quotation_table.currency_format', { amount: amount.toLocaleString('id-ID') });
    };

    const formatFullCurrency = (amount) => {
        if (!amount && amount !== 0) return t('quotation_table.currency_format', { amount: 0 });
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('quotation_table.not_available');
        
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
        switch (status?.toLowerCase()) {
            case 'accepted':
            case 'approved':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('quotation_table.status_accepted')}
                    </span>
                );
            case 'sent':
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                        <Send className="w-3 h-3 mr-1" />
                        {t('quotation_table.status_sent')}
                    </span>
                );
            case 'pending':
            case 'draft':
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {status === 'draft' ? t('quotation_table.status_draft') : t('quotation_table.status_pending')}
                    </span>
                );
            case 'rejected':
            case 'cancelled':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800`}>
                        <XCircle className="w-3 h-3 mr-1" />
                        {status === 'rejected' ? t('quotation_table.status_rejected') : t('quotation_table.status_cancelled')}
                    </span>
                );
            case 'expired':
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {t('quotation_table.status_expired')}
                    </span>
                );
            case 'revised':
                return (
                    <span className={`${baseClasses} bg-orange-100 text-orange-800`}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        {t('quotation_table.status_revised')}
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {status || t('quotation_table.status_unknown')}
                    </span>
                );
        }
    };

    const TruncatedText = ({ text, maxLength = 30, className = "" }) => {
        if (!text) return <span className={className}>{t('quotation_table.not_available')}</span>;
        
        if (text.length <= maxLength) {
            return <span className={className}>{text}</span>;
        }
        
        return (
            <span 
                className={`${className} cursor-help truncate`}
                onMouseEnter={() => setTooltip(text)}
                onMouseLeave={() => setTooltip(null)}
                title={text}
            >
                {text.substring(0, maxLength)}...
            </span>
        );
    };

    const toggleLead = (leadId) => {
        setExpandedLead(expandedLead === leadId ? null : leadId);
    };

    // Handle delete quotation
    const handleDelete = async (id, quotationNumber) => {
        if (!window.confirm(t('quotation_table.confirm_delete', { number: quotationNumber }))) {
            return;
        }
        
        setDeletingId(id);
        
        try {
            const response = await router.delete(route('quotation.destroy', id));
            
            if (response.ok) {
                // Refresh data setelah delete berhasil
                window.location.reload();
            } else {
                throw new Error(t('quotation_table.delete_failed'));
            }
        } catch (error) {
            console.error('Error deleting quotation:', error);
            alert(t('quotation_table.delete_error'));
            setDeletingId(null);
        }
    };

    // Mobile Card View
    const MobileCardView = ({ quotation }) => {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">
                                    {quotation.quotation_number}
                                </h3>
                                {quotation.lead?.company_name && (
                                    <p className="text-xs text-gray-500">
                                        {t('quotation_table.lead')}: {quotation.lead.company_name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-600">
                            <TruncatedText text={quotation.subject} maxLength={40} />
                        </p>
                    </div>
                    {getStatusBadge(quotation.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <p className="text-xs text-gray-500">{t('quotation_table.date')}</p>
                        <p className="text-sm font-medium text-gray-900">
                            {formatDate(quotation.date)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t('quotation_table.amount')}</p>
                        <p 
                            className="text-sm font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(quotation.total))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(quotation.total)}
                        </p>
                    </div>
                </div>
                
                <div className="flex space-x-2">
                    <Link 
                        href={route('quotation.edit', quotation.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
                    >
                        <Edit className="w-4 h-4" />
                        <span>{t('quotation_table.edit')}</span>
                    </Link>
                    <button 
                        onClick={() => handleDelete(quotation.id, quotation.quotation_number)}
                        disabled={deletingId === quotation.id}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>{deletingId === quotation.id ? t('quotation_table.deleting') : t('quotation_table.delete')}</span>
                    </button>
                </div>
            </div>
        );
    };

    // Empty State (TANPA CREATE BUTTON)
    const EmptyState = () => (
        <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('quotation_table.no_quotations_found')}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
                {t('quotation_table.no_quotations_message')}
            </p>
        </div>
    );

    return (
        <div>
            {tooltip && (
                <div className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg">
                    {tooltip}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                        {t('quotation_table.quotation_list')}
                    </h2>
                    <p className="text-sm md:text-base text-gray-600">
                        {t('quotation_table.quotation_count', { 
                            count: data.length,
                            leadCount: groupedData.length,
                            pluralQuotation: data.length !== 1 ? 's' : '',
                            pluralLead: groupedData.length > 1 ? 's' : ''
                        })}
                    </p>
                </div>
                
                {/* Hanya View Toggle, TANPA Create Button */}
                {groupedData.length > 0 && data.length > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 hidden sm:block">
                            {t('quotation_table.view')}:
                        </span>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 text-sm flex items-center space-x-1 ${viewMode === 'table' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                            >
                                <FileText className="w-3 h-3" />
                                <span>{t('quotation_table.view_all')}</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('grouped')}
                                className={`px-3 py-1 text-sm flex items-center space-x-1 ${viewMode === 'grouped' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                            >
                                <Users className="w-3 h-3" />
                                <span>{t('quotation_table.view_by_lead')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {data.length === 0 && <EmptyState />}

            {/* Mobile View */}
            <div className="sm:hidden">
                {data.length > 0 && (
                    <>
                        {viewMode === 'grouped' && groupedData.length > 0 ? (
                            // Grouped Mobile View
                            <div className="space-y-3">
                                {groupedData.map((group) => (
                                    <div key={group.lead_id} className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden">
                                        {/* Group Header */}
                                        <div 
                                            className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                            onClick={() => toggleLead(group.lead_id)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <Users className="w-5 h-5 text-gray-600" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {group.lead_name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {t('quotation_table.quotation_count_simple', { 
                                                                count: group.count,
                                                                plural: group.count > 1 ? 's' : ''
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(group.latest_status)}
                                                    {expandedLead === group.lead_id ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Content */}
                                        {expandedLead === group.lead_id && (
                                            <div className="border-t border-gray-200">
                                                {group.quotations.map((quotation, index) => (
                                                    <div 
                                                        key={quotation.id} 
                                                        className={`p-4 hover:bg-gray-50 ${index !== group.quotations.length - 1 ? 'border-b border-gray-100' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                                    <h4 className="font-medium text-gray-900">
                                                                        {quotation.quotation_number}
                                                                    </h4>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {formatDate(quotation.date)}
                                                                </p>
                                                            </div>
                                                            {getStatusBadge(quotation.status)}
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center mt-3">
                                                            <div>
                                                                <p className="text-xs text-gray-500">{t('quotation_table.subject')}</p>
                                                                <p className="text-sm text-gray-900">
                                                                    <TruncatedText text={quotation.subject} maxLength={30} />
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500">{t('quotation_table.total')}</p>
                                                                <p className="text-sm font-bold text-gray-900">
                                                                    {formatCurrency(quotation.total)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex space-x-2 mt-3">
                                                            <Link 
                                                                href={route('quotation.edit', quotation.id)}
                                                                className="flex-1 text-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded text-xs hover:bg-yellow-100"
                                                            >
                                                                {t('quotation_table.edit')}
                                                            </Link>
                                                            <button 
                                                                onClick={() => handleDelete(quotation.id, quotation.quotation_number)}
                                                                className="flex-1 text-center px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100"
                                                            >
                                                                {t('quotation_table.delete')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Individual Mobile View
                            <div className="space-y-3">
                                {data.map((quotation) => (
                                    <MobileCardView key={quotation.id} quotation={quotation} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                {data.length > 0 && (
                    <>
                        {viewMode === 'grouped' && groupedData.length > 0 ? (
                            // Grouped Desktop View
                            <div className="space-y-4">
                                {groupedData.map((group) => (
                                    <div key={group.lead_id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Group Header */}
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <Users className="w-5 h-5 text-gray-600" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {group.lead_name}
                                                        </h3>
                                                        <div className="flex items-center space-x-4 mt-1">
                                                            <span className="text-sm text-gray-600">
                                                                {t('quotation_table.quotation_count_simple', { 
                                                                    count: group.count,
                                                                    plural: group.count > 1 ? 's' : ''
                                                                })}
                                                            </span>
                                                            <span className="text-sm text-gray-600">•</span>
                                                            <span 
                                                                className="text-sm font-medium text-gray-900 cursor-help"
                                                                onMouseEnter={() => setTooltip(formatFullCurrency(group.total_value))}
                                                                onMouseLeave={() => setTooltip(null)}
                                                            >
                                                                {formatCurrency(group.total_value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    {getStatusBadge(group.latest_status)}
                                                    <button 
                                                        onClick={() => toggleLead(group.lead_id)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        {expandedLead === group.lead_id ? (
                                                            <ChevronUp className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Group Content */}
                                        {expandedLead === group.lead_id && (
                                            <div className="bg-white">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                                {t('quotation_table.quotation_number')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                                {t('quotation_table.date')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                                {t('quotation_table.subject')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                                {t('quotation_table.amount')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                                {t('quotation_table.status')}
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                                {t('quotation_table.actions')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {group.quotations.map((quotation) => (
                                                            <tr key={quotation.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="font-medium text-gray-900">
                                                                        {quotation.quotation_number}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-gray-900">
                                                                        {formatDate(quotation.date)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <TruncatedText 
                                                                        text={quotation.subject} 
                                                                        maxLength={50}
                                                                        className="text-gray-900"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div 
                                                                        className="font-semibold text-gray-900 cursor-help"
                                                                        onMouseEnter={() => setTooltip(formatFullCurrency(quotation.total))}
                                                                        onMouseLeave={() => setTooltip(null)}
                                                                    >
                                                                        {formatCurrency(quotation.total)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    {getStatusBadge(quotation.status)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex space-x-3">
                                                                        <Link 
                                                                            href={route('quotation.edit', quotation.id)}
                                                                            className="text-yellow-600 hover:text-yellow-900"
                                                                        >
                                                                            {t('quotation_table.edit')}
                                                                        </Link>
                                                                        <button 
                                                                            onClick={() => handleDelete(quotation.id, quotation.quotation_number)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                            disabled={deletingId === quotation.id}
                                                                        >
                                                                            {deletingId === quotation.id ? t('quotation_table.deleting') : t('quotation_table.delete')}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Individual Desktop Table View
                            <div className="overflow-x-auto -mx-2">
                                <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
                                    <thead className="bg-[#e2e8f0]">
                                        <tr>
                                            <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    {t('quotation_table.quotation_number')}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    {t('quotation_table.date')}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                {t('quotation_table.subject')}
                                            </th>
                                            <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                {t('quotation_table.lead')}
                                            </th>
                                            <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                    {t('quotation_table.amount')}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                {t('quotation_table.status')}
                                            </th>
                                            <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                {t('quotation_table.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.map((quotation) => (
                                            <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm md:text-base font-medium text-gray-900">
                                                        {quotation.quotation_number}
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm md:text-base text-gray-900">
                                                        {formatDate(quotation.date)}
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="max-w-[200px] lg:max-w-[300px]">
                                                        <TruncatedText 
                                                            text={quotation.subject} 
                                                            maxLength={50}
                                                            className="text-sm md:text-base text-gray-900"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="max-w-[150px]">
                                                        <TruncatedText 
                                                            text={quotation.lead?.company_name || t('quotation_table.not_available')} 
                                                            maxLength={25}
                                                            className="text-sm md:text-base text-gray-900"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                    <div 
                                                        className="text-sm md:text-base font-semibold text-gray-900 cursor-help"
                                                        onMouseEnter={() => setTooltip(formatFullCurrency(quotation.total))}
                                                        onMouseLeave={() => setTooltip(null)}
                                                    >
                                                        {formatCurrency(quotation.total)}
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(quotation.status)}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex space-x-3">
                                                        <Link 
                                                            href={route('quotation.edit', quotation.id)}
                                                            className="text-yellow-600 hover:text-yellow-900 text-sm md:text-base"
                                                        >
                                                            {t('quotation_table.edit')}
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleDelete(quotation.id, quotation.quotation_number)}
                                                            className="text-red-600 hover:text-red-900 text-sm md:text-base"
                                                            disabled={deletingId === quotation.id}
                                                        >
                                                            {deletingId === quotation.id ? t('quotation_table.deleting') : t('quotation_table.delete')}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Summary Statistics */}
            {data.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600">
                                {t('quotation_table.total_quotations')}
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-gray-900">{data.length}</p>
                        </div>
                        <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600">
                                {t('quotation_table.total_leads')}
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-gray-900">
                                {groupedData.length || t('quotation_table.not_available')}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600">
                                {t('quotation_table.total_value')}
                            </p>
                            <p 
                                className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                                onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, q) => sum + (q.total || 0), 0)))}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                {formatCurrency(data.reduce((sum, q) => sum + (q.total || 0), 0))}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600">
                                {t('quotation_table.accepted')}
                            </p>
                            <p className="text-lg md:text-2xl font-bold text-gray-900">
                                {data.filter(q => q.status === 'accepted' || q.status === 'approved').length}
                            </p>
                        </div>
                    </div>
                    
                    {/* Status Breakdown */}
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t('quotation_table.status_breakdown')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {['accepted', 'sent', 'pending', 'draft', 'rejected', 'expired'].map(status => {
                                const count = data.filter(q => q.status === status).length;
                                if (count === 0) return null;
                                
                                return (
                                    <div key={status} className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                                        {getStatusBadge(status)}
                                        <span className="text-sm text-gray-700">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationTable;