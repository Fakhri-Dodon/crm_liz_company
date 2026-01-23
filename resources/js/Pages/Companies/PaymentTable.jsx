// resources/js/Pages/Companies/PaymentTable.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
    CreditCard, Search, Edit2, Trash2, CheckCircle, 
    AlertCircle, Maximize2, Minimize2, Loader, Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SubModuleTableLayout, { ExpandableTextCell, ExpandableAmountCell } from '@/Layouts/SubModuleTableLayout';

const PaymentTable = ({ data: initialData, companyId, auth_permissions }) => {
    const { t } = useTranslation();
    
    // State untuk data payments
    const [data, setData] = useState(initialData || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);
    const [expandedAmounts, setExpandedAmounts] = useState({});
    const [expandedNotes, setExpandedNotes] = useState({});
    const [selectedPayments, setSelectedPayments] = useState([]);
    const [loading, setLoading] = useState(false);

    const perms = auth_permissions || {}; 
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    // Update data ketika initialData berubah
    useEffect(() => {
        setData(initialData || []);
    }, [initialData]);

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return `Rp 0`;
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    // Format compact untuk angka besar
    const formatCompactCurrency = (amount) => {
        if (amount === null || amount === undefined) return `Rp 0`;
        
        if (amount >= 1000000000) return `Rp${(amount / 1000000000).toFixed(1)}M`;
        if (amount >= 1000000) return `Rp${(amount / 1000000).toFixed(1)}JT`;
        if (amount >= 1000) return `Rp${(amount / 1000).toFixed(0)}K`;
        
        return `Rp ${amount}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('payment_table.not_available');
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return t('payment_table.invalid_date');
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return t('payment_table.invalid_date');
        }
    };

    // Format note display
    const formatNoteDisplay = (note, id) => {
        if (!note || note === '-') return '-';
        const isExpanded = expandedNotes[id];
        
        if (isExpanded || note.length <= 25) {
            return note;
        }
        
        return `${note.substring(0, 25)}...`;
    };

    // Get invoice number
    const getInvoiceNumber = (payment) => {
        return payment.invoice?.invoice_number || payment.invoice_number || 
               (payment.invoice_id ? `INV-${payment.invoice_id.substring(0, 8)}` : t('payment_table.no_invoice'));
    };

    // Get method badge
    const getMethodBadge = (method) => {
        const methodStr = (method || '').toLowerCase();
        const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap";
        
        switch (methodStr) {
            case 'transfer':
                return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Transfer</span>;
            case 'cash':
                return <span className={`${baseClasses} bg-green-100 text-green-800`}>Cash</span>;
            case 'check':
                return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Check</span>;
            default:
                return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{methodStr || '-'}</span>;
        }
    };

    const filterData = () => {
        return data
            .filter(payment => {
                const matchesSearch = searchTerm === '' || 
                    (payment.invoice?.invoice_number && payment.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (payment.invoice_number && payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (payment.bank && payment.bank.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (payment.note && payment.note.toLowerCase().includes(searchTerm.toLowerCase()));
                
                if (methodFilter === 'all') return matchesSearch;
                
                const paymentMethod = payment.method?.toLowerCase() || '';
                return matchesSearch && paymentMethod === methodFilter;
            })
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    };

    const filteredData = filterData();

    const openEditPage = (payment) => {
        if (!payment?.id) return;
        router.visit(`/payment/${payment.id}/edit`, { preserveScroll: true });
    };

    const handleDeletePayment = async (payment) => {
        if (!payment?.id || !companyId || !window.confirm(t('payment_table.delete_confirm_message', { 
            invoiceNumber: getInvoiceNumber(payment),
            amount: formatCurrency(payment.amount)
        }))) return;
        
        setDeletingId(payment.id);
        setLoading(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await fetch(`/companies/${companyId}/payments/${payment.id}`, {
                method: 'DELETE',
                headers: { 
                    'X-CSRF-TOKEN': csrfToken, 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // Update local data
            setData(prev => prev.filter(item => item.id !== payment.id));
            setSelectedPayments(prev => prev.filter(id => id !== payment.id));
            
            // Show success message
            alert(t('payment_table.payment_deleted'));
        } catch (error) {
            console.error('Delete error:', error);
            alert(t('payment_table.delete_failed'));
        } finally {
            setDeletingId(null);
            setLoading(false);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedPayments.length === 0) {
            alert(t('payment_table.no_selection'));
            return;
        }

        const confirmMessage = t('payment_table.bulk_delete_confirm', { count: selectedPayments.length });
        
        if (!window.confirm(confirmMessage)) {
            return;
        }

        setLoading(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(`/companies/${companyId}/payments/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ payment_ids: selectedPayments })
            });

            const result = await response.json();
            
            if (result.success) {
                setData(prev => prev.filter(p => !selectedPayments.includes(p.id)));
                setSelectedPayments([]);
                alert(t('payment_table.payments_deleted'));
            } else {
                alert(result.message || t('payment_table.delete_failed'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert(t('payment_table.network_error'));
        } finally {
            setLoading(false);
        }
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedPayments.length === filteredData.length && filteredData.length > 0) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(filteredData.map(p => p.id));
        }
    };

    // Handle select payment
    const handleSelectPayment = (id) => {
        setSelectedPayments(prev => 
            prev.includes(id) 
                ? prev.filter(paymentId => paymentId !== id)
                : [...prev, id]
        );
    };

    // Komponen untuk amount dengan expand/collapse
    const AmountCell = ({ payment }) => {
        const isExpanded = expandedAmounts[payment.id];
        const fullAmount = formatCurrency(payment.amount);
        const compactAmount = formatCompactCurrency(payment.amount);
        
        const shouldShowExpand = fullAmount !== compactAmount;
        
        return (
            <div className="flex items-center gap-1 min-w-0">
                <div className={`font-bold text-green-700 ${!isExpanded && shouldShowExpand ? 'truncate' : ''}`}>
                    {isExpanded ? fullAmount : compactAmount}
                </div>
                {shouldShowExpand && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAmounts(prev => ({
                                ...prev,
                                [payment.id]: !prev[payment.id]
                            }));
                        }}
                        className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        title={isExpanded ? t('payment_table.collapse') : t('payment_table.expand')}
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-3 h-3" />
                        ) : (
                            <Maximize2 className="w-3 h-3" />
                        )}
                    </button>
                )}
            </div>
        );
    };

    // Komponen untuk note dengan expand/collapse
    const NoteCell = ({ payment }) => {
        const isExpanded = expandedNotes[payment.id];
        const note = payment.note || '-';
        
        if (!note || note === '-' || note.length <= 30) {
            return <span className="text-gray-600 text-xs">{note}</span>;
        }
        
        return (
            <div className="flex items-start gap-1 min-w-0">
                <div className={`text-gray-600 text-xs ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {note}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpandedNotes(prev => ({
                            ...prev,
                            [payment.id]: !prev[payment.id]
                        }));
                    }}
                    className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
                    title={isExpanded ? t('payment_table.collapse') : t('payment_table.expand')}
                >
                    {isExpanded ? (
                        <Minimize2 className="w-3 h-3" />
                    ) : (
                        <Maximize2 className="w-3 h-3" />
                    )}
                </button>
            </div>
        );
    };

    // Calculate statistics
    const totalAmount = data.reduce((sum, i) => sum + (i.amount || 0), 0);
    const transferCount = data.filter(i => i.method?.toLowerCase() === 'transfer').length;
    const cashCount = data.filter(i => i.method?.toLowerCase() === 'cash').length;
    const checkCount = data.filter(i => i.method?.toLowerCase() === 'check').length;

    // Prepare columns untuk SubModuleTableLayout
    const columns = useMemo(() => [
        {
            key: 'invoice',
            label: t('payment_table.invoice'),
            width: '130px',
            render: (value, row) => (
                <div className="font-medium text-gray-900 text-xs">
                    <div className="truncate" title={getInvoiceNumber(row)}>
                        {getInvoiceNumber(row)}
                    </div>
                </div>
            )
        },
        {
            key: 'date',
            label: t('payment_table.date'),
            width: '100px',
            render: (value) => (
                <div className="text-gray-600 text-xs">
                    {formatDate(value)}
                </div>
            )
        },
        {
            key: 'amount',
            label: t('payment_table.amount'),
            width: '120px',
            render: (value, row) => <AmountCell payment={row} />
        },
        {
            key: 'method',
            label: t('payment_table.method'),
            width: '90px',
            render: (value) => getMethodBadge(value)
        },
        {
            key: 'bank',
            label: t('payment_table.bank'),
            width: '110px',
            render: (value) => (
                <div className="text-gray-600 text-xs truncate" title={value}>
                    {value || '-'}
                </div>
            )
        },
        {
            key: 'note',
            label: t('payment_table.notes'),
            width: '140px',
            render: (value, row) => <NoteCell payment={row} />
        }
    ], [t]);

    // Handle edit untuk SubModuleTableLayout
    const handleEdit = (row) => {
        openEditPage(row);
    };

    // Handle delete untuk SubModuleTableLayout
    const handleDelete = (row) => {
        handleDeletePayment(row);
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('payment_table.no_payments_found')}
                </h3>
                <p className="text-gray-600">
                    {t('payment_table.no_payments_message')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="font-bold text-gray-900 text-base">
                        {t('payment_table.payment_history')}
                    </h2>
                    <p className="text-gray-600 text-xs">
                        {t('payment_table.payment_count', {
                            count: data.length,
                            filteredCount: filteredData.length
                        })}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                            type="text"
                            placeholder={t('payment_table.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">{t('payment_table.all_methods')}</option>
                        <option value="transfer">{t('payment_table.transfer')}</option>
                        <option value="cash">{t('payment_table.cash')}</option>
                        <option value="check">{t('payment_table.check')}</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {canDelete && selectedPayments.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="font-medium text-blue-800 text-xs">
                                {selectedPayments.length} {t('payment_table.selected')}
                            </span>
                        </div>
                        <button 
                            onClick={handleBulkDelete}
                            disabled={loading}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                                <Trash2 className="w-3 h-3 mr-1" />
                            )}
                            {t('payment_table.delete_selected')}
                        </button>
                    </div>
                </div>
            )}

            {/* Statistics Cards */}
            {data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('payment_table.total_payments')}
                        </div>
                        <div className="font-bold text-gray-900 text-sm">
                            {data.length}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('payment_table.total_received')}
                        </div>
                        <div className="font-bold text-green-600 text-xs truncate" title={formatCurrency(totalAmount)}>
                            {formatCompactCurrency(totalAmount)}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('payment_table.transfers')}
                        </div>
                        <div className="font-bold text-blue-600 text-sm">
                            {transferCount}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('payment_table.cash')}
                        </div>
                        <div className="font-bold text-green-600 text-sm">
                            {cashCount}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content menggunakan SubModuleTableLayout */}
            <SubModuleTableLayout
                columns={columns}
                data={filteredData}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                showAction={canUpdate || canDelete}
                tableTitle=""
                showHeader={false}
                showFooter={true}
                compactMode={true}
                rowHeight="h-11"
            />
        </div>
    );
};

export default PaymentTable;