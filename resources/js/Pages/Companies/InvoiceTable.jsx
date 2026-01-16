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

    // State untuk announcement
    const [announcement, setAnnouncement] = useState({
        show: false,
        type: 'info',
        title: '',
        message: '',
        autoClose: true,
        duration: 5000
    });

    console.log('InvoiceTable data received:', data);

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
                                <span className="sr-only">Close</span>
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
                <span className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
                    {expanded ? full : full.slice(0, maxLength) + '...'}
                    <span className="ml-1 text-xs text-blue-500 underline">{expanded ? 'Sembunyikan' : 'Lihat'}</span>
                </span>
            </span>
        );
    };

    // Filter dan sort data
    const filteredData = data
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
        
        return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                {getStatusDisplay(status)}
            </span>
        );
    };

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

    // ==================== PERBAIKAN: openEditModal ====================
    const openEditModal = async (invoice) => {
        try {
            setFetchingInvoice(true);
            
            // PERBAIKAN: Gunakan URL yang benar
            const url = `/companies/${companyId}/invoices/${invoice.id}/get`;
            console.log('Fetching invoice from:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include' // TAMBAHKAN INI
            });
            
            const responseText = await response.text();
            console.log('Response status:', response.status);
            console.log('Response text:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error('Invalid server response');
            }
            
            if (!response.ok) {
                // Handle 403 Forbidden
                if (response.status === 403) {
                    showAnnouncement('error', 'Akses Ditolak', 'Anda tidak memiliki akses untuk mengedit invoice ini atau invoice tidak termasuk dalam perusahaan ini.', false);
                    return;
                }
                
                // Handle 404 Not Found
                if (response.status === 404) {
                    showAnnouncement('error', 'Data Tidak Ditemukan', 'Invoice tidak ditemukan.', false);
                    return;
                }
                
                throw new Error(result.message || `Server error: ${response.status}`);
            }
            
            if (result.success) {
                const freshInvoice = result.data;
                console.log('Fresh invoice data:', freshInvoice);
                
                setEditModal(freshInvoice);
                setFormData({
                    invoice_number: freshInvoice.invoice_number || '',
                    date: freshInvoice.date ? freshInvoice.date.split('T')[0] : '',
                    invoice_amount: freshInvoice.invoice_amount || freshInvoice.invoice_amout || '', // Handle kedua kemungkinan
                    amount_due: freshInvoice.amount_due || '',
                    status: freshInvoice.status || 'Draft',
                    payment_terms: freshInvoice.payment_terms || '',
                    payment_type: freshInvoice.payment_type || '',
                    note: freshInvoice.note || '',
                    ppn: freshInvoice.ppn || '',
                    pph: freshInvoice.pph || '',
                    total: freshInvoice.total || ''
                });
            } else {
                console.warn('API returned success false:', result.message);
                showAnnouncement('error', 'Gagal Memuat Data', 'Gagal memuat data invoice: ' + (result.message || 'Unknown error'), false);
            }
        } catch (error) {
            console.error('Error fetching invoice data:', error);
            showAnnouncement('error', 'Kesalahan', 'Terjadi kesalahan: ' + error.message, false);
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
            status: 'Draft',
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

    // ==================== PERBAIKAN: handleUpdateInvoice ====================
    const handleUpdateInvoice = async () => {
        if (!editModal || !companyId) {
            showAnnouncement('error', 'Error', 'Invalid data for update');
            return;
        }
        
        try {
            // Validasi
            if (!formData.invoice_number.trim()) {
                showAnnouncement('error', 'Validasi Gagal', 'Invoice number is required', false);
                return;
            }
            
            if (!formData.date) {
                showAnnouncement('error', 'Validasi Gagal', 'Date is required', false);
                return;
            }
            
            if (!formData.invoice_amount || parseFloat(formData.invoice_amount) <= 0) {
                showAnnouncement('error', 'Validasi Gagal', 'Invoice amount must be greater than 0', false);
                return;
            }
            
            if (parseFloat(formData.amount_due) < 0) {
                showAnnouncement('error', 'Validasi Gagal', 'Amount due cannot be negative', false);
                return;
            }
            
            setLoading(true);
            
            // PERBAIKAN: Gunakan URL yang benar sesuai route
            const url = `/companies/${companyId}/invoices/${editModal.id}`;
            console.log('Update invoice URL:', url);
            console.log('Update data:', formData);
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            console.log('CSRF Token exists:', !!csrfToken);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const responseText = await response.text();
            console.log('Response status:', response.status, response.statusText);
            console.log('Response text:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                throw new Error('Invalid server response');
            }

            if (!response.ok) {
                // Handle 403 error khusus
                if (response.status === 403) {
                    showAnnouncement('error', 'Akses Ditolak', 'Invoice tidak termasuk dalam perusahaan ini atau Anda tidak memiliki izin.', false);
                    return;
                }
                
                console.error('Response not OK:', response.status);
                throw new Error(`Failed to update invoice: ${result.message || 'Unknown error'}`);
            }
            
            if (result.success) {
                showAnnouncement('success', 'Berhasil!', 'Invoice berhasil diperbarui!');
                console.log('Update successful:', result);
                // Refresh data dengan Inertia
                router.reload({ 
                    only: ['invoices'], 
                    preserveScroll: true,
                    onSuccess: () => {
                        showAnnouncement('success', 'Berhasil!', 'Data invoice telah diperbarui.');
                    }
                });
            } else {
                showAnnouncement('error', 'Gagal', 'Gagal memperbarui invoice: ' + (result.message || 'Unknown error'), false);
                console.error('Update failed:', result);
            }
            
        } catch (error) {
            console.error('Error updating invoice:', error);
            showAnnouncement('error', 'Kesalahan Sistem', 'Failed to update invoice: ' + error.message, false);
        } finally {
            setLoading(false);
            closeEditModal();
        }
    };

    // ==================== PERBAIKAN: handleDeleteInvoice ====================
    const handleDeleteInvoice = async (invoiceId) => {
        if (!invoiceId || !companyId) {
            showAnnouncement('error', 'Error', 'Invalid invoice data');
            return;
        }
        
        try {
            setLoading(true);
            
            // PERBAIKAN: Gunakan URL yang benar
            const url = `/companies/${companyId}/invoices/${invoiceId}`;
            console.log('Delete invoice URL:', url);
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                
                // Handle 403 error
                if (response.status === 403) {
                    showAnnouncement('error', 'Akses Ditolak', 'Invoice tidak dapat dihapus karena tidak termasuk dalam perusahaan ini.', false);
                    return;
                }
                
                throw new Error(`Failed to delete invoice: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Delete result:', result);
            
            if (result.success) {
                showAnnouncement('success', 'Berhasil!', 'Invoice berhasil dihapus!');
                // Refresh data
                router.reload({ 
                    only: ['invoices'], 
                    preserveScroll: true,
                    onSuccess: () => {
                        showAnnouncement('success', 'Berhasil!', 'Invoice telah dihapus.');
                    }
                });
            } else {
                showAnnouncement('error', 'Gagal', 'Gagal menghapus invoice: ' + (result.message || 'Unknown error'), false);
            }
            
        } catch (error) {
            console.error('Error deleting invoice:', error);
            showAnnouncement('error', 'Kesalahan Sistem', 'Failed to delete invoice: ' + error.message, false);
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
        }
    };

    // ==================== PERBAIKAN: handleBulkDelete ====================
    const handleBulkDelete = async () => {
        if (selectedInvoices.length === 0 || !companyId) {
            showAnnouncement('warning', 'Peringatan', 'No invoices selected or company ID missing');
            return;
        }
        
        const confirmDelete = window.confirm(
            t('invoice_table.confirm_bulk_delete', { count: selectedInvoices.length })
        );
        
        if (!confirmDelete) return;
        
        try {
            setLoading(true);
            
            // PERBAIKAN: Gunakan URL yang benar
            const url = `/companies/${companyId}/invoices/bulk-delete`;
            console.log('Bulk delete URL:', url);
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(url, {
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

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                
                // Handle 403 error
                if (response.status === 403) {
                    showAnnouncement('error', 'Akses Ditolak', 'Salah satu invoice tidak dapat dihapus karena tidak termasuk dalam perusahaan ini.', false);
                    return;
                }
                
                throw new Error(`Failed to delete invoices: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Bulk delete result:', result);
            
            if (result.success) {
                showAnnouncement('success', 'Berhasil!', `Berhasil menghapus ${result.deleted_count} invoice!`);
                setSelectedInvoices([]);
                // Refresh data
                router.reload({ 
                    only: ['invoices'], 
                    preserveScroll: true,
                    onSuccess: () => {
                        showAnnouncement('success', 'Berhasil!', `${result.deleted_count} invoice telah dihapus.`);
                    }
                });
            } else {
                showAnnouncement('error', 'Gagal', 'Gagal menghapus invoices: ' + result.message, false);
            }
            
        } catch (error) {
            console.error('Error deleting invoices:', error);
            showAnnouncement('error', 'Kesalahan Sistem', 'Failed to delete invoices: ' + error.message, false);
        } finally {
            setLoading(false);
        }
    };

    // ==================== FUNGSI UNTUK PAYMENT (Jika diperlukan) ====================
    const handleEditPayment = async (paymentId, formData) => {
        if (!paymentId || !companyId) {
            console.error('Company ID or payment ID is missing');
            showAnnouncement('error', 'Error', 'Missing company ID or payment data');
            return;
        }

        setLoading(true);
        
        const url = `/companies/${companyId}/payments/${paymentId}`;
        console.log('Update payment URL:', url);
        console.log('Update data:', formData);
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            console.log('Update payment response status:', response.status);
            
            const result = await response.json();
            console.log('Update payment result:', result);
            
            if (!response.ok) {
                // Handle 403 error
                if (response.status === 403) {
                    showAnnouncement('error', 'Akses Ditolak', 'Payment tidak dapat diperbarui karena tidak termasuk dalam perusahaan ini.', false);
                    return;
                }
                
                throw new Error(result.message || `Server error: ${response.status}`);
            }
            
            if (result.success) {
                showAnnouncement('success', 'Berhasil!', 'Payment berhasil diperbarui!');
                // Refresh data
                router.reload({ 
                    only: ['payments'], 
                    preserveScroll: true 
                });
            } else {
                showAnnouncement('error', 'Gagal', 'Gagal memperbarui payment: ' + result.message, false);
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            showAnnouncement('error', 'Kesalahan Sistem', 'Failed to update payment: ' + error.message, false);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!paymentId || !companyId) {
            console.error('Company ID or payment ID is missing');
            showAnnouncement('error', 'Error', 'Missing company ID or payment data');
            return;
        }

        setLoading(true);
        
        const url = `/companies/${companyId}/payments/${paymentId}`;
        console.log('Delete payment URL:', url);
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('Delete payment response status:', response.status);
            
            const result = await response.json();
            console.log('Delete payment result:', result);
            
            if (!response.ok) {
                // Handle 403 error
                if (response.status === 403) {
                    showAnnouncement('error', 'Akses Ditolak', 'Payment tidak dapat dihapus karena tidak termasuk dalam perusahaan ini.', false);
                    return;
                }
                
                throw new Error(result.message || `Server error: ${response.status}`);
            }
            
            if (result.success) {
                showAnnouncement('success', 'Berhasil!', 'Payment berhasil dihapus!');
                // Refresh data
                router.reload({ 
                    only: ['payments'], 
                    preserveScroll: true 
                });
            } else {
                showAnnouncement('error', 'Gagal', 'Gagal menghapus payment: ' + result.message, false);
            }
        } catch (error) {
            console.error('Error deleting payment:', error);
            showAnnouncement('error', 'Kesalahan Sistem', 'Failed to delete payment: ' + error.message, false);
        } finally {
            setLoading(false);
        }
    };

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
                            onMouseEnter={() => setTooltip(formatCurrencyFull(invoice.invoice_amount))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            <ExpandableAmount amount={invoice.invoice_amount} />
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">{t('invoice_table.due')}</p>
                        <p 
                            className="text-sm font-bold text-red-600 cursor-help"
                            onMouseEnter={() => setTooltip(formatCurrencyFull(invoice.amount_due))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            <ExpandableAmount amount={invoice.amount_due} />
                        </p>
                    </div>
                </div>
                
                <div className="flex justify-between space-x-2">
                    <button 
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => openEditModal(invoice)}
                        disabled={loading || fetchingInvoice}
                    >
                        <Edit className="w-3 h-3" />
                        <span>{t('invoice_table.edit')}</span>
                    </button>
                    <button 
                        className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setDeleteConfirm(invoice)}
                        disabled={loading}
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('invoice_table.delete')}</span>
                    </button>
                </div>
            </div>
        );
    };

    if (!data || data.length === 0) {
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
            
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
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
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {t('invoice_table.cancel')}
                            </button>
                            <button
                                onClick={() => handleDeleteInvoice(deleteConfirm.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : t('invoice_table.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                {t('invoice_table.edit_invoice')} - {editModal.invoice_number}
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || fetchingInvoice}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {fetchingInvoice ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader className="w-8 h-8 animate-spin text-blue-600" />
                                <span className="ml-3 text-gray-600">Loading invoice data...</span>
                            </div>
                        ) : (
                            <form onSubmit={e => { e.preventDefault(); handleUpdateInvoice(); }}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Invoice Number *
                                            </label>
                                            <input
                                                type="text"
                                                name="invoice_number"
                                                value={formData.invoice_number}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Date *
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Invoice Amount *
                                            </label>
                                            <input
                                                type="number"
                                                name="invoice_amount"
                                                value={formData.invoice_amount}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                required
                                                min="0"
                                                step="0.01"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Amount Due *
                                            </label>
                                            <input
                                                type="number"
                                                name="amount_due"
                                                value={formData.amount_due}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                required
                                                min="0"
                                                step="0.01"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Terms
                                            </label>
                                            <input
                                                type="text"
                                                name="payment_terms"
                                                value={formData.payment_terms}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Type
                                            </label>
                                            <input
                                                type="text"
                                                name="payment_type"
                                                value={formData.payment_type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Note
                                            </label>
                                            <input
                                                type="text"
                                                name="note"
                                                value={formData.note}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status *
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                required
                                                disabled={loading}
                                            >
                                                <option value="Draft">Draft</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Unpaid">Unpaid</option>
                                                <option value="Partial">Partial</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                PPN
                                            </label>
                                            <input
                                                type="number"
                                                name="ppn"
                                                value={formData.ppn}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                min="0"
                                                step="0.01"
                                                disabled={loading}
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
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                min="0"
                                                step="0.01"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Total
                                            </label>
                                            <input
                                                type="number"
                                                name="total"
                                                value={formData.total}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                min="0"
                                                step="0.01"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={closeEditModal}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={loading}
                                        >
                                            {t('invoice_table.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={loading || fetchingInvoice}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin mr-2" />
                                                    {t('invoice_table.saving')}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {t('invoice_table.save')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {tooltip && (
                <div className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none">
                    {tooltip}
                </div>
            )}

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
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <div className="w-full sm:w-48">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
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
                                    {t('invoice_table.selected_count', {
                                        count: selectedInvoices.length,
                                        plural: selectedInvoices.length !== 1 ? 's' : ''
                                    })}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Desktop View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-[#eaf6f6]">
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">No</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Invoice</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Invoice Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Payment Term</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">PPN & PPh</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Amount Due</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map((invoice, idx) => {
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
                                                className="h-4 w-4 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loading}
                                            />
                                        </td>
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
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                <button 
                                                    title={t('invoice_table.edit_invoice')}
                                                    className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={() => openEditModal(invoice)}
                                                    disabled={loading || fetchingInvoice}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title={t('invoice_table.delete_invoice')}
                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={() => setDeleteConfirm(invoice)}
                                                    disabled={loading}
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
                            {data.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('invoice_table.match_filter', { count: filteredData.length })}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <p className="text-sm text-gray-600">{t('invoice_table.total_amount')}</p>
                        </div>
                        <p 
                            className="text-2xl font-bold text-gray-900 mt-2 cursor-help"
                            onMouseEnter={() => setTooltip(formatCurrencyFull(data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrencyFull(data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0))}
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
                            onMouseEnter={() => setTooltip(formatCurrencyFull(data.reduce((sum, i) => sum + (i.amount_due || 0), 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrencyFull(data.reduce((sum, i) => sum + (i.amount_due || 0), 0))}
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
                                setTooltip(`${t('invoice_table.ppn')}: ${formatCurrencyFull(totalPpn)}\n${t('invoice_table.pph')}: ${formatCurrencyFull(totalPph)}`);
                            }}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrencyFull(data.reduce((sum, i) => sum + (i.ppn || 0), 0))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('invoice_table.total_ppn')}</p>
                    </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.paid_invoices')}</p>
                        <p className="text-xl font-bold text-green-600">
                            {data.filter(i => i.status === 'Paid' || i.status === 'paid').length}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{t('invoice_table.unpaid_invoices')}</p>
                        <p className="text-xl font-bold text-yellow-600">
                            {data.filter(i => i.status === 'Unpaid' || i.status === 'unpaid').length}
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
                                setTooltip(formatCurrencyFull(avg));
                            }}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrencyFull(data.length > 0 
                                ? data.reduce((sum, i) => sum + (i.invoice_amount || 0), 0) / data.length 
                                : 0)}
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
                            <div>{t('invoice_table.total_from_api', { count: data.length })}</div>
                            <div>{t('invoice_table.filtered_invoices', { count: filteredData.length })}</div>
                            <div>Company ID: {companyId}</div>
                            <div>Loading: {loading ? 'Yes' : 'No'}</div>
                            <div>Fetching Invoice: {fetchingInvoice ? 'Yes' : 'No'}</div>
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