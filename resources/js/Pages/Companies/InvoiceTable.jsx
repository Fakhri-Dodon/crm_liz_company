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

const InvoiceTable = ({ data, companyId }) => {
    const { t } = useTranslation();
    const [tooltip, setTooltip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [fetchingInvoice, setFetchingInvoice] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        invoice_number: '',
        date: '',
        invoice_amount: '',
        amount_due: '',
        status: 'draft',
        payment_terms: '',
        payment_type: '',
        note: '',
        ppn: '',
        pph: '',
        total: ''
    });

    console.log('InvoiceTable data received:', data);

    // Filter dan sort data
// resources/js/Pages/Companies/InvoiceTable.jsx
// Di bagian filter dan sort data (sekitar line 45-75):

// Filter dan sort data
const filteredData = data
    .filter(invoice => {
        // Search filter - lebih robust
        const matchesSearch = searchTerm === '' || 
            (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (invoice.contact_person?.name && invoice.contact_person.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (invoice.quotation?.quotation_number && invoice.quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (invoice.contact_person?.email && invoice.contact_person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (invoice.note && invoice.note.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Status filter - normalize status values
        let normalizedStatus = invoice.status ? invoice.status.toLowerCase() : '';
        let filterStatus = statusFilter;
        
        // Mapping status untuk konsistensi
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
            // Cek apakah status invoice cocok dengan filter
            if (statusMap[statusFilter]) {
                matchesStatus = statusMap[statusFilter].includes(normalizedStatus);
            } else {
                // Fallback: exact match
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
                
                // Handle invalid dates
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
            
            // Default sort by date desc
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
            
        } catch (error) {
            console.error('Sorting error:', error);
            return 0;
        }
    });

// Tambahkan fungsi untuk mendapatkan status display
const getStatusDisplay = (status) => {
    if (!status) return t('invoice_table.status_unknown');
    
    const statusMap = {
        'paid': t('invoice_table.status_paid'),
        'unpaid': t('invoice_table.status_unpaid'),
        'draft': t('invoice_table.status_draft'),
        'cancelled': t('invoice_table.status_cancelled'),
        'invoice': t('invoice_table.status_invoice_sent'),
        'partial': t('invoice_table.status_partial'),
        'lunas': t('invoice_table.status_paid'),
        'belum bayar': t('invoice_table.status_unpaid'),
        'draf': t('invoice_table.status_draft'),
        'batal': t('invoice_table.status_cancelled'),
        'terkirim': t('invoice_table.status_invoice_sent'),
        'sebagian': t('invoice_table.status_partial')
    };
    
    const normalizedStatus = status.toLowerCase();
    return statusMap[normalizedStatus] || status;
};

// Perbaiki getStatusBadge untuk handle berbagai format status
const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    if (!status) {
        return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                {t('invoice_table.status_unknown')}
            </span>
        );
    }
    
    const normalizedStatus = status.toLowerCase();
    
    // Mapping untuk berbagai kemungkinan nilai status
    if (normalizedStatus.includes('paid') || normalizedStatus.includes('lunas') || normalizedStatus.includes('terbayar')) {
        return (
            <span className={`${baseClasses} bg-green-100 text-green-800`}>
                <CheckCircle className="w-3 h-3 mr-1" />
                <span>{getStatusDisplay(status)}</span>
            </span>
        );
    }
    
    if (normalizedStatus.includes('unpaid') || normalizedStatus.includes('belum') || normalizedStatus.includes('outstanding')) {
        return (
            <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                <Clock className="w-3 h-3 mr-1" />
                <span>{getStatusDisplay(status)}</span>
            </span>
        );
    }
    
    if (normalizedStatus.includes('invoice') || normalizedStatus.includes('sent') || normalizedStatus.includes('terkirim')) {
        return (
            <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                <FileText className="w-3 h-3 mr-1" />
                <span>{getStatusDisplay(status)}</span>
            </span>
        );
    }
    
    if (normalizedStatus.includes('cancel') || normalizedStatus.includes('batal')) {
        return (
            <span className={`${baseClasses} bg-red-100 text-red-800`}>
                <AlertCircle className="w-3 h-3 mr-1" />
                <span>{getStatusDisplay(status)}</span>
            </span>
        );
    }
    
    if (normalizedStatus.includes('draft') || normalizedStatus.includes('draf')) {
        return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                <FileText className="w-3 h-3 mr-1" />
                <span>{getStatusDisplay(status)}</span>
            </span>
        );
    }
    
    if (normalizedStatus.includes('partial') || normalizedStatus.includes('sebagian')) {
        return (
            <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{getStatusDisplay(status)}</span>
            </span>
        );
    }
    
    // Default untuk status yang tidak dikenali
    return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {getStatusDisplay(status)}
        </span>
    );
};

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

    // TAMBAHKAN FUNGSI handleSelectAll YANG HILANG
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

const openEditModal = async (invoice) => {
    try {
        setFetchingInvoice(true);
        
        // Fetch data terbaru dari API sebelum edit
        const response = await fetch(`/companies/${companyId}/invoices/${invoice.id}/get`);
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const freshInvoice = result.data;
                setEditModal(freshInvoice);
                setFormData({
                    invoice_number: freshInvoice.invoice_number || '',
                    date: freshInvoice.date ? freshInvoice.date.split('T')[0] : '',
                    invoice_amount: freshInvoice.invoice_amount || '',
                    amount_due: freshInvoice.amount_due || '',
                    status: freshInvoice.status || 'draft',
                    payment_terms: freshInvoice.payment_terms || '',
                    payment_type: freshInvoice.payment_type || '',
                    note: freshInvoice.note || '',
                    ppn: freshInvoice.ppn || '',
                    pph: freshInvoice.pph || '',
                    total: freshInvoice.total || ''
                });
            } else {
                // Fallback ke data yang ada
                setEditModal(invoice);
                setFormData({
                    invoice_number: invoice.invoice_number || '',
                    date: invoice.date ? invoice.date.split('T')[0] : '',
                    invoice_amount: invoice.invoice_amount || '',
                    amount_due: invoice.amount_due || '',
                    status: invoice.status || 'draft',
                    payment_terms: invoice.payment_terms || '',
                    payment_type: invoice.payment_type || '',
                    note: invoice.note || '',
                    ppn: invoice.ppn || '',
                    pph: invoice.pph || '',
                    total: invoice.total || ''
                });
            }
        } else {
            // Fallback ke data yang ada
            setEditModal(invoice);
            setFormData({
                invoice_number: invoice.invoice_number || '',
                date: invoice.date ? invoice.date.split('T')[0] : '',
                invoice_amount: invoice.invoice_amount || '',
                amount_due: invoice.amount_due || '',
                status: invoice.status || 'draft',
                payment_terms: invoice.payment_terms || '',
                payment_type: invoice.payment_type || '',
                note: invoice.note || '',
                ppn: invoice.ppn || '',
                pph: invoice.pph || '',
                total: invoice.total || ''
            });
        }
    } catch (error) {
        console.error('Error fetching invoice data:', error);
        // Fallback ke data yang ada
        setEditModal(invoice);
        setFormData({
            invoice_number: invoice.invoice_number || '',
            date: invoice.date ? invoice.date.split('T')[0] : '',
            invoice_amount: invoice.invoice_amount || '',
            amount_due: invoice.amount_due || '',
            status: invoice.status || 'draft',
            payment_terms: invoice.payment_terms || '',
            payment_type: invoice.payment_type || '',
            note: invoice.note || '',
            ppn: invoice.ppn || '',
            pph: invoice.pph || '',
            total: invoice.total || ''
        });
    } finally {
        setFetchingInvoice(false);
    }
};

    const closeEditModal = () => {
        setEditModal(null);
        setFormData({
            invoice_number: '',
            date: '',
            invoice_amount: '',
            amount_due: '',
            status: 'draft',
            payment_terms: '',
            payment_type: '',
            note: '',
            ppn: '',
            pph: '',
            total: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

const handleUpdateInvoice = async () => {
    if (!editModal || !companyId) return;
    
    try {
        // Validasi frontend
        if (!formData.invoice_number.trim()) {
            alert('Invoice number is required');
            return;
        }
        
        if (!formData.date) {
            alert('Date is required');
            return;
        }
        
        if (!formData.invoice_amount || formData.invoice_amount <= 0) {
            alert('Invoice amount must be greater than 0');
            return;
        }
        
        if (formData.amount_due < 0) {
            alert('Amount due cannot be negative');
            return;
        }
        
        if (parseFloat(formData.amount_due) > 999999999999) {
            alert('Amount due is too large');
            return;
        }
        
        setLoading(true);
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        
        // Log data yang akan dikirim
        console.log('Sending update data:', formData);
        
        const response = await fetch(`/companies/${companyId}/invoices/${editModal.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData)
        });

        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }

        if (!response.ok) {
            throw new Error(`Failed to update invoice: ${response.status} ${response.statusText}. ${result.message || 'Unknown error'}`);
        }
        
        if (result.success) {
            alert('Invoice updated successfully!');
            console.log('Update successful:', result);
            router.reload({ only: ['invoices'] });
        } else {
            alert('Failed to update invoice: ' + result.message);
            console.error('Update failed:', result);
        }
        
    } catch (error) {
        console.error('Error updating invoice:', error);
        alert('Failed to update invoice: ' + error.message);
    } finally {
        setLoading(false);
        closeEditModal();
    }
};

    const handleMarkAsPaid = async (invoiceId) => {
        if (!invoiceId || !companyId) return;
        
        try {
            const confirmPaid = window.confirm(t('invoice_table.confirm_mark_paid'));
            if (!confirmPaid) return;
            
            setLoading(true);
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(`/companies/${companyId}/invoices/${invoiceId}/mark-paid`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to mark invoice as paid: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                alert('Invoice marked as paid successfully!');
                router.reload({ only: ['invoices'] });
            } else {
                alert('Failed to mark invoice as paid: ' + result.message);
            }
            
        } catch (error) {
            console.error('Error marking invoice as paid:', error);
            alert('Failed to mark invoice as paid: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

const handleDeleteInvoice = async (invoiceId) => {
    if (!invoiceId || !companyId) return;
    
    try {
        setLoading(true);
        console.log('Attempting to delete invoice:', {
            invoiceId,
            companyId,
            url: `/companies/${companyId}/invoices/${invoiceId}`
        });
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');
        
        const response = await fetch(`/companies/${companyId}/invoices/${invoiceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to delete invoice: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();
        console.log('Success result:', result);
        
        if (result.success) {
            alert('Invoice deleted successfully!');
            router.reload({ only: ['invoices'] });
        } else {
            alert('Failed to delete invoice: ' + result.message);
        }
        
    } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice: ' + error.message);
    } finally {
        setLoading(false);
        setDeleteConfirm(null);
    }
};

    const handleBulkDelete = async () => {
        if (selectedInvoices.length === 0 || !companyId) return;
        
        const confirmDelete = window.confirm(
            t('invoice_table.confirm_bulk_delete', { count: selectedInvoices.length })
        );
        
        if (!confirmDelete) return;
        
        try {
            setLoading(true);
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(`/companies/${companyId}/invoices/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ invoice_ids: selectedInvoices })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete invoices: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                alert(`Successfully deleted ${result.deleted_count} invoice(s)!`);
                setSelectedInvoices([]);
                router.reload({ only: ['invoices'] });
            } else {
                alert('Failed to delete invoices: ' + result.message);
            }
            
        } catch (error) {
            console.error('Error deleting invoices:', error);
            alert('Failed to delete invoices: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkMarkAsPaid = async () => {
        if (selectedInvoices.length === 0 || !companyId) return;
        
        const confirmPaid = window.confirm(
            t('invoice_table.confirm_bulk_mark_paid', { count: selectedInvoices.length })
        );
        
        if (!confirmPaid) return;
        
        try {
            setLoading(true);
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(`/companies/${companyId}/invoices/bulk-mark-paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ invoice_ids: selectedInvoices })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to mark invoices as paid: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                alert(`Successfully marked ${result.updated_count} invoice(s) as paid!`);
                setSelectedInvoices([]);
                router.reload({ only: ['invoices'] });
            } else {
                alert('Failed to mark invoices as paid: ' + result.message);
            }
            
        } catch (error) {
            console.error('Error marking invoices as paid:', error);
            alert('Failed to mark invoices as paid: ' + error.message);
        } finally {
            setLoading(false);
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
                
                <div className="flex justify-between space-x-2">
                    <button 
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                        onClick={() => openEditModal(invoice)}
                    >
                        <Edit className="w-3 h-3" />
                        <span>{t('invoice_table.edit')}</span>
                    </button>
                    <button 
                        className={`flex items-center space-x-1 px-3 py-1 rounded text-xs ${
                            invoice.status !== 'paid' 
                                ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={invoice.status === 'paid'}
                        onClick={() => invoice.status !== 'paid' && handleMarkAsPaid(invoice.id)}
                    >
                        <Check className="w-3 h-3" />
                        <span>{invoice.status !== 'paid' ? t('invoice_table.mark_paid') : t('invoice_table.paid')}</span>
                    </button>
                    <button 
                        className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100"
                        onClick={() => setDeleteConfirm(invoice)}
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('invoice_table.delete')}</span>
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
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                            <h3 className="text-lg font-bold text-gray-900">
                                {t('invoice_table.confirm_delete_title')}
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            {t('invoice_table.confirm_delete_message', {
                                invoice_number: deleteConfirm.invoice_number || t('invoice_table.no_number')
                            })}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                {t('invoice_table.cancel')}
                            </button>
                            <button
                                onClick={() => handleDeleteInvoice(deleteConfirm.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                disabled={loading}
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : t('invoice_table.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                {t('invoice_table.edit_invoice')} - {editModal.invoice_number}
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice_table.invoice_number')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="invoice_number"
                                        value={formData.invoice_number}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice_table.date')} *
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                
                                {/* Di dalam modal edit, tambahkan validasi */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('invoice_table.invoice_amount')} *
                                        </label>
                                        <input
                                            type="number"
                                            name="invoice_amount"
                                            value={formData.invoice_amount}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                            required
                                            min="0"
                                            max="999999999999"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('invoice_table.amount_due')} *
                                        </label>
                                        <input
                                            type="number"
                                            name="amount_due"
                                            value={formData.amount_due}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                            required
                                            min="0"
                                            max="999999999999"
                                            step="0.01"
                                        />
                                    </div>
                                
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice_table.status')} *
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="draft">{t('invoice_table.status_draft')}</option>
                                        <option value="unpaid">{t('invoice_table.status_unpaid')}</option>
                                        <option value="paid">{t('invoice_table.status_paid')}</option>
                                        <option value="cancelled">{t('invoice_table.status_cancelled')}</option>
                                        <option value="partial">{t('invoice_table.status_partial')}</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice_table.payment_terms')}
                                    </label>
                                    <input
                                        type="text"
                                        name="payment_terms"
                                        value={formData.payment_terms}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice_table.payment_type')}
                                    </label>
                                    <select
                                        name="payment_type"
                                        value={formData.payment_type}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">{t('invoice_table.select_payment_type')}</option>
                                        <option value="cash">Cash</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="check">Check</option>
                                        <option value="credit_card">Credit Card</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice_table.total')}
                                    </label>
                                    <input
                                        type="number"
                                        name="total"
                                        value={formData.total}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        PPN
                                    </label>
                                    <input
                                        type="number"
                                        name="ppn"
                                        value={formData.ppn}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        PPH
                                    </label>
                                    <input
                                        type="number"
                                        name="pph"
                                        value={formData.pph}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('invoice_table.note')}
                                </label>
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={closeEditModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                {t('invoice_table.cancel')}
                            </button>
                            <button
                                onClick={handleUpdateInvoice}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                                disabled={loading}
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {t('invoice_table.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                <button 
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                                    onClick={handleBulkMarkAsPaid}
                                    disabled={loading}
                                >
                                    <Check className="w-4 h-4 inline mr-1" />
                                    {t('invoice_table.mark_as_paid')}
                                </button>
                                <button 
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
                                    onClick={handleBulkDelete}
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4 inline mr-1" />
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
                                                    title={t('invoice_table.edit_invoice')}
                                                    className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                                    onClick={() => openEditModal(invoice)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title={t('invoice_table.mark_as_paid')}
                                                    className={`p-1 rounded ${
                                                        invoice.status !== 'paid' 
                                                            ? 'text-green-600 hover:text-green-900 hover:bg-green-50' 
                                                            : 'text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    disabled={invoice.status === 'paid' || loading}
                                                    onClick={() => invoice.status !== 'paid' && handleMarkAsPaid(invoice.id)}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title={t('invoice_table.delete_invoice')}
                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                                    onClick={() => setDeleteConfirm(invoice)}
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