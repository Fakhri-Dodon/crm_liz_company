// resources/js/Pages/Companies/InvoiceTable.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
    FileText, Search, Maximize2, Minimize2
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
        if (amount === null || amount === undefined || isNaN(amount)) return `Rp 0`;
        return `Rp ${amount.toLocaleString('id-ID')}`;
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

    // Status badge static (tanpa fungsi edit)
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
                {status}
            </span>
        );
    };

    // Fungsi untuk mendapatkan nama perusahaan (tetap dipertahankan untuk pencarian)
    const getCompanyName = (invoice) => {
        // Prioritas 1: Dari company_name langsung
        if (invoice.company_name) return invoice.company_name;
        
        // Prioritas 2: Dari company object
        if (invoice.company?.company_name) return invoice.company.company_name;
        
        // Prioritas 3: Dari lead
        if (invoice.lead?.company_name) return invoice.lead.company_name;
        
        // Fallback
        return t('invoice_table.not_available');
    };

    // Fungsi untuk mendapatkan nomor invoice dengan link PDF
    const getInvoiceNumberCell = (value, row) => {
        const hasPdf = row.pdf_path && row.pdf_path !== '';
        
        if (hasPdf) {
            return (
                <div className="min-w-0">
                    <a 
                        className="text-blue-600 font-semibold hover:underline cursor-pointer whitespace-nowrap text-xs" 
                        href={`/storage/${row.pdf_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {value || t('invoice_table.no_number')}
                    </a>
                    <span className="text-gray-500 text-[11px] block mt-0.5">
                        {formatDate(row.date)}
                    </span>
                </div>
            );
        }

        return (
            <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-xs truncate">
                    {value || t('invoice_table.no_number')}
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">
                    {formatDate(row.date)}
                </div>
            </div>
        );
    };

    // Fungsi untuk mendapatkan payment amount
    const getPaymentAmount = (invoice) => {
        // Prioritas 1: Dari paid_amount langsung
        if (invoice.paid_amount !== undefined && invoice.paid_amount !== null) {
            return invoice.paid_amount;
        }
        
        // Prioritas 2: Hitung dari invoice_amount - amount_due
        if (invoice.invoice_amount !== undefined && invoice.amount_due !== undefined) {
            const paid = invoice.invoice_amount - invoice.amount_due;
            return Math.max(0, paid);
        }
        
        return 0;
    };

    const filterData = () => {
        return data
            .filter(invoice => {
                const matchesSearch = searchTerm === '' || 
                    (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (getCompanyName(invoice) && getCompanyName(invoice).toLowerCase().includes(searchTerm.toLowerCase())) ||
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
            alert(t('invoice_table.delete_failed'));
        } finally {
            setDeletingId(null);
        }
    };

    // Komponen untuk tax info
    const TaxInfo = ({ invoice }) => {
        const isExpanded = expandedTaxes[invoice.id];
        const ppnAmount = invoice.ppn || 0;
        const pphAmount = invoice.pph || 0;
        
        // Format: "PPN Rp X / PPh Rp Y"
        const taxText = `${t('invoice_table.ppn')} Rp ${ppnAmount.toLocaleString('id-ID')} / ${t('invoice_table.pph')} Rp ${pphAmount.toLocaleString('id-ID')}`;
        
        if (taxText.length <= 60) {
            return (
                <div className="text-gray-600 text-xs">
                    {taxText}
                </div>
            );
        }
        
        return (
            <div className="min-w-0">
                <div className="flex items-start gap-1">
                    <div className={`text-gray-600 text-xs ${!isExpanded ? 'truncate' : ''}`}>
                        {isExpanded ? taxText : `${taxText.substring(0, 60)}...`}
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTaxes(prev => ({
                                ...prev,
                                [invoice.id]: !prev[invoice.id]
                            }));
                        }}
                        className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        title={isExpanded ? t('invoice_table.show_less') : t('invoice_table.show_more')}
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-3 h-3" />
                        ) : (
                            <Maximize2 className="w-3 h-3" />
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // Prepare columns untuk SubModuleTableLayout - TANPA kolom company_name
    const columns = useMemo(() => [
        {
            key: 'invoice_number',
            label: t('invoice_table.invoice'),
            width: '150px',
            render: (value, row) => getInvoiceNumberCell(value, row)
        },
        {
            key: 'invoice_amount',
            label: t('invoice_table.invoice_amount'),
            width: '130px',
            render: (value) => (
                <div className="font-medium text-gray-900 text-xs">
                    {formatCurrency(value || 0)}
                </div>
            )
        },
        {
            key: 'payment',
            label: t('invoice_table.payment'),
            width: '120px',
            render: (value, row) => {
                const paymentAmount = getPaymentAmount(row);
                return (
                    <div className="text-gray-600 text-xs">
                        {formatCurrency(paymentAmount)}
                    </div>
                );
            }
        },
        {
            key: 'tax_info',
            label: t('invoice_table.tax'),
            width: '140px',
            render: (value, row) => <TaxInfo invoice={row} />
        },
        {
            key: 'amount_due',
            label: t('invoice_table.amount_due'),
            width: '120px',
            render: (value) => (
                <div className="font-bold text-red-600 text-xs">
                    {formatCurrency(value || 0)}
                </div>
            )
        },
        {
            key: 'status',
            label: t('invoice_table.status'),
            width: '120px',
            render: (value) => getStatusBadge(value)
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