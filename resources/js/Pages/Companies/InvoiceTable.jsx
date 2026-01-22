// resources/js/Pages/Companies/InvoiceTable.jsx
import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
    FileText, Calendar, DollarSign, CheckCircle, Clock, 
    AlertCircle, Search, Edit, Trash2, Loader,
    ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InvoiceTable = ({ data: initialData, companyId, auth_permissions }) => {
    const { t } = useTranslation();
    
    // State untuk data invoices
    const [data, setData] = useState(initialData || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [expandedAmounts, setExpandedAmounts] = useState({});
    const [expandedTaxes, setExpandedTaxes] = useState({});

    const perms = auth_permissions || {}; 
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    // Update data ketika initialData berubah
    useEffect(() => {
        setData(initialData || []);
    }, [initialData]);

    // Format currency dengan pemisah titik
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return `Rp 0`;
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    // Format currency compact untuk tampilan normal
    const formatCurrencyCompact = (amount) => {
        if (!amount && amount !== 0) return `Rp 0`;
        const formatted = `Rp ${amount.toLocaleString('id-ID')}`;
        if (formatted.length > 20) {
            if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
            if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}JT`;
            if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}K`;
        }
        return formatted;
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

    // Format PPN dan PPH dengan Rp
    const formatTaxAmount = (amount) => {
        if (!amount && amount !== 0) return `Rp 0`;
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap";
        
        if (!status) {
            return (
                <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                    {t('invoice_table.status_unknown')}
                </span>
            );
        }
        
        const normalizedStatus = status.toLowerCase().trim();
        
        if (normalizedStatus.includes('cancel') || normalizedStatus.includes('batal')) {
            return (
                <span className={`${baseClasses} bg-red-100 text-red-800`} title={t('invoice_table.status_cancelled')}>
                    ✗ {t('invoice_table.status_cancelled').substring(0, 4)}
                </span>
            );
        }
        
        if (normalizedStatus.includes('unpaid') || normalizedStatus.includes('belum') || normalizedStatus === 'outstanding') {
            return (
                <span className={`${baseClasses} bg-yellow-100 text-yellow-800`} title={t('invoice_table.status_unpaid')}>
                    ⌛ {t('invoice_table.status_unpaid').substring(0, 4)}
                </span>
            );
        }
        
        if (normalizedStatus === 'paid' || normalizedStatus.includes('lunas') || normalizedStatus.includes('terbayar')) {
            return (
                <span className={`${baseClasses} bg-green-100 text-green-800`} title={t('invoice_table.status_paid')}>
                    ✓ {t('invoice_table.status_paid').substring(0, 4)}
                </span>
            );
        }
        
        if (normalizedStatus.includes('partial') || normalizedStatus.includes('sebagian')) {
            return (
                <span className={`${baseClasses} bg-purple-100 text-purple-800`} title={t('invoice_table.status_partial')}>
                    $ {t('invoice_table.status_partial').substring(0, 4)}
                </span>
            );
        }
        
        if (normalizedStatus.includes('draft') || normalizedStatus.includes('draf')) {
            return (
                <span className={`${baseClasses} bg-gray-100 text-gray-800`} title={t('invoice_table.status_draft')}>
                    📝 {t('invoice_table.status_draft').substring(0, 4)}
                </span>
            );
        }
        
        return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                {status.substring(0, 8)}...
            </span>
        );
    };

    const filterData = () => {
        return data
            .filter(invoice => {
                const matchesSearch = searchTerm === '' || 
                    (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (invoice.contact_person?.name && invoice.contact_person.name.toLowerCase().includes(searchTerm.toLowerCase()));
                
                if (statusFilter === 'all') return matchesSearch;
                
                const normalizedStatus = invoice.status?.toLowerCase() || '';
                const statusMap = {
                    'paid': ['paid', 'lunas', 'terbayar'],
                    'unpaid': ['unpaid', 'belum', 'outstanding'],
                    'draft': ['draft', 'draf'],
                    'cancelled': ['cancel', 'batal', 'dibatalkan'],
                    'partial': ['partial', 'sebagian']
                };
                
                return matchesSearch && statusMap[statusFilter]?.some(s => normalizedStatus.includes(s));
            })
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    };

    const filteredData = filterData();

    // Toggle expand/collapse untuk seluruh row
    const toggleRowExpand = (invoiceId) => {
        setExpandedRows(prev => ({
            ...prev,
            [invoiceId]: !prev[invoiceId]
        }));
    };

    // Toggle expand/collapse untuk amount
    const toggleAmountExpand = (invoiceId, field) => {
        setExpandedAmounts(prev => ({
            ...prev,
            [`${invoiceId}_${field}`]: !prev[`${invoiceId}_${field}`]
        }));
    };

    // Toggle expand/collapse untuk tax info
    const toggleTaxExpand = (invoiceId) => {
        setExpandedTaxes(prev => ({
            ...prev,
            [invoiceId]: !prev[invoiceId]
        }));
    };

    const handleSelectAll = () => {
        setSelectedInvoices(selectedInvoices.length === filteredData.length ? [] : filteredData.map(invoice => invoice.id));
    };

    const handleSelectInvoice = (id) => {
        setSelectedInvoices(prev => prev.includes(id) ? prev.filter(invoiceId => invoiceId !== id) : [...prev, id]);
    };

    const openEditPage = (invoice) => {
        if (!invoice?.id) return;
        router.visit(`/invoice/${invoice.id}/edit`, { preserveScroll: true });
    };

    const handleDeleteInvoice = async (invoice) => {
        if (!invoice?.id || !companyId || !window.confirm(t('invoice_table.delete_confirm_message', { invoiceNumber: invoice.invoice_number || invoice.id }))) return;
        
        setLoading(true);
        setIsDeleting(true);
        setData(prev => prev.filter(item => item.id !== invoice.id));
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await fetch(`/companies/${companyId}/invoices/${invoice.id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' }
            });
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setLoading(false);
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedInvoices.length === 0 || !companyId || !window.confirm(t('invoice_table.bulk_delete_confirm', { count: selectedInvoices.length }))) return;
        
        setLoading(true);
        setIsDeleting(true);
        const newData = data.filter(item => !selectedInvoices.includes(item.id));
        setData(newData);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await fetch(`/companies/${companyId}/invoices/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
                body: JSON.stringify({ invoice_ids: selectedInvoices })
            });
            setSelectedInvoices([]);
        } catch (error) {
            console.error('Bulk delete error:', error);
        } finally {
            setLoading(false);
            setIsDeleting(false);
        }
    };

    // Komponen untuk expandable text
    const ExpandableText = ({ text, maxLength = 20, invoiceId, field = null, className = "" }) => {
        const isExpanded = field ? expandedAmounts[`${invoiceId}_${field}`] : false;
        
        if (!text) return <span className={className}>{t('invoice_table.not_available')}</span>;
        if (text.length <= maxLength) return <span className={className}>{text}</span>;
        
        return (
            <div className={`${className} flex items-center gap-1`}>
                <span>{isExpanded ? text : `${text.substring(0, maxLength)}...`}</span>
                <button
                    onClick={() => field ? toggleAmountExpand(invoiceId, field) : toggleRowExpand(invoiceId)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                    title={isExpanded ? t('invoice_table.hide') : t('invoice_table.view_full')}
                >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            </div>
        );
    };

    // Komponen untuk expandable amount
    const ExpandableAmount = ({ amount, invoiceId, field, showCompact = true }) => {
        const isExpanded = expandedAmounts[`${invoiceId}_${field}`];
        const fullAmount = formatCurrency(amount);
        const compactAmount = formatCurrencyCompact(amount);
        
        if (fullAmount.length <= 15) return <span>{fullAmount}</span>;
        
        return (
            <div className="flex items-center gap-1">
                <span className="font-semibold">{isExpanded ? fullAmount : compactAmount}</span>
                <button
                    onClick={() => toggleAmountExpand(invoiceId, field)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                    title={isExpanded ? t('invoice_table.hide') : t('invoice_table.view_full')}
                >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            </div>
        );
    };

    // Komponen untuk tax info dengan expand/collapse - MODIFIKASI DI SINI
    const TaxInfo = ({ invoice }) => {
        const isExpanded = expandedTaxes[invoice.id];
        
        // Ambil nilai PPN dan PPH sebagai nominal Rupiah
        // Asumsi: invoice.ppn dan invoice.pph adalah nilai nominal, bukan persentase
        const ppnAmount = invoice.ppn_amount || invoice.ppn || 0;
        const pphAmount = invoice.pph_amount || invoice.pph || 0;
        
        // Format untuk tampilan normal dan expanded
        const formatTaxDisplay = (amount) => {
            const fullAmount = formatTaxAmount(amount);
            if (fullAmount.length <= 15) return fullAmount;
            
            // Versi singkat untuk nilai panjang
            if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
            if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}JT`;
            if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}K`;
            return fullAmount;
        };
        
        const fullPpn = formatTaxAmount(ppnAmount);
        const fullPph = formatTaxAmount(pphAmount);
        const compactPpn = formatTaxDisplay(ppnAmount);
        const compactPph = formatTaxDisplay(pphAmount);
        
        const shouldShowExpand = fullPpn !== compactPpn || fullPph !== compactPph;
        
        return (
            <div>
                <div className="text-[10px]">
                    <div className="flex items-center gap-1">
                        <span className="font-medium">{t('invoice_table.ppn')}:</span>
                        <span className={isExpanded ? '' : 'truncate max-w-[70px]'}>
                            {isExpanded ? fullPpn : compactPpn}
                        </span>
                        {shouldShowExpand && (
                            <button
                                onClick={() => toggleTaxExpand(invoice.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title={isExpanded ? t('invoice_table.hide') : t('invoice_table.view')}
                            >
                                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            </button>
                        )}
                    </div>
                    {(isExpanded || !shouldShowExpand) && (
                        <div className="mt-0.5 flex items-center gap-1">
                            <span className="font-medium">{t('invoice_table.pph')}:</span>
                            <span>{isExpanded ? fullPph : compactPph}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const MobileCardView = ({ invoice }) => {
        const isRowExpanded = expandedRows[invoice.id];
        
        return (
            <div className="bg-white border border-gray-200 rounded p-2 mb-2 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-1">
                        {canDelete && (
                            <input
                                type="checkbox"
                                checked={selectedInvoices.includes(invoice.id)}
                                onChange={() => handleSelectInvoice(invoice.id)}
                                className="h-3 w-3 text-blue-600"
                                disabled={loading || isDeleting}
                            />
                        )}
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-xs flex items-center gap-1">
                                <ExpandableText 
                                    text={invoice.invoice_number || t('invoice_table.no_number')} 
                                    maxLength={15}
                                    invoiceId={invoice.id}
                                    field="invoice_number"
                                />
                            </div>
                            <div className="text-[10px] text-gray-500">
                                {formatDate(invoice.date)}
                            </div>
                        </div>
                    </div>
                    <div className="ml-2">
                        {getStatusBadge(invoice.status)}
                    </div>
                </div>
                
                <div className="text-xs mt-1">
                    <div className="text-gray-700 mb-1 flex items-center gap-1">
                        <ExpandableText 
                            text={invoice.contact_person?.name || t('invoice_table.no_contact_person')} 
                            maxLength={20}
                            invoiceId={invoice.id}
                            field="contact_name"
                        />
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            <div className="text-[10px] text-gray-500">{t('invoice_table.amount')}</div>
                            <div className="font-semibold text-gray-900">
                                <ExpandableAmount 
                                    amount={invoice.invoice_amount} 
                                    invoiceId={invoice.id}
                                    field="invoice_amount"
                                />
                            </div>
                        </div>
                        <div className="flex-1 text-right">
                            <div className="text-[10px] text-gray-500">{t('invoice_table.due')}</div>
                            <div className="font-bold text-red-600">
                                <ExpandableAmount 
                                    amount={invoice.amount_due} 
                                    invoiceId={invoice.id}
                                    field="amount_due"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {isRowExpanded && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="text-[10px] text-gray-500">{t('invoice_table.payment_term')}</div>
                                <div className="text-gray-700">
                                    <ExpandableText 
                                        text={invoice.payment_terms || t('invoice_table.not_available')} 
                                        maxLength={15}
                                        invoiceId={invoice.id}
                                        field="payment_terms"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500">{t('invoice_table.tax_info')}</div>
                                <div className="text-gray-700">
                                    <div className="text-[10px]">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{t('invoice_table.ppn')}:</span>
                                            <span>{formatTaxAmount(invoice.ppn_amount || invoice.ppn || 0)}</span>
                                        </div>
                                        <div className="flex justify-between mt-0.5">
                                            <span className="font-medium">{t('invoice_table.pph')}:</span>
                                            <span>{formatTaxAmount(invoice.pph_amount || invoice.pph || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-100">
                    <button
                        onClick={() => toggleRowExpand(invoice.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                    >
                        {isRowExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{isRowExpanded ? t('invoice_table.show_less') : t('invoice_table.show_more')}</span>
                    </button>
                    
                    {(canUpdate || canDelete) && (
                        <div className="flex gap-1">
                            {canUpdate && (
                                <button 
                                    className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                                    onClick={() => openEditPage(invoice)}
                                    disabled={loading || isDeleting}
                                    title={t('invoice_table.edit')}
                                >
                                    <Edit className="w-3 h-3" />
                                </button>
                            )}
                            {canDelete && (
                                <button 
                                    className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                                    onClick={() => handleDeleteInvoice(invoice)}
                                    disabled={loading || isDeleting}
                                    title={t('invoice_table.delete')}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded p-4 text-center text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t('invoice_table.no_invoices_found')}</h3>
                <p className="text-xs text-gray-600">{t('invoice_table.no_invoices_message')}</p>
            </div>
        );
    }

    return (
        <div className="text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                    <h2 className="text-base font-bold text-gray-900">{t('invoice_table.invoice_list')}</h2>
                    <p className="text-xs text-gray-600">
                        {t('invoice_table.invoice_count', {
                            count: data.length,
                            filteredCount: filteredData.length
                        })}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder={t('invoice_table.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            disabled={loading || isDeleting}
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading || isDeleting}
                    >
                        <option value="all">{t('invoice_table.all_status')}</option>
                        <option value="paid">{t('invoice_table.status_paid')}</option>
                        <option value="unpaid">{t('invoice_table.status_unpaid')}</option>
                        <option value="draft">{t('invoice_table.status_draft')}</option>
                        <option value="cancelled">{t('invoice_table.status_cancelled')}</option>
                        <option value="partial">{t('invoice_table.status_partial')}</option>
                    </select>
                </div>
            </div>

            {selectedInvoices.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-blue-600 mr-1" />
                            <span className="font-medium text-blue-800 text-xs">
                                {t('invoice_table.invoices_selected', { count: selectedInvoices.length })}
                            </span>
                        </div>
                        <button 
                            onClick={handleBulkDelete}
                            disabled={loading || isDeleting}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            {(loading || isDeleting) ? (
                                <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                                <>
                                    <Trash2 className="w-3 h-3" />
                                    {t('invoice_table.delete_selected')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile View */}
            <div className="sm:hidden">
                {filteredData.map((invoice) => (
                    <MobileCardView key={invoice.id} invoice={invoice} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                            <tr>
                                {canDelete && (
                                    <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedInvoices.length === filteredData.length && filteredData.length > 0}
                                            onChange={handleSelectAll}
                                            className="h-3 w-3 text-blue-600"
                                            disabled={loading || isDeleting}
                                        />
                                    </th>
                                )}                            
                                <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">{t('invoice_table.invoice')}</th>
                                <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">{t('invoice_table.date')}</th>
                                <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">{t('invoice_table.contact_person')}</th>
                                <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">{t('invoice_table.invoice_amount')}</th>
                                <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">{t('invoice_table.amount_due')}</th>
                                <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">{t('invoice_table.status')}</th>
                                <th className="px-2 py-1.5 text-left border-r border-gray-200 whitespace-nowrap">{t('invoice_table.tax_info')}</th>
                                {(canUpdate || canDelete) && (
                                    <th className="px-2 py-1.5 text-left whitespace-nowrap">{t('invoice_table.actions')}</th>
                                )}                                
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((invoice) => (
                                <React.Fragment key={invoice.id}>
                                    <tr className="border-t border-gray-100 hover:bg-gray-50">
                                        {canDelete && (
                                            <td className="px-2 py-1.5 border-r border-gray-200 align-middle">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInvoices.includes(invoice.id)}
                                                    onChange={() => handleSelectInvoice(invoice.id)}
                                                    className="h-3 w-3 text-blue-600"
                                                    disabled={loading || isDeleting}
                                                />
                                            </td>
                                        )}                                
                                        <td className="px-2 py-1.5 border-r border-gray-200 align-middle">
                                            <div className="font-medium text-gray-900 flex items-center gap-1">
                                                <ExpandableText 
                                                    text={invoice.invoice_number || t('invoice_table.not_available')} 
                                                    maxLength={15}
                                                    invoiceId={invoice.id}
                                                    field="invoice_number"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 align-middle whitespace-nowrap">
                                            {formatDate(invoice.date)}
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 align-middle">
                                            <div className="flex items-center gap-1">
                                                <ExpandableText 
                                                    text={invoice.contact_person?.name || t('invoice_table.no_contact_person')} 
                                                    maxLength={15}
                                                    invoiceId={invoice.id}
                                                    field="contact_name"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 align-middle">
                                            <div className="font-semibold text-gray-900">
                                                <ExpandableAmount 
                                                    amount={invoice.invoice_amount} 
                                                    invoiceId={invoice.id}
                                                    field="invoice_amount"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 align-middle">
                                            <div className="font-bold text-red-600">
                                                <ExpandableAmount 
                                                    amount={invoice.amount_due} 
                                                    invoiceId={invoice.id}
                                                    field="amount_due"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 align-middle">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 align-middle">
                                            <TaxInfo invoice={invoice} />
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-2 py-1.5 align-middle">
                                                <div className="flex gap-1">
                                                    {canUpdate && (
                                                        <button 
                                                            title={t('invoice_table.edit')}
                                                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => openEditPage(invoice)}
                                                            disabled={loading || isDeleting}
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                    )} 
                                                    {canDelete && (
                                                        <button 
                                                            title={t('invoice_table.delete')}
                                                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleDeleteInvoice(invoice)}
                                                            disabled={loading || isDeleting}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        title={expandedRows[invoice.id] ? t('invoice_table.show_less') : t('invoice_table.show_more')}
                                                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                                                        onClick={() => toggleRowExpand(invoice.id)}
                                                    >
                                                        {expandedRows[invoice.id] ? (
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        )}                                        
                                    </tr>
                                    
                                    {/* Expanded Row Detail */}
                                    {expandedRows[invoice.id] && (
                                        <tr className="bg-blue-50 border-t border-blue-100">
                                            <td colSpan={canDelete ? 9 : 8} className="px-2 py-2">
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 font-medium mb-1">{t('invoice_table.payment_term')}</div>
                                                        <div className="text-gray-700">
                                                            <ExpandableText 
                                                                text={invoice.payment_terms || t('invoice_table.not_available')} 
                                                                maxLength={30}
                                                                invoiceId={invoice.id}
                                                                field="payment_terms"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 font-medium mb-1">{t('invoice_table.notes')}</div>
                                                        <div className="text-gray-700">
                                                            <ExpandableText 
                                                                text={invoice.note || t('invoice_table.not_available')} 
                                                                maxLength={30}
                                                                invoiceId={invoice.id}
                                                                field="notes"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 font-medium mb-1">{t('invoice_table.quotation')}</div>
                                                        <div className="text-gray-700">
                                                            <ExpandableText 
                                                                text={invoice.quotation?.quotation_number || t('invoice_table.not_available')} 
                                                                maxLength={20}
                                                                invoiceId={invoice.id}
                                                                field="quotation"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 font-medium mb-1">{t('invoice_table.email')}</div>
                                                        <div className="text-gray-700">
                                                            <ExpandableText 
                                                                text={invoice.contact_person?.email || t('invoice_table.not_available')} 
                                                                maxLength={25}
                                                                invoiceId={invoice.id}
                                                                field="email"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Statistics */}
            {data.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-blue-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t('invoice_table.total_invoices')}</p>
                            <p className="text-sm font-bold">{data.length}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t('invoice_table.total_amount')}</p>
                            <p className="text-xs font-bold truncate" title={formatCurrency(data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0))}>
                                <ExpandableAmount 
                                    amount={data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0)} 
                                    invoiceId="summary"
                                    field="total_amount"
                                />
                            </p>
                        </div>
                        <div className="bg-red-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t('invoice_table.total_due')}</p>
                            <p className="text-xs font-bold text-red-600 truncate" title={formatCurrency(data.reduce((sum, i) => sum + (i.amount_due || 0), 0))}>
                                <ExpandableAmount 
                                    amount={data.reduce((sum, i) => sum + (i.amount_due || 0), 0)} 
                                    invoiceId="summary"
                                    field="total_due"
                                />
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t('invoice_table.unpaid_invoices')}</p>
                            <p className="text-sm font-bold text-yellow-600">
                                {data.filter(i => i.status === 'unpaid' || i.status === 'Unpaid').length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceTable;