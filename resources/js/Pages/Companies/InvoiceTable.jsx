// resources/js/Pages/Companies/InvoiceTable.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
    FileText, Search, Edit2, Trash2, Maximize2, Minimize2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SubModuleTableLayout, { ExpandableTextCell, ExpandableAmountCell } from '@/Layouts/SubModuleTableLayout';

const InvoiceTable = ({ data: initialData, companyId, auth_permissions }) => {
    const { t } = useTranslation();
    
    // State untuk data invoices
    const [data, setData] = useState(initialData || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);
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

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap";
        
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
                <span className={`${baseClasses} bg-red-100 text-red-800`}>
                    ✗ {t('invoice_table.status_cancelled')}
                </span>
            );
        }
        
        if (normalizedStatus.includes('unpaid') || normalizedStatus.includes('belum') || normalizedStatus === 'outstanding') {
            return (
                <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                    ⌛ {t('invoice_table.status_unpaid')}
                </span>
            );
        }
        
        if (normalizedStatus === 'paid' || normalizedStatus.includes('lunas') || normalizedStatus.includes('terbayar')) {
            return (
                <span className={`${baseClasses} bg-green-100 text-green-800`}>
                    ✓ {t('invoice_table.status_paid')}
                </span>
            );
        }
        
        if (normalizedStatus.includes('partial') || normalizedStatus.includes('sebagian')) {
            return (
                <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
                    $ {t('invoice_table.status_partial')}
                </span>
            );
        }
        
        if (normalizedStatus.includes('draft') || normalizedStatus.includes('draf')) {
            return (
                <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                    📝 {t('invoice_table.status_draft')}
                </span>
            );
        }
        
        return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800 truncate`}>
                {status.length > 8 ? `${status.substring(0, 8)}...` : status}
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

    const openEditPage = (invoice) => {
        if (!invoice?.id) return;
        router.visit(`/invoice/${invoice.id}/edit`, { preserveScroll: true });
    };

    const handleDeleteInvoice = async (invoice) => {
        if (!invoice?.id || !companyId || !window.confirm(t('invoice_table.delete_confirm_message', { invoiceNumber: invoice.invoice_number || invoice.id }))) return;
        
        setDeletingId(invoice.id);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await fetch(`/companies/${companyId}/invoices/${invoice.id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' }
            });
            
            // Update local data
            setData(prev => prev.filter(item => item.id !== invoice.id));
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setDeletingId(null);
        }
    };

    // Komponen untuk tax info - TEXT KECIL
    const TaxInfo = ({ invoice }) => {
        const isExpanded = expandedTaxes[invoice.id];
        const ppnAmount = invoice.ppn_amount || invoice.ppn || 0;
        const pphAmount = invoice.pph_amount || invoice.pph || 0;
        
        const fullPpn = formatCurrency(ppnAmount);
        const fullPph = formatCurrency(pphAmount);
        
        const compactPpn = formatCompactCurrency(ppnAmount);
        const compactPph = formatCompactCurrency(pphAmount);
        
        const shouldShowExpand = fullPpn !== compactPpn || fullPph !== compactPph;
        
        return (
            <div className="min-w-0">
                <div className="space-y-0.5 text-xs">
                    {/* Baris 1: PPN */}
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="font-medium text-gray-700 whitespace-nowrap text-[11px]">
                                PPN:
                            </span>
                            <span className="text-gray-600 text-[11px] truncate" title={fullPpn}>
                                {isExpanded ? fullPpn : compactPpn}
                            </span>
                        </div>
                        {shouldShowExpand && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedTaxes(prev => ({
                                        ...prev,
                                        [invoice.id]: !prev[invoice.id]
                                    }));
                                }}
                                className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                title={isExpanded ? t('invoice_table.collapse') : t('invoice_table.expand')}
                            >
                                {isExpanded ? (
                                    <Minimize2 className="w-3 h-3" />
                                ) : (
                                    <Maximize2 className="w-3 h-3" />
                                )}
                            </button>
                        )}
                    </div>
                    
                    {/* Baris 2: PPH */}
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 whitespace-nowrap text-[11px]">
                            PPH:
                        </span>
                        <span className="text-gray-600 text-[11px] truncate" title={fullPph}>
                            {isExpanded ? fullPph : compactPph}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Calculate statistics
    const totalAmount = data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0);
    const totalDue = data.reduce((sum, i) => sum + (i.amount_due || 0), 0);
    const unpaidCount = data.filter(i => i.status === 'unpaid' || i.status === 'Unpaid').length;

    // Prepare columns untuk SubModuleTableLayout dengan TEXT KECIL
    const columns = useMemo(() => [
        {
            key: 'invoice_number',
            label: t('invoice_table.invoice_number'),
            width: '140px',
            render: (value, row) => (
                <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-xs truncate" title={value}>
                        {value || t('invoice_table.no_number')}
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5 truncate">
                        {formatDate(row.date)}
                    </div>
                </div>
            )
        },
        {
            key: 'date',
            label: t('invoice_table.date'),
            width: '100px',
            className: 'hidden lg:table-cell',
            render: (value) => (
                <div className="text-gray-600 text-xs truncate">
                    {formatDate(value)}
                </div>
            )
        },
        {
            key: 'contact_person',
            label: t('invoice_table.contact_person'),
            width: '140px',
            render: (value) => (
                <ExpandableTextCell 
                    text={value?.name || t('invoice_table.no_contact_person')} 
                    maxLength={20}
                    className="text-xs"
                />
            )
        },
        {
            key: 'invoice_amount',
            label: t('invoice_table.invoice_amount'),
            width: '130px',
            render: (value) => (
                <ExpandableAmountCell 
                    amount={value} 
                    formatFunction={formatCurrency}
                    className="text-xs"
                />
            )
        },
        {
            key: 'amount_due',
            label: t('invoice_table.amount_due'),
            width: '130px',
            render: (value) => (
                <div className="font-bold text-red-600 text-xs">
                    <ExpandableAmountCell 
                        amount={value} 
                        formatFunction={formatCurrency}
                        className="text-xs"
                    />
                </div>
            )
        },
        {
            key: 'status',
            label: t('invoice_table.status'),
            width: '110px',
            render: (value) => getStatusBadge(value)
        },
        {
            key: 'tax_info',
            label: 'Pajak',
            width: '120px',
            render: (value, row) => <TaxInfo invoice={row} />
        }
    ], [t]);

    // Handle edit untuk SubModuleTableLayout
    const handleEdit = (row) => {
        openEditPage(row);
    };

    // Handle delete untuk SubModuleTableLayout
    const handleDelete = (row) => {
        handleDeleteInvoice(row);
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('invoice_table.no_invoices_found')}
                </h3>
                <p className="text-gray-600">
                    {t('invoice_table.no_invoices_message')}
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
                        {t('invoice_table.invoice_list')}
                    </h2>
                    <p className="text-gray-600 text-xs">
                        {t('invoice_table.invoice_count', {
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
                            placeholder={t('invoice_table.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Statistics Cards - Text Kecil */}
            {data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('invoice_table.total_invoices')}
                        </div>
                        <div className="font-bold text-gray-900 text-sm">
                            {data.length}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('invoice_table.total_amount')}
                        </div>
                        <div className="font-bold text-gray-900 text-xs truncate" title={formatCurrency(totalAmount)}>
                            {formatCompactCurrency(totalAmount)}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('invoice_table.total_due')}
                        </div>
                        <div className="font-bold text-red-600 text-xs truncate" title={formatCurrency(totalDue)}>
                            {formatCompactCurrency(totalDue)}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('invoice_table.unpaid_invoices')}
                        </div>
                        <div className="font-bold text-yellow-600 text-sm">
                            {unpaidCount}
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

export default InvoiceTable;