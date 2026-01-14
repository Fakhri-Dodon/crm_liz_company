// resources/js/Pages/Companies/PaymentTable.jsx
import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { 
    CreditCard, Calendar, DollarSign, Building, 
    FileText, Landmark, MessageSquare, Receipt, Edit,
    Download, Eye, Trash2, CheckCircle, X, Save, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentTable = ({ data, companyId, showInvoiceAmount = false }) => {
    const { t } = useTranslation();
    const { props } = usePage();
    
    const [expandedNote, setExpandedNote] = useState(null);
    const [tooltip, setTooltip] = useState({ text: '', x: 0, y: 0 });
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        method: 'transfer',
        date: '',
        bank: '',
        note: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Debug effect
    useEffect(() => {
        console.log('PaymentTable props:', { 
            companyId, 
            dataLength: data?.length || 0,
            hasCompanyId: !!companyId 
        });
    }, [companyId, data]);

    // Format currency untuk mobile - FIXED
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || amount === '' || isNaN(amount)) {
            return t('payment_table.currency_format', { amount: 0 });
        }
        
        const numAmount = Number(amount);
        
        if (numAmount >= 1000000000) {
            return t('payment_table.currency_m', { amount: (numAmount / 1000000000).toFixed(1) });
        }
        if (numAmount >= 1000000) {
            return t('payment_table.currency_jt', { amount: (numAmount / 1000000).toFixed(1) });
        }
        if (numAmount >= 1000) {
            return t('payment_table.currency_rb', { amount: (numAmount / 1000).toFixed(0) });
        }
        return t('payment_table.currency_format', { amount: numAmount });
    };

    const formatFullCurrency = (amount) => {
        if (amount === null || amount === undefined || amount === '' || isNaN(amount)) {
            return t('payment_table.currency_format', { amount: 0 });
        }
        
        const numAmount = Number(amount);
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('payment_table.not_available');
        
        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return t('payment_table.invalid_date');
            }
            
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return t('payment_table.invalid_date');
        }
    };

    // Get invoice number - safely handle different data structures
    const getInvoiceNumber = (payment) => {
        // Check multiple possible properties
        if (payment.invoice_number) return payment.invoice_number;
        if (payment.invoice?.invoice_number) return payment.invoice.invoice_number;
        if (payment.invoice_id) return `INV-${payment.invoice_id.substring(0, 8)}`;
        return t('payment_table.no_invoice');
    };

    // Get invoice amount - safely handle different data structures
    const getInvoiceAmount = (payment) => {
        if (payment.invoice_amount !== undefined && payment.invoice_amount !== null) {
            return Number(payment.invoice_amount);
        }
        if (payment.invoice?.amount_due !== undefined && payment.invoice.amount_due !== null) {
            return Number(payment.invoice.amount_due);
        }
        if (payment.invoice?.total !== undefined && payment.invoice.total !== null) {
            return Number(payment.invoice.total);
        }
        return 0;
    };

    // Get payment amount
    const getPaymentAmount = (payment) => {
        if (payment.amount !== undefined && payment.amount !== null) {
            return Number(payment.amount);
        }
        return 0;
    };

    // Get method badge with proper handling
    const getMethodBadge = (method) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
        const methodStr = (method || '').toString().toLowerCase();
        
        switch (methodStr) {
            case 'bank_transfer':
            case 'transfer':
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                        <Landmark className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t('payment_table.method_transfer')}</span>
                        <span className="sm:hidden">{t('payment_table.method_transfer_short')}</span>
                    </span>
                );
            case 'cash':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t('payment_table.method_cash')}</span>
                        <span className="sm:hidden">{t('payment_table.method_cash_short')}</span>
                    </span>
                );
            case 'check':
                return (
                    <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
                        <CreditCard className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t('payment_table.method_check')}</span>
                        <span className="sm:hidden">{t('payment_table.method_check_short')}</span>
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {methodStr || t('payment_table.not_available')}
                    </span>
                );
        }
    };

    // Toggle expanded note
    const toggleNote = (paymentId) => {
        setExpandedNote(expandedNote === paymentId ? null : paymentId);
    };

    // Handle tooltip
    const handleTooltip = (text, event) => {
        setTooltip({
            text,
            x: event.clientX + 10,
            y: event.clientY + 10
        });
    };

    const hideTooltip = () => {
        setTooltip({ text: '', x: 0, y: 0 });
    };

    // Action Handlers - HANYA EDIT DAN DELETE
    const openEditModal = (payment) => {
        if (!companyId) {
            console.error('Company ID is required for edit');
            return;
        }
        
        setSelectedPayment(payment);
        setFormData({
            amount: payment.amount,
            method: payment.method,
            date: payment.date || new Date().toISOString().split('T')[0],
            bank: payment.bank || '',
            note: payment.note || '',
        });
        setErrors({});
        setShowEditModal(true);
    };

    const openDeleteModal = (payment) => {
        if (!companyId) {
            console.error('Company ID is required for delete');
            return;
        }
        
        setSelectedPayment(payment);
        setShowDeleteModal(true);
    };

    const handleEditPayment = () => {
        if (!selectedPayment || !companyId) {
            console.error('Company ID or selected payment is missing');
            return;
        }

        setLoading(true);
        setErrors({});
        
        router.put(route('companies.payments.update', { 
            company: companyId, 
            payment: selectedPayment.id 
        }), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setShowEditModal(false);
                setSelectedPayment(null);
                setFormData({
                    amount: '',
                    method: 'transfer',
                    date: '',
                    bank: '',
                    note: '',
                });
                setLoading(false);
            },
            onError: (errors) => {
                console.error('Error updating payment:', errors);
                setErrors(errors);
                setLoading(false);
            }
        });
    };

    const handleDeletePayment = () => {
        if (!selectedPayment || !companyId) {
            console.error('Company ID or selected payment is missing');
            return;
        }

        setLoading(true);
        
        router.delete(route('companies.payments.destroy', { 
            company: companyId, 
            payment: selectedPayment.id 
        }), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedPayment(null);
                setLoading(false);
            },
            onError: (errors) => {
                console.error('Error deleting payment:', errors);
                setLoading(false);
            }
        });
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
            </div>
        );
    }

    // ExpandableAmount component for long currency values
    const ExpandableAmount = ({ amount, className = "" }) => {
        const { t } = useTranslation();
        const [expanded, setExpanded] = useState(false);
        const formatted = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);
        // Show expand/collapse if formatted is long
        const isLong = formatted.length > 12;
        if (!isLong) return <span className={className}>{formatted}</span>;
        return (
            <span className={className}>
                {expanded ? formatted : formatted.slice(0, 10) + '...'}
                <button
                    type="button"
                    className="ml-1 text-blue-600 underline text-xs focus:outline-none"
                    onClick={() => setExpanded(e => !e)}
                >
                    {expanded ? t('payment_table.collapse') : t('payment_table.expand')}
                </button>
            </span>
        );
    };

    // Mobile Card View - HANYA EDIT DAN DELETE
    const MobileCardView = ({ payment }) => {
        const invoiceNumber = getInvoiceNumber(payment);
        const invoiceAmount = getInvoiceAmount(payment);
        const paymentAmount = getPaymentAmount(payment);
        const paymentMethod = payment.method || payment.payment_method || 'unknown';
        const bank = payment.bank || payment.bank_name || t('payment_table.not_available');
        const note = payment.note || payment.notes || payment.description || '';
        
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">
                                    {invoiceNumber}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {formatDate(payment.date)}
                                </p>
                            </div>
                        </div>
                    </div>
                    {getMethodBadge(paymentMethod)}
                </div>
                
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                        {showInvoiceAmount && (
                            <div>
                                <p className="text-xs text-gray-500">{t('payment_table.invoice_amount')}</p>
                                <p 
                                    className="text-xs font-medium text-gray-700 cursor-help"
                                    onMouseEnter={(e) => handleTooltip(formatFullCurrency(invoiceAmount), e)}
                                    onMouseLeave={hideTooltip}
                                >
                                    <ExpandableAmount amount={invoiceAmount} />
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-gray-500 text-right">{t('payment_table.payment_amount')}</p>
                            <p 
                                className="text-sm font-bold text-green-900 cursor-help"
                                onMouseEnter={(e) => handleTooltip(formatFullCurrency(paymentAmount), e)}
                                onMouseLeave={hideTooltip}
                            >
                                <ExpandableAmount amount={paymentAmount} />
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="mb-3">
                    <p className="text-xs text-gray-500">{t('payment_table.bank_method')}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                            {bank}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                            {paymentMethod}
                        </span>
                    </div>
                </div>
                
                {/* Notes with expand/collapse */}
                {note && (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">{t('payment_table.notes')}</p>
                        <div className="text-xs text-gray-700">
                            {expandedNote === payment.id || note.length < 60 ? (
                                <>{note}</>
                            ) : (
                                <>
                                    {note.substring(0, 60)}...
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
                
                {/* HANYA TOMBOL EDIT DAN DELETE */}
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                    <button 
                        onClick={() => openEditModal(payment)}
                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!companyId}
                        title={!companyId ? "Company ID missing" : "Edit Payment"}
                    >
                        <Edit className="w-3 h-3" />
                        <span>{t('payment_table.edit')}</span>
                    </button>
                    <button 
                        onClick={() => openDeleteModal(payment)}
                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-red-50 text-red-700 rounded-lg text-xs hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!companyId}
                        title={!companyId ? "Company ID missing" : "Delete Payment"}
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('payment_table.delete')}</span>
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
    };

    // Calculate statistics
    const totalPayments = data.length;
    const totalReceived = data.reduce((sum, p) => sum + getPaymentAmount(p), 0);
    const totalInvoiceValue = data.reduce((sum, p) => sum + getInvoiceAmount(p), 0);
    const transferCount = data.filter(p => ['transfer', 'bank_transfer'].includes((p.method || '').toLowerCase())).length;
    const cashCount = data.filter(p => (p.method || '').toLowerCase() === 'cash').length;
    const checkCount = data.filter(p => (p.method || '').toLowerCase() === 'check').length;
    const averagePayment = totalPayments > 0 ? totalReceived / totalPayments : 0;
    const paymentRatio = totalInvoiceValue > 0 ? (totalReceived / totalInvoiceValue) * 100 : 0;

    return (
        <div className="relative">
            {/* Tooltip */}
            {tooltip.text && (
                <div 
                    className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translateY(-100%)'
                    }}
                >
                    {tooltip.text}
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    {t('payment_table.payment_history')}
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                    {t('payment_table.payment_count', { 
                        count: totalPayments,
                        plural: totalPayments !== 1 ? 's' : ''
                    })}
                </p>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden">
                {data.map((payment) => (
                    <MobileCardView key={payment.id} payment={payment} />
                ))}
            </div>

            {/* Desktop Table View - HANYA EDIT DAN DELETE */}
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
                            {data.map((payment) => {
                                const invoiceNumber = getInvoiceNumber(payment);
                                const invoiceAmount = getInvoiceAmount(payment);
                                const paymentAmount = getPaymentAmount(payment);
                                const paymentMethod = payment.method || payment.payment_method || 'unknown';
                                const bank = payment.bank || payment.bank_name || '-';
                                const note = payment.note || payment.notes || payment.description || '';
                                
                                return (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-blue-900">
                                                {invoiceNumber}
                                            </div>
                                            {showInvoiceAmount && (
                                                <div className="text-xs text-gray-500">
                                                    {t('payment_table.invoice_amount_short')}: <ExpandableAmount amount={invoiceAmount} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 whitespace-nowrap">
                                                {formatDate(payment.date)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div 
                                                className="font-bold text-green-900 cursor-help"
                                                onMouseEnter={(e) => handleTooltip(formatFullCurrency(paymentAmount), e)}
                                                onMouseLeave={hideTooltip}
                                            >
                                                <ExpandableAmount amount={paymentAmount} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getMethodBadge(paymentMethod)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">
                                                {bank}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize">
                                                {paymentMethod}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-[180px]">
                                            <div 
                                                className={`text-gray-900 ${note.length > 50 ? 'cursor-pointer' : ''}`}
                                                onClick={() => note.length > 50 && toggleNote(payment.id)}
                                                title={note.length > 50 ? t('payment_table.click_to_expand') : ""}
                                            >
                                                {expandedNote === payment.id ? 
                                                    note || t('payment_table.no_notes') : 
                                                    (note.length > 50 ? 
                                                        `${note.substring(0, 50)}...` : 
                                                        note || t('payment_table.no_notes')
                                                    )
                                                }
                                                {note.length > 50 && expandedNote !== payment.id && (
                                                    <span className="text-blue-600 text-xs ml-1">[+]</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {payment.created_by ? (
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {payment.created_by.name || payment.created_by}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {payment.created_at ? formatDate(payment.created_at) : ''}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        {/* HANYA TOMBOL EDIT DAN DELETE */}
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => openEditModal(payment)}
                                                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={!companyId ? "Company ID missing" : t('payment_table.edit')}
                                                    disabled={!companyId}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(payment)}
                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={!companyId ? "Company ID missing" : t('payment_table.delete')}
                                                    disabled={!companyId}
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            {/* Summary Statistics */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.total_payments')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{totalPayments}</p>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.total_received')}
                        </p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={(e) => handleTooltip(formatFullCurrency(totalReceived), e)}
                            onMouseLeave={hideTooltip}
                        >
                            <ExpandableAmount amount={totalReceived} />
                        </p>
                    </div>
                    <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.bank_transfers')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {transferCount}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.average_payment')}
                        </p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={(e) => handleTooltip(formatFullCurrency(averagePayment), e)}
                            onMouseLeave={hideTooltip}
                        >
                            <ExpandableAmount amount={averagePayment} />
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
                            {cashCount}
                        </p>
                    </div>
                    <div className="bg-indigo-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.check_payments')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {checkCount}
                        </p>
                    </div>
                    <div className="bg-pink-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.total_invoice_value')}
                        </p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={(e) => handleTooltip(formatFullCurrency(totalInvoiceValue), e)}
                            onMouseLeave={hideTooltip}
                        >
                            <ExpandableAmount amount={totalInvoiceValue} />
                        </p>
                    </div>
                    <div className="bg-cyan-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">
                            {t('payment_table.payment_ratio')}
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {Math.round(paymentRatio)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Payment Modal */}
            {showEditModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t('payment_table.edit_payment')}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedPayment(null);
                                    setErrors({});
                                }}
                                className="text-gray-400 hover:text-gray-500"
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm font-medium text-blue-900">
                                    {getInvoiceNumber(selectedPayment)}
                                </div>
                                <div className="text-xs text-blue-700">
                                    {formatDate(selectedPayment.date)} • {formatCurrency(selectedPayment.amount)}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('payment_table.amount')} *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                            Rp
                                        </span>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className={`w-full pl-10 pr-3 py-2 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                            placeholder="0"
                                            required
                                            disabled={loading}
                                        />
                                        {errors.amount && (
                                            <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('payment_table.method')} *
                                    </label>
                                    <select
                                        value={formData.method}
                                        onChange={(e) => setFormData({...formData, method: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.method ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        disabled={loading}
                                    >
                                        <option value="transfer">{t('payment_table.method_transfer')}</option>
                                        <option value="cash">{t('payment_table.method_cash')}</option>
                                        <option value="check">{t('payment_table.method_check')}</option>
                                    </select>
                                    {errors.method && (
                                        <p className="mt-1 text-xs text-red-600">{errors.method}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('payment_table.date')} *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.date ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        required
                                        disabled={loading}
                                    />
                                    {errors.date && (
                                        <p className="mt-1 text-xs text-red-600">{errors.date}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('payment_table.bank')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bank}
                                        onChange={(e) => setFormData({...formData, bank: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.bank ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        placeholder="e.g., BCA, Mandiri"
                                        disabled={loading}
                                    />
                                    {errors.bank && (
                                        <p className="mt-1 text-xs text-red-600">{errors.bank}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('payment_table.notes')}
                                    </label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.note ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                        rows="3"
                                        placeholder={t('payment_table.notes_placeholder')}
                                        disabled={loading}
                                    />
                                    {errors.note && (
                                        <p className="mt-1 text-xs text-red-600">{errors.note}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 p-6 border-t">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedPayment(null);
                                    setErrors({});
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                {t('payment_table.cancel')}
                            </button>
                            <button
                                onClick={handleEditPayment}
                                disabled={loading || !companyId}
                                className="px-4 py-2 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('payment_table.saving')}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {t('payment_table.update_payment')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {t('payment_table.delete_confirmation')}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    {t('payment_table.delete_message')}
                                </p>
                                <div className="bg-gray-50 p-3 rounded mb-4">
                                    <p className="text-sm font-medium text-gray-900">
                                        {getInvoiceNumber(selectedPayment)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(selectedPayment.date)} • {formatCurrency(selectedPayment.amount)}
                                    </p>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ {t('payment_table.delete_warning')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 p-6 border-t">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedPayment(null);
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                {t('payment_table.cancel')}
                            </button>
                            <button
                                onClick={handleDeletePayment}
                                disabled={loading || !companyId}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('payment_table.deleting')}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {t('payment_table.delete')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Default props
PaymentTable.defaultProps = {
    data: [],
    companyId: null,
    showInvoiceAmount: false
};

export default PaymentTable;