// resources/js/Pages/Companies/PaymentTable.jsx
import React, { useState } from 'react';
import { 
    CreditCard, Calendar, DollarSign, Building, 
    FileText, Landmark, MessageSquare, Receipt, Edit,
    Download, Eye, Trash2, CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const PaymentTable = ({ data }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const [expandedNote, setExpandedNote] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    
    // Format currency untuk mobile
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return t('payment_table.currency_format', { amount: 0 });
        
        if (amount >= 1000000000) return t('payment_table.currency_m', { amount: (amount / 1000000000).toFixed(1) });
        if (amount >= 1000000) return t('payment_table.currency_jt', { amount: (amount / 1000000).toFixed(1) });
        if (amount >= 1000) return t('payment_table.currency_rb', { amount: (amount / 1000).toFixed(0) });
        return t('payment_table.currency_format', { amount: amount });
    };

    const formatFullCurrency = (amount) => {
        if (!amount && amount !== 0) return t('payment_table.currency_format', { amount: 0 });
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('payment_table.not_available');
        
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getMethodBadge = (method) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
        switch (method) {
            case 'bank_transfer':
            case 'transfer':
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                        <Landmark className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t('payment_table.method_transfer')}</span>
                    </span>
                );
            case 'cash':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t('payment_table.method_cash')}</span>
                    </span>
                );
            case 'check':
                return (
                    <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
                        <CreditCard className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t('payment_table.method_check')}</span>
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {method || t('payment_table.not_available')}
                    </span>
                );
        }
    };

    // Toggle expanded note
    const toggleNote = (paymentId) => {
        setExpandedNote(expandedNote === paymentId ? null : paymentId);
    };

    // Empty State
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('payment_table.no_payments_found')}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {t('payment_table.no_payments_message')}
                </p>
                <button className="px-4 py-2 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors">
                    {t('payment_table.record_first_payment')}
                </button>
            </div>
        );
    }

    // Mobile Card View
    const MobileCardView = ({ payment }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                                {payment.invoice_number}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {formatDate(payment.date)}
                            </p>
                        </div>
                    </div>
                </div>
                {getMethodBadge(payment.method)}
            </div>
            
            <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-xs text-gray-500">{t('payment_table.invoice_amount')}</p>
                        <p 
                            className="text-xs font-medium text-gray-700 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(payment.invoice_amount))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(payment.invoice_amount)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 text-right">{t('payment_table.payment_amount')}</p>
                        <p 
                            className="text-sm font-bold text-green-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(payment.amount))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(payment.amount)}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="mb-3">
                <p className="text-xs text-gray-500">{t('payment_table.bank_method')}</p>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                        {payment.bank || t('payment_table.not_available')}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                        {payment.method_display || payment.method}
                    </span>
                </div>
            </div>
            
            {/* Notes with expand/collapse */}
            {payment.note && (
                <div className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">{t('payment_table.notes')}</p>
                    <div className="text-xs text-gray-700">
                        {expandedNote === payment.id || (payment.note && payment.note.length < 60) ? (
                            <>{payment.note}</>
                        ) : (
                            <>
                                {payment.note?.substring(0, 60)}...
                                <button 
                                    onClick={() => toggleNote(payment.id)}
                                    className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
                                >
                                    {t('payment_table.read_more')}
                                </button>
                            </>
                        )}
                        {expandedNote === payment.id && (
                            <button 
                                onClick={() => toggleNote(payment.id)}
                                className="text-blue-600 hover:text-blue-800 ml-2 font-medium text-xs"
                            >
                                {t('payment_table.show_less')}
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            <div className="flex space-x-2 pt-2 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition-colors">
                    <Receipt className="w-3 h-3" />
                    <span>{t('payment_table.receipt')}</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100 transition-colors">
                    <Download className="w-3 h-3" />
                    <span>{t('payment_table.export')}</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100 transition-colors">
                    <Edit className="w-3 h-3" />
                    <span>{t('payment_table.edit')}</span>
                </button>
            </div>
            
            {/* Created/Updated info */}
            {payment.created_by && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between">
                        <div className="text-xs text-gray-500">
                            {t('payment_table.created_by')}: {payment.created_by?.name || 'System'}
                        </div>
                        {payment.updated_by && (
                            <div className="text-xs text-gray-500">
                                {t('payment_table.updated_by')}: {payment.updated_by?.name}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative">
            {/* Tooltip */}
            {tooltip && (
                <div className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg">
                    {tooltip}
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    {t('payment_table.payment_history')}
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                    {t('payment_table.payment_count', { 
                        count: data.length,
                        plural: data.length !== 1 ? 's' : ''
                    })}
                </p>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden">
                {data.map((payment) => (
                    <MobileCardView key={payment.id} payment={payment} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto -mx-2">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-[#e2e8f0]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.invoice_number')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.date')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.amount')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.method')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.bank')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.notes')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.created_by')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t('payment_table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-blue-900">
                                            {payment.invoice_number}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {t('payment_table.invoice_amount_short')}: {formatCurrency(payment.invoice_amount)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900 whitespace-nowrap">
                                            {formatDate(payment.date)}
                                        </div>
                                        {payment.invoice_date && (
                                            <div className="text-xs text-gray-500">
                                                {t('payment_table.invoice')}: {formatDate(payment.invoice_date)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div 
                                            className="font-bold text-green-900 cursor-help"
                                            onMouseEnter={() => setTooltip(formatFullCurrency(payment.amount))}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            {formatCurrency(payment.amount)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {getMethodBadge(payment.method)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">
                                            {payment.bank || '-'}
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">
                                            {payment.method_display}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 max-w-[180px]">
                                        <div 
                                            className={`text-gray-900 ${payment.note && payment.note.length > 50 ? 'cursor-pointer' : ''}`}
                                            onClick={() => payment.note && payment.note.length > 50 && toggleNote(payment.id)}
                                            title={payment.note && payment.note.length > 50 ? t('payment_table.click_to_expand') : ""}
                                        >
                                            {expandedNote === payment.id ? 
                                                payment.note || t('payment_table.no_notes') : 
                                                (payment.note && payment.note.length > 50 ? 
                                                    `${payment.note.substring(0, 50)}...` : 
                                                    payment.note || t('payment_table.no_notes')
                                                )
                                            }
                                            {payment.note && payment.note.length > 50 && expandedNote !== payment.id && (
                                                <span className="text-blue-600 text-xs ml-1">[+]</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {payment.created_by ? (
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {payment.created_by.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {payment.created_at ? new Date(payment.created_at).toLocaleDateString('id-ID') : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex space-x-2">
                                            <button 
                                                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                                title={t('payment_table.view_receipt')}
                                            >
                                                <Receipt className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                                title={t('payment_table.export')}
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                                                title={t('payment_table.edit')}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                                title={t('payment_table.delete')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.total_payments')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.total_received')}
                        </p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, p) => sum + (p.amount || 0), 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, p) => sum + (p.amount || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.bank_transfers')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(p => p.method === 'bank_transfer' || p.method === 'transfer').length}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.average_payment')}
                        </p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(
                                data.length > 0 ? 
                                data.reduce((sum, p) => sum + (p.amount || 0), 0) / data.length : 0
                            ))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(
                                data.length > 0 ? 
                                data.reduce((sum, p) => sum + (p.amount || 0), 0) / data.length : 0
                            )}
                        </p>
                    </div>
                </div>
                
                {/* Additional Statistics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-red-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.cash_payments')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(p => p.method === 'cash').length}
                        </p>
                    </div>
                    <div className="bg-indigo-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.check_payments')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(p => p.method === 'check').length}
                        </p>
                    </div>
                    <div className="bg-pink-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.total_invoice_value')}
                        </p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, p) => sum + (p.invoice_amount || 0), 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, p) => sum + (p.invoice_amount || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-cyan-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.payment_ratio')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.length > 0 ? 
                                Math.round((data.reduce((sum, p) => sum + (p.amount || 0), 0) / 
                                data.reduce((sum, p) => sum + (p.invoice_amount || 0), 0)) * 100) || 0 : 0}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentTable;