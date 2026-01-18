// resources/js/Pages/Companies/InvoiceTable.jsx
import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
    FileText, Calendar, DollarSign, CheckCircle, Clock, 
    AlertCircle, TrendingUp, Percent, Eye, Check, User,
    Search, Filter, ChevronDown,
    Edit, Trash2, X, Save, Loader
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InvoiceTable = ({ data: initialData, companyId, auth_permissions }) => {
    const { t } = useTranslation();
    
    // State untuk data invoices
    const [data, setData] = useState(initialData || []);
    
    // State lainnya
    const [tooltip, setTooltip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // State untuk local data manipulation
    const [localData, setLocalData] = useState(initialData || []);
    const [isDeleting, setIsDeleting] = useState(false);

    // State untuk announcement
    const [announcement, setAnnouncement] = useState({
        show: false,
        type: 'info',
        title: '',
        message: '',
        autoClose: true,
        duration: 5000
    });

    const perms = auth_permissions || {}; 
    
    const canRead = perms.can_read === 1;
    const canCreate = perms.can_create === 1;
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    // Update local data ketika initialData berubah
    useEffect(() => {
        setData(initialData || []);
        setLocalData(initialData || []);
    }, [initialData]);

    // Fungsi untuk menampilkan announcement
    const showAnnouncement = (type, title, message, autoClose = true) => {
        setAnnouncement({
            show: true,
            type,
            title,
            message,
            autoClose,
            duration: 5000
        });
        
        if (autoClose) {
            setTimeout(() => {
                setAnnouncement(prev => ({ ...prev, show: false }));
            }, 5000);
        }
    };

    // Komponen Announcement
    const AnnouncementModal = () => {
        if (!announcement.show) return null;
        
        const bgColor = {
            info: 'bg-blue-50 border-blue-200',
            warning: 'bg-yellow-50 border-yellow-200',
            error: 'bg-red-50 border-red-200',
            success: 'bg-green-50 border-green-200'
        }[announcement.type];
        
        const textColor = {
            info: 'text-blue-800',
            warning: 'text-yellow-800',
            error: 'text-red-800',
            success: 'text-green-800'
        }[announcement.type];
        
        const icon = {
            info: <AlertCircle className="w-5 h-5" />,
            warning: <AlertCircle className="w-5 h-5" />,
            error: <AlertCircle className="w-5 h-5" />,
            success: <CheckCircle className="w-5 h-5" />
        }[announcement.type];
        
        return (
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pointer-events-none">
                <div className={`max-w-md w-full border rounded-lg shadow-lg p-4 pointer-events-auto ${bgColor}`}>
                    <div className="flex items-start">
                        <div className={`flex-shrink-0 ${textColor}`}>
                            {icon}
                        </div>
                        <div className="ml-3 w-0 flex-1">
                            <h3 className={`text-sm font-medium ${textColor}`}>
                                {announcement.title}
                            </h3>
                            <div className="mt-1 text-sm">
                                <p className={textColor}>
                                    {announcement.message}
                                </p>
                            </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                className={`rounded-md inline-flex ${textColor} hover:opacity-80 focus:outline-none`}
                                onClick={() => setAnnouncement(prev => ({ ...prev, show: false }))}
                            >
                                <span className="sr-only">{t('invoice_table.close')}</span>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Format currency full tanpa K/M/Jt
    const formatCurrencyFull = (amount) => {
        if (!amount && amount !== 0) return t('invoice_table.currency_format', { amount: 0 });
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Komponen untuk expand/collapse angka besar
    const ExpandableAmount = ({ amount, maxLength = 15 }) => {
        const [expanded, setExpanded] = React.useState(false);
        const full = formatCurrencyFull(amount);
        if (full.length <= maxLength) return <span>{full}</span>;
        return (
            <span className="relative">
                <span 
                    className="cursor-pointer hover:underline" 
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? full : full.slice(0, maxLength) + '...'}
                    <span className="ml-1 text-xs text-blue-500">
                        {expanded ? t('invoice_table.hide') : t('invoice_table.view')}
                    </span>
                </span>
            </span>
        );
    };

    // Filter dan sort data
    const filteredData = localData
        .filter(invoice => {
            const matchesSearch = searchTerm === '' || 
                (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (invoice.contact_person?.name && invoice.contact_person.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (invoice.quotation?.quotation_number && invoice.quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (invoice.contact_person?.email && invoice.contact_person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (invoice.note && invoice.note.toLowerCase().includes(searchTerm.toLowerCase()));
            
            let normalizedStatus = invoice.status ? invoice.status.toLowerCase() : '';
            let filterStatus = statusFilter;
            
            const statusMap = {
                'paid': ['paid', 'lunas', 'terbayar'],
                'unpaid': ['unpaid', 'belum bayar', 'outstanding'],
                'draft': ['draft', 'draf'],
                'cancelled': ['cancelled', 'canceled', 'batal', 'dibatalkan'],
                'invoice': ['invoice', 'sent', 'terkirim'],
                'partial': ['partial', 'sebagian']
            };
            
            let matchesStatus = false;
            
            if (statusFilter === 'all') {
                matchesStatus = true;
            } else {
                if (statusMap[statusFilter]) {
                    matchesStatus = statusMap[statusFilter].includes(normalizedStatus);
                } else {
                    matchesStatus = normalizedStatus === statusFilter;
                }
            }
            
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            try {
                if (sortBy === 'date') {
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    
                    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                    if (isNaN(dateA.getTime())) return sortOrder === 'desc' ? 1 : -1;
                    if (isNaN(dateB.getTime())) return sortOrder === 'desc' ? -1 : 1;
                    
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                }
                
                if (sortBy === 'amount') {
                    const amountA = parseFloat(a.invoice_amount) || 0;
                    const amountB = parseFloat(b.invoice_amount) || 0;
                    return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
                }
                
                if (sortBy === 'due') {
                    const dueA = parseFloat(a.amount_due) || 0;
                    const dueB = parseFloat(b.amount_due) || 0;
                    return sortOrder === 'desc' ? dueB - dueA : dueA - dueB;
                }
                
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
                
            } catch (error) {
                console.error('Sorting error:', error);
                return 0;
            }
        });

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
        if (!status) {
            return (
                <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                    {t('invoice_table.status_unknown')}
                </span>
            );
        }
        
        const normalizedStatus = status.toLowerCase().trim();
        
        // PERBAIKAN: Periksa status secara berurutan dari yang paling spesifik
        if (normalizedStatus.includes('cancel') || normalizedStatus.includes('batal')) {
            return (
                <span className={`${baseClasses} bg-red-100 text-red-800`}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    <span>{t('invoice_table.status_cancelled')}</span>
                </span>
            );
        }
        
        // PERBAIKAN: Periksa 'unpaid' SEBELUM 'paid'
        if (normalizedStatus.includes('unpaid') || normalizedStatus.includes('belum') || normalizedStatus === 'outstanding') {
            return (
                <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{t('invoice_table.status_unpaid')}</span>
                </span>
            );
        }
        
        // PERBAIKAN: Periksa 'paid' dengan lebih spesifik
        if (normalizedStatus === 'paid' || normalizedStatus.includes('lunas') || normalizedStatus.includes('terbayar')) {
            return (
                <span className={`${baseClasses} bg-green-100 text-green-800`}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span>{t('invoice_table.status_paid')}</span>
                </span>
            );
        }
        
        if (normalizedStatus.includes('partial') || normalizedStatus.includes('sebagian')) {
            return (
                <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>{t('invoice_table.status_partial')}</span>
                </span>
            );
        }
        
        if (normalizedStatus.includes('draft') || normalizedStatus.includes('draf')) {
            return (
                <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                    <FileText className="w-3 h-3 mr-1" />
                    <span>{t('invoice_table.status_draft')}</span>
                </span>
            );
        }
        
        if (normalizedStatus.includes('invoice') || normalizedStatus.includes('sent') || normalizedStatus.includes('terkirim')) {
            return (
                <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                    <FileText className="w-3 h-3 mr-1" />
                    <span>{t('invoice_table.status_invoice_sent')}</span>
                </span>
            );
        }
        
        return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                {status}
            </span>
        );
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

    const handleSelectAll = () => {
        if (selectedInvoices.length === filteredData.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(filteredData.map(invoice => invoice.id));
        }
    };

    const handleSelectInvoice = (id) => {
        setSelectedInvoices(prev => 
            prev.includes(id) 
                ? prev.filter(invoiceId => invoiceId !== id)
                : [...prev, id]
        );
    };

    // ==================== FUNGSI EDIT - DIRECT KE HALAMAN EDIT ====================
    const openEditPage = (invoice) => {
        if (!invoice || !invoice.id) {
            showAnnouncement('error', t('invoice_table.error'), t('invoice_table.invalid_data'));
            return;
        }

        const editUrl = `/invoice/${invoice.id}/edit`;
        
        router.visit(editUrl, {
            method: 'get',
            preserveState: true,
            preserveScroll: false,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
            onError: (error) => {
                console.error('Error navigating to edit page:', error);
                showAnnouncement('error', t('invoice_table.error'), t('invoice_table.cannot_open_edit'), false);
            }
        });
    };

    // ==================== FUNGSI DELETE DENGAN STATE UPDATE ====================
    const handleDeleteInvoice = async (invoice) => {
        if (!invoice || !invoice.id || !companyId) {
            showAnnouncement('error', t('invoice_table.error'), t('invoice_table.invalid_data'));
            return;
        }
        
        const confirmMessage = t('invoice_table.delete_confirm_message', { 
            invoiceNumber: invoice.invoice_number || invoice.id 
        });
        
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        try {
            setIsDeleting(true);
            setLoading(true);
            
            // Update local state terlebih dahulu untuk immediate feedback
            const newData = localData.filter(item => item.id !== invoice.id);
            setLocalData(newData);
            
            // Juga update selected invoices jika invoice yang dihapus ada di dalamnya
            if (selectedInvoices.includes(invoice.id)) {
                setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
            }
            
            // Gunakan fetch API untuk menghindari error Inertia response
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch(`/companies/${companyId}/invoices/${invoice.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            const result = await response.json();
            
            if (result.success) {
                showAnnouncement('success', t('invoice_table.success'), t('invoice_table.delete_success'));
                // Juga update data utama
                setData(prev => prev.filter(item => item.id !== invoice.id));
            } else {
                // Jika gagal, restore data
                setLocalData(data);
                showAnnouncement('error', t('invoice_table.error'), result.message || t('invoice_table.delete_error'), false);
            }
            
        } catch (error) {
            console.error('Delete error:', error);
            // Restore data jika error
            setLocalData(data);
            showAnnouncement('error', t('invoice_table.error'), t('invoice_table.delete_error'), false);
        } finally {
            setIsDeleting(false);
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedInvoices.length === 0 || !companyId) {
            showAnnouncement('warning', t('invoice_table.warning'), t('invoice_table.no_selection'));
            return;
        }
        
        const confirmMessage = t('invoice_table.bulk_delete_confirm', { count: selectedInvoices.length });
        
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        try {
            setIsDeleting(true);
            setLoading(true);
            
            // Simpan data lama untuk backup
            const oldData = [...localData];
            
            // Update local state terlebih dahulu untuk immediate feedback
            const newData = localData.filter(item => !selectedInvoices.includes(item.id));
            setLocalData(newData);
            
            // Gunakan fetch API untuk menghindari error Inertia response
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch(`/companies/${companyId}/invoices/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ invoice_ids: selectedInvoices })
            });

            const result = await response.json();
            
            if (result.success) {
                showAnnouncement('success', t('invoice_table.success'), 
                    t('invoice_table.bulk_delete_success', { 
                        count: result.deleted_count || selectedInvoices.length 
                    }));
                
                // Clear selection
                setSelectedInvoices([]);
                // Juga update data utama
                setData(newData);
            } else {
                // Jika gagal, restore data
                setLocalData(oldData);
                showAnnouncement('error', t('invoice_table.error'), result.message || t('invoice_table.bulk_delete_error'), false);
            }
            
        } catch (error) {
            console.error('Bulk delete error:', error);
            // Restore data jika error
            setLocalData(data);
            showAnnouncement('error', t('invoice_table.error'), t('invoice_table.bulk_delete_error'), false);
        } finally {
            setIsDeleting(false);
            setLoading(false);
        }
    };

    const MobileCardView = ({ invoice }) => {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                            disabled={loading || isDeleting}
                        />
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                                {invoice.invoice_number || t('invoice_table.no_number')}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {formatDate(invoice.date)}
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
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <p className="text-xs text-gray-500">{t('invoice_table.amount')}</p>
                        <p className="text-sm font-bold text-gray-900">
                            <ExpandableAmount amount={invoice.invoice_amount} />
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t('invoice_table.due')}</p>
                        <p className="text-sm font-bold text-red-600">
                            <ExpandableAmount amount={invoice.amount_due} />
                        </p>
                    </div>
                </div>
                
                <div className="flex justify-between space-x-2">
                    { canUpdate && (
                        <button 
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => openEditPage(invoice)}
                            disabled={loading || isDeleting}
                        >
                            <Edit className="w-3 h-3" />
                            <span>{t('invoice_table.edit')}</span>
                        </button>
                    )}
                    { canDelete && (
                        <button 
                        className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDeleteInvoice(invoice)}
                        disabled={loading || isDeleting}
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('invoice_table.delete')}</span>
                    </button>
                    )}
                </div>
            </div>
        );
    };

    if (!localData || localData.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                <AnnouncementModal />
                <div className="mb-2">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('invoice_table.no_invoices_found')}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {t('invoice_table.no_invoices_message')}
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            <AnnouncementModal />
            
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    {t('invoice_table.invoice_list')}
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                    {t('invoice_table.invoice_count', {
                        count: localData.length,
                        filteredCount: filteredData.length
                    })}
                </p>
            </div>

            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('invoice_table.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || isDeleting}
                            />
                        </div>
                    </div>
                    
                    <div className="w-full sm:w-48">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || isDeleting}
                            >
                                <option value="all">{t('invoice_table.all_status')}</option>
                                <option value="paid">{t('invoice_table.status_paid')}</option>
                                <option value="unpaid">{t('invoice_table.status_unpaid')}</option>
                                <option value="draft">{t('invoice_table.status_draft')}</option>
                                <option value="cancelled">{t('invoice_table.status_cancelled')}</option>
                                <option value="partial">{t('invoice_table.status_partial')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                {selectedInvoices.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">
                                    {selectedInvoices.length} {t('invoice_table.invoices_selected')}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleBulkDelete}
                                    disabled={loading || isDeleting}
                                >
                                    {(loading || isDeleting) ? (
                                        <Loader className="w-4 h-4 animate-spin mr-1" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 inline mr-1" />
                                    )}
                                    {t('invoice_table.delete_selected')}
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

            {/* Desktop View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-[#eaf6f6]">
                                { canDelete && (
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={selectedInvoices.length === filteredData.length && filteredData.length > 0}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 text-blue-600 rounded"
                                            disabled={loading || isDeleting}
                                        />
                                    </th>
                                )}                            
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    {t('invoice_table.invoice')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    {t('invoice_table.invoice_amount')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    {t('invoice_table.payment_term')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    {t('invoice_table.tax_info')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    {t('invoice_table.amount_due')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    {t('invoice_table.status')}
                                </th>
                                { (canDelete || canUpdate) && ( 
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                        {t('invoice_table.actions')}
                                    </th>
                                )}                                
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map((invoice, idx) => {
                                return (
                                    <tr 
                                        key={invoice.id} 
                                        className={`hover:bg-gray-50 ${selectedInvoices.includes(invoice.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        { canDelete && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInvoices.includes(invoice.id)}
                                                    onChange={() => handleSelectInvoice(invoice.id)}
                                                    className="h-4 w-4 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={loading || isDeleting}
                                                />
                                            </td>
                                        )}                                
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">
                                                {invoice.invoice_number || t('invoice_table.not_available')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatDate(invoice.date)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900">
                                                <ExpandableAmount amount={invoice.invoice_amount} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">
                                                {invoice.payment_terms || t('invoice_table.not_available')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">
                                                {t('invoice_table.ppn')}: {invoice.ppn || 0} <br />
                                                {t('invoice_table.pph')}: {invoice.pph || 0}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-red-600">
                                                <ExpandableAmount amount={invoice.amount_due} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        { (canUpdate || canDelete) && (
                                            <td className="px-4 py-3">
                                                <div className="flex space-x-2">
                                                    { canUpdate && (
                                                        <button 
                                                            title={t('invoice_table.edit_invoice')}
                                                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => openEditPage(invoice)}
                                                            disabled={loading || isDeleting}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )} 
                                                    { canDelete && (
                                                         <button 
                                                            title={t('invoice_table.delete_invoice')}
                                                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleDeleteInvoice(invoice)}
                                                            disabled={loading || isDeleting}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}                                                                                                      
                                                </div>
                                            </td>
                                        )}                                        
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Section */}
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
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {localData.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('invoice_table.matching_filter')}: {filteredData.length}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                            <p className="text-sm text-gray-600">{t('invoice_table.total_amount')}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            <ExpandableAmount amount={localData.reduce((sum, i) => sum + (i.invoice_amount || 0), 0)} />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('invoice_table.all_invoices')}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            <p className="text-sm text-gray-600">{t('invoice_table.total_due')}</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600 mt-2">
                            <ExpandableAmount amount={localData.reduce((sum, i) => sum + (i.amount_due || 0), 0)} />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('invoice_table.unpaid_balance')}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <Percent className="w-5 h-5 text-purple-600 mr-2" />
                            <p className="text-sm text-gray-600">{t('invoice_table.tax_summary')}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            <ExpandableAmount amount={localData.reduce((sum, i) => sum + (i.ppn || 0), 0)} />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('invoice_table.total_ppn')}</p>
                    </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.paid_invoices')}</p>
                        <p className="text-xl font-bold text-green-600">
                            {localData.filter(i => i.status === 'Paid' || i.status === 'paid').length}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.unpaid_invoices')}</p>
                        <p className="text-xl font-bold text-yellow-600">
                            {localData.filter(i => i.status === 'Unpaid' || i.status === 'unpaid').length}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.average_invoice')}</p>
                        <p className="text-xl font-bold text-blue-600">
                            <ExpandableAmount amount={localData.length > 0 
                                ? localData.reduce((sum, i) => sum + (i.invoice_amount || 0), 0) / localData.length 
                                : 0} 
                            />
                        </p>
                    </div>
                </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <details>
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                            {t('invoice_table.debug_info')}
                        </summary>
                        <div className="mt-2 text-xs text-gray-600 space-y-2">
                            <div>{t('invoice_table.total_invoices')}: {localData.length}</div>
                            <div>{t('invoice_table.filtered_invoices')}: {filteredData.length}</div>
                            <div>{t('invoice_table.company_id')}: {companyId}</div>
                            <div>{t('invoice_table.loading')}: {loading ? t('invoice_table.yes') : t('invoice_table.no')}</div>
                            <div>{t('invoice_table.deleting')}: {isDeleting ? t('invoice_table.yes') : t('invoice_table.no')}</div>
                            <div>{t('invoice_table.selected')}: {selectedInvoices.length} {t('invoice_table.invoices')}</div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default InvoiceTable;