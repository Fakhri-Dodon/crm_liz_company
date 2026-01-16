// resources/js/Pages/Companies/PaymentTable.jsx
import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
    CreditCard, Calendar, DollarSign, Building, 
    FileText, Landmark, MessageSquare, Receipt, Edit,
    Download, Eye, Trash2, CheckCircle, X, Save, AlertCircle,
    Loader, Search, Filter, ChevronDown, TrendingUp, Percent
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentTable = ({ data: initialData, companyId, showInvoiceAmount = false }) => {
    const { t } = useTranslation();
    
    // State untuk data payments
    const [data, setData] = useState(initialData || []);
    const [localData, setLocalData] = useState(initialData || []);
    
    // State lainnya
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
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedPayments, setSelectedPayments] = useState([]);

    // State untuk announcement
    const [announcement, setAnnouncement] = useState({
        show: false,
        type: 'info',
        title: '',
        message: '',
        autoClose: true,
        duration: 5000
    });

    // Update local data ketika initialData berubah
    useEffect(() => {
        setData(initialData || []);
        setLocalData(initialData || []);
    }, [initialData]);

    console.log('PaymentTable data received:', data);

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

    // Format currency full untuk tooltip
    const formatCurrencyFull = (amount) => {
        if (!amount && amount !== 0) return t('payment_table.currency_format', { amount: 0 });
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

    // Filter dan sort data menggunakan localData
    const filteredData = localData
        .filter(payment => {
            const matchesSearch = searchTerm === '' || 
                (payment.invoice_number && payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (payment.invoice?.invoice_number && payment.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (payment.bank && payment.bank.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (payment.note && payment.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (payment.method && payment.method.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const paymentMethod = (payment.method || '').toLowerCase();
            let matchesMethod = false;
            
            if (methodFilter === 'all') {
                matchesMethod = true;
            } else {
                const methodMap = {
                    'transfer': ['transfer', 'bank_transfer'],
                    'cash': ['cash'],
                    'check': ['check']
                };
                
                if (methodMap[methodFilter]) {
                    matchesMethod = methodMap[methodFilter].includes(paymentMethod);
                } else {
                    matchesMethod = paymentMethod === methodFilter;
                }
            }
            
            return matchesSearch && matchesMethod;
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
                    const amountA = getPaymentAmount(a);
                    const amountB = getPaymentAmount(b);
                    return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
                }
                
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
                
            } catch (error) {
                console.error('Sorting error:', error);
                return 0;
            }
        });

    // Get invoice number - safely handle different data structures
    const getInvoiceNumber = (payment) => {
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
        if (payment.invoice?.invoice_amount !== undefined && payment.invoice.invoice_amount !== null) {
            return Number(payment.invoice.invoice_amount);
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

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const handleSelectAll = () => {
        if (selectedPayments.length === filteredData.length) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(filteredData.map(payment => payment.id));
        }
    };

    const handleSelectPayment = (id) => {
        setSelectedPayments(prev => 
            prev.includes(id) 
                ? prev.filter(paymentId => paymentId !== id)
                : [...prev, id]
        );
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

    // ==================== FUNGSI EDIT PAYMENT ====================
    const openEditModal = (payment) => {
        if (!companyId) {
            showAnnouncement('error', 'Error', 'Company ID is required for edit');
            return;
        }
        
        setSelectedPayment(payment);
        // Format date dari YYYY-MM-DD atau format lain ke YYYY-MM-DD
        let formattedDate = '';
        if (payment.date) {
            try {
                // Coba parse berbagai format tanggal
                const date = new Date(payment.date);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString().split('T')[0];
                } else {
                    // Coba format dd-mm-yyyy
                    const parts = payment.date.split('-');
                    if (parts.length === 3) {
                        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
            } catch (error) {
                console.error('Error parsing date:', error);
                formattedDate = new Date().toISOString().split('T')[0];
            }
        } else {
            formattedDate = new Date().toISOString().split('T')[0];
        }
        
        setFormData({
            amount: payment.amount || '',
            method: payment.method || 'transfer',
            date: formattedDate,
            bank: payment.bank || '',
            note: payment.note || '',
        });
        setErrors({});
        setShowEditModal(true);
    };

// Di dalam handleEditPayment dan openEditModal, pastikan method hanya memiliki nilai yang valid
const handleEditPayment = async () => {
    if (!selectedPayment || !companyId) {
        showAnnouncement('error', 'Error', 'Company ID or payment data is missing');
        return;
    }

    // Validasi sederhana
    if (!formData.amount || !formData.date) {
        showAnnouncement('error', 'Error', 'Amount and Date are required');
        return;
    }

    // PERBAIKAN: Validasi method
    const validMethods = ['transfer', 'cash', 'check'];
    if (!validMethods.includes(formData.method)) {
        showAnnouncement('error', 'Error', 'Invalid payment method');
        return;
    }

    setLoading(true);
    setErrors({});
    
    // Backup data lama
    const oldData = [...localData];
    
    try {
        // Update local state terlebih dahulu untuk immediate feedback
        const updatedPayment = {
            ...selectedPayment,
            amount: formData.amount,
            method: formData.method,
            date: formData.date,
            bank: formData.bank,
            note: formData.note,
            updated_at: new Date().toISOString()
        };

        const newData = localData.map(payment => 
            payment.id === selectedPayment.id ? updatedPayment : payment
        );
        
        setLocalData(newData);
        
        // Menggunakan fetch API
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const url = `/companies/${companyId}/payments/${selectedPayment.id}`;
        
        console.log('Updating payment via PUT:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                amount: formData.amount,
                method: formData.method, // Hanya 'transfer', 'cash', atau 'check'
                date: formData.date,
                bank: formData.bank,
                note: formData.note
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showAnnouncement('success', 'Success!', 'Payment updated successfully');
            
            // Update data utama
            setData(newData);
            // Langsung close modal
            setShowEditModal(false);
            setSelectedPayment(null);
            setFormData({
                amount: '',
                method: 'transfer',
                date: '',
                bank: '',
                note: '',
            });
        } else {
            // Jika gagal, restore data
            setLocalData(oldData);
            setErrors({ general: result.message || 'Failed to update payment' });
            showAnnouncement('error', 'Error', result.message || 'Failed to update payment', false);
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        // Restore data jika error
        setLocalData(oldData);
        showAnnouncement('error', 'Error', 'Failed to update payment: ' + error.message, false);
    } finally {
        setLoading(false);
    }
};


    // ==================== FUNGSI DELETE PAYMENT ====================
    const openDeleteModal = (payment) => {
        if (!companyId) {
            showAnnouncement('error', 'Error', 'Company ID is required for delete');
            return;
        }
        
        setSelectedPayment(payment);
        setShowDeleteModal(true);
    };

// ==================== FUNGSI DELETE PAYMENT DENGAN FETCH API ====================
const handleDeletePayment = async () => {
    if (!selectedPayment || !companyId) {
        showAnnouncement('error', 'Error', 'Company ID or payment data is missing');
        return;
    }

    setLoading(true);
    
    // Backup data lama
    const oldData = [...localData];
    
    try {
        // Update local state terlebih dahulu untuk immediate feedback
        const newData = localData.filter(payment => payment.id !== selectedPayment.id);
        setLocalData(newData);
        
        // Juga update selected payments jika payment yang dihapus ada di dalamnya
        if (selectedPayments.includes(selectedPayment.id)) {
            setSelectedPayments(prev => prev.filter(id => id !== selectedPayment.id));
        }
        
        // Menggunakan fetch API untuk menghindari error Inertia response
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const url = `/companies/${companyId}/payments/${selectedPayment.id}`;
        
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

        const result = await response.json();
        
        if (result.success) {
            showAnnouncement('success', 'Success!', 'Payment deleted successfully');
            
            // Update data utama
            setData(newData);
            // Langsung close modal
            setShowDeleteModal(false);
            setSelectedPayment(null);
        } else {
            // Jika gagal, restore data
            setLocalData(oldData);
            showAnnouncement('error', 'Error', result.message || 'Failed to delete payment', false);
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        // Restore data jika error
        setLocalData(oldData);
        showAnnouncement('error', 'Error', 'Failed to delete payment: ' + error.message, false);
    } finally {
        setLoading(false);
    }
};

 // ==================== Bulk Delete dengan Fetch API ====================
const handleBulkDelete = async () => {
    if (selectedPayments.length === 0 || !companyId) {
        showAnnouncement('warning', 'Warning', 'No payments selected or Company ID missing');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedPayments.length} payment(s)?`;
    
    if (!window.confirm(confirmMessage)) {
        return;
    }
    
    setLoading(true);
    
    // Backup data lama
    const oldData = [...localData];
    
    try {
        // Update local state terlebih dahulu untuk immediate feedback
        const newData = localData.filter(payment => !selectedPayments.includes(payment.id));
        setLocalData(newData);
        
        // Menggunakan fetch API untuk menghindari error Inertia response
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const url = `/companies/${companyId}/payments/bulk-delete`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ payment_ids: selectedPayments })
        });

        const result = await response.json();
        
        if (result.success) {
            showAnnouncement('success', 'Success!', 
                `Successfully deleted ${result.deleted_count || selectedPayments.length} payment(s)`);
            
            // Update data utama
            setData(newData);
            // Clear selection
            setSelectedPayments([]);
        } else {
            // Jika gagal, restore data
            setLocalData(oldData);
            showAnnouncement('error', 'Error', result.message || 'Failed to delete payments', false);
        }
    } catch (error) {
        console.error('Error bulk deleting payments:', error);
        // Restore data jika error
        setLocalData(oldData);
        showAnnouncement('error', 'Error', 'Failed to delete payments: ' + error.message, false);
    } finally {
        setLoading(false);
    }
};

    // Mobile Card View
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
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={selectedPayments.includes(payment.id)}
                            onChange={() => handleSelectPayment(payment.id)}
                            className="h-4 w-4 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        />
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
                                    <ExpandableAmount amount={invoiceAmount} maxLength={12} />
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
                                <ExpandableAmount amount={paymentAmount} maxLength={12} />
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
                
                {/* Action buttons */}
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                    <button 
                        onClick={() => openEditModal(payment)}
                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !companyId}
                        title={!companyId ? "Company ID missing" : "Edit Payment"}
                    >
                        <Edit className="w-3 h-3" />
                        <span>{t('payment_table.edit')}</span>
                    </button>
                    <button 
                        onClick={() => openDeleteModal(payment)}
                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-red-50 text-red-700 rounded-lg text-xs hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !companyId}
                        title={!companyId ? "Company ID missing" : "Delete Payment"}
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('payment_table.delete')}</span>
                    </button>
                </div>
                
                {/* Created/Updated info */}
                {(payment.created_by || payment.created_at) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between">
                            <div className="text-xs text-gray-500">
                                {payment.created_at ? `${formatDate(payment.created_at)}` : ''}
                            </div>
                            <div className="text-xs text-gray-500">
                                {payment.created_by?.name || 'System'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Empty State - update untuk menggunakan localData
    if (!localData || localData.length === 0) {
        return (
            <div className="text-center py-12">
                <AnnouncementModal />
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

    // Calculate statistics - update untuk menggunakan localData
    const totalPayments = localData.length;
    const totalReceived = localData.reduce((sum, p) => sum + getPaymentAmount(p), 0);
    const totalInvoiceValue = localData.reduce((sum, p) => sum + getInvoiceAmount(p), 0);
    const transferCount = localData.filter(p => ['transfer', 'bank_transfer'].includes((p.method || '').toLowerCase())).length;
    const cashCount = localData.filter(p => (p.method || '').toLowerCase() === 'cash').length;
    const checkCount = localData.filter(p => (p.method || '').toLowerCase() === 'check').length;
    const averagePayment = totalPayments > 0 ? totalReceived / totalPayments : 0;
    const paymentRatio = totalInvoiceValue > 0 ? (totalReceived / totalInvoiceValue) * 100 : 0;

    return (
        <div className="relative">
            <AnnouncementModal />
            
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

            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan invoice, bank, atau catatan..."
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
                                value={methodFilter}
                                onChange={(e) => setMethodFilter(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                <option value="all">Semua Metode</option>
                                <option value="transfer">Transfer Bank</option>
                                <option value="cash">Cash</option>
                                <option value="check">Check</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                {selectedPayments.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">
                                    {selectedPayments.length} payment dipilih
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleBulkDelete}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader className="w-4 h-4 animate-spin mr-1" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 inline mr-1" />
                                    )}
                                    Hapus yang dipilih
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile View */}
            <div className="sm:hidden">
                {filteredData.map((payment) => (
                    <MobileCardView key={payment.id} payment={payment} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-[#eaf6f6]">
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedPayments.length === filteredData.length && filteredData.length > 0}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-blue-600 rounded"
                                        disabled={loading}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    Invoice
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    Jumlah
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    Metode
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    Bank
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">
                                    Catatan
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map((payment) => {
                                const invoiceNumber = getInvoiceNumber(payment);
                                const invoiceAmount = getInvoiceAmount(payment);
                                const paymentAmount = getPaymentAmount(payment);
                                const paymentMethod = payment.method || payment.payment_method || 'unknown';
                                const bank = payment.bank || payment.bank_name || '-';
                                const note = payment.note || payment.notes || payment.description || '';
                                
                                return (
                                    <tr key={payment.id} className={`hover:bg-gray-50 ${selectedPayments.includes(payment.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedPayments.includes(payment.id)}
                                                onChange={() => handleSelectPayment(payment.id)}
                                                className="h-4 w-4 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loading}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-blue-900">
                                                {invoiceNumber}
                                            </div>
                                            {showInvoiceAmount && (
                                                <div className="text-xs text-gray-500">
                                                    Invoice: <ExpandableAmount amount={invoiceAmount} maxLength={12} />
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
                                                <ExpandableAmount amount={paymentAmount} maxLength={12} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getMethodBadge(paymentMethod)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">
                                                {bank}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <div 
                                                className={`text-gray-900 text-sm ${note.length > 50 ? 'cursor-pointer' : ''}`}
                                                onClick={() => note.length > 50 && toggleNote(payment.id)}
                                                title={note.length > 50 ? "Klik untuk melihat lengkap" : ""}
                                            >
                                                {expandedNote === payment.id ? 
                                                    note || '-' : 
                                                    (note.length > 50 ? 
                                                        `${note.substring(0, 50)}...` : 
                                                        note || '-'
                                                    )
                                                }
                                                {note.length > 50 && expandedNote !== payment.id && (
                                                    <span className="text-blue-600 text-xs ml-1">[+]</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => openEditModal(payment)}
                                                    className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Edit Payment"
                                                    disabled={loading || !companyId}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(payment)}
                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete Payment"
                                                    disabled={loading || !companyId}
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Ringkasan Payment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                            <p className="text-sm text-gray-600">Total Payment</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{totalPayments}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Cocok filter: {filteredData.length}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                            <p className="text-sm text-gray-600">Total Diterima</p>
                        </div>
                        <p 
                            className="text-2xl font-bold text-gray-900 mt-2 cursor-help"
                            onMouseEnter={(e) => handleTooltip(formatCurrencyFull(totalReceived), e)}
                            onMouseLeave={hideTooltip}
                        >
                            <ExpandableAmount amount={totalReceived} />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Semua payment</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                            <p className="text-sm text-gray-600">Transfer Bank</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{transferCount}</p>
                        <p className="text-xs text-gray-500 mt-1">{Math.round((transferCount / totalPayments) * 100) || 0}% dari total</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <Percent className="w-5 h-5 text-yellow-600 mr-2" />
                            <p className="text-sm text-gray-600">Rata-rata Payment</p>
                        </div>
                        <p 
                            className="text-2xl font-bold text-gray-900 mt-2 cursor-help"
                            onMouseEnter={(e) => handleTooltip(formatCurrencyFull(averagePayment), e)}
                            onMouseLeave={hideTooltip}
                        >
                            <ExpandableAmount amount={averagePayment} />
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Per payment</p>
                    </div>
                </div>
                
                {/* Additional Statistics Row */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Payment Cash</p>
                        <p className="text-xl font-bold text-green-600">{cashCount}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Payment Check</p>
                        <p className="text-xl font-bold text-purple-600">{checkCount}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Rasio Pembayaran</p>
                        <p className="text-xl font-bold text-blue-600">{Math.round(paymentRatio)}%</p>
                    </div>
                </div>
            </div>

            {/* Edit Payment Modal */}
            {showEditModal && selectedPayment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                Edit Payment
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedPayment(null);
                                    setErrors({});
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-900">
                                {getInvoiceNumber(selectedPayment)}
                            </div>
                            <div className="text-xs text-blue-700">
                                {formatDate(selectedPayment.date)} • {formatCurrency(selectedPayment.amount)}
                            </div>
                        </div>
                        
                        <form onSubmit={e => { e.preventDefault(); handleEditPayment(); }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jumlah *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                            Rp
                                        </span>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className={`w-full pl-10 pr-3 py-2 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                        Metode *
                                    </label>
                                    <select
                                        value={formData.method}
                                        onChange={(e) => setFormData({...formData, method: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.method ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        disabled={loading}
                                    >
                                        <option value="transfer">Transfer Bank</option>
                                        <option value="cash">Cash</option>
                                        <option value="check">Check</option>
                                    </select>
                                    {errors.method && (
                                        <p className="mt-1 text-xs text-red-600">{errors.method}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.date ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        required
                                        disabled={loading}
                                    />
                                    {errors.date && (
                                        <p className="mt-1 text-xs text-red-600">{errors.date}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bank}
                                        onChange={(e) => setFormData({...formData, bank: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.bank ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        placeholder="Contoh: BCA, Mandiri"
                                        disabled={loading}
                                    />
                                    {errors.bank && (
                                        <p className="mt-1 text-xs text-red-600">{errors.bank}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catatan
                                    </label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.note ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        rows="3"
                                        placeholder="Catatan tambahan..."
                                        disabled={loading}
                                    />
                                    {errors.note && (
                                        <p className="mt-1 text-xs text-red-600">{errors.note}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedPayment(null);
                                        setErrors({});
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !companyId}
                                    className="px-4 py-2 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin mr-2" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Update
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedPayment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                            <h3 className="text-lg font-bold text-gray-900">
                                Konfirmasi Hapus
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Anda yakin ingin menghapus payment ini?
                        </p>
                        
                        <div className="bg-gray-50 p-3 rounded mb-4">
                            <p className="text-sm font-medium text-gray-900">
                                {getInvoiceNumber(selectedPayment)}
                            </p>
                            <p className="text-sm text-gray-500">
                                {formatDate(selectedPayment.date)} • {formatCurrency(selectedPayment.amount)}
                            </p>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Tindakan ini tidak dapat dibatalkan. Data payment akan dihapus permanen.
                            </p>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedPayment(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeletePayment}
                                disabled={loading || !companyId}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <details>
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                            Debug Info
                        </summary>
                        <div className="mt-2 text-xs text-gray-600 space-y-2">
                            <div>Total payments: {localData.length}</div>
                            <div>Filtered payments: {filteredData.length}</div>
                            <div>Company ID: {companyId}</div>
                            <div>Loading: {loading ? 'Yes' : 'No'}</div>
                            <div>Selected: {selectedPayments.length} payments</div>
                        </div>
                    </details>
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