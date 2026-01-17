import React, { useState, useEffect, useMemo } from 'react';
import { 
    CreditCard, Calendar, DollarSign, Building, 
    FileText, Landmark, MessageSquare, Receipt, Edit,
    Download, Eye, Trash2, CheckCircle, X, Save, AlertCircle,
    Loader, Search, Filter, ChevronDown, TrendingUp, Percent,
    RefreshCw
} from 'lucide-react';

const PaymentTable = ({ data: initialData, companyId, showInvoiceAmount = false }) => {
    // State untuk data payments
    const [payments, setPayments] = useState(initialData || []);
    const [loading, setLoading] = useState(false);
    
    // State untuk UI
    const [expandedNote, setExpandedNote] = useState(null);
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
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedPayments, setSelectedPayments] = useState([]);
    const [notification, setNotification] = useState({
        show: false,
        type: 'success',
        message: ''
    });

    // Update payments ketika initialData berubah
    useEffect(() => {
        setPayments(initialData || []);
    }, [initialData]);

    // Show notification
    const showNotification = (type, message) => {
        setNotification({
            show: true,
            type,
            message
        });
        setTimeout(() => {
            setNotification({ show: false, type: 'success', message: '' });
        }, 3000);
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return '-';
        }
    };

    // Filter dan sort data
    const filteredData = useMemo(() => {
        return payments
            .filter(payment => {
                const matchesSearch = searchTerm === '' || 
                    (payment.invoice_number && payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (payment.invoice?.invoice_number && payment.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (payment.bank && payment.bank.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (payment.note && payment.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (payment.method && payment.method.toLowerCase().includes(searchTerm.toLowerCase()));
                
                const matchesMethod = methodFilter === 'all' || 
                    payment.method?.toLowerCase() === methodFilter;
                
                return matchesSearch && matchesMethod;
            })
            .sort((a, b) => {
                if (sortBy === 'date') {
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                }
                if (sortBy === 'amount') {
                    const amountA = Number(a.amount || 0);
                    const amountB = Number(b.amount || 0);
                    return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
                }
                return 0;
            });
    }, [payments, searchTerm, methodFilter, sortBy, sortOrder]);

    // Get invoice number
    const getInvoiceNumber = (payment) => {
        return payment.invoice?.invoice_number || `INV-${payment.invoice_id?.substring(0, 8) || 'N/A'}`;
    };

    // Get method badge
    const getMethodBadge = (method) => {
        const methodStr = (method || '').toLowerCase();
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
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

    // ==================== EDIT PAYMENT ====================
    const openEditModal = (payment) => {
        setSelectedPayment(payment);
        
        // Format date untuk input
        let formattedDate = '';
        if (payment.date) {
            try {
                const date = new Date(payment.date);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    formattedDate = `${year}-${month}-${day}`;
                }
            } catch (error) {
                const today = new Date();
                formattedDate = today.toISOString().split('T')[0];
            }
        } else {
            const today = new Date();
            formattedDate = today.toISOString().split('T')[0];
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

    const handleEditPayment = async () => {
        if (!selectedPayment || !companyId) {
            showNotification('error', 'Missing data');
            return;
        }

        // Validasi
        if (!formData.amount || !formData.date) {
            setErrors({ amount: !formData.amount ? 'Amount is required' : '', date: !formData.date ? 'Date is required' : '' });
            return;
        }

        setLoading(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            // Gunakan fetch dengan header X-Requested-With: XMLHttpRequest
            const response = await fetch(`/companies/${companyId}/payments/${selectedPayment.id}`, {
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

            const result = await response.json();
            
            if (result.success) {
                // OPTIMISTIC UPDATE: Update local state
                const updatedPayment = {
                    ...selectedPayment,
                    amount: formData.amount,
                    method: formData.method,
                    date: formData.date,
                    bank: formData.bank,
                    note: formData.note,
                    updated_at: new Date().toISOString()
                };

                setPayments(prev => prev.map(p => 
                    p.id === selectedPayment.id ? updatedPayment : p
                ));
                
                showNotification('success', result.message || 'Payment updated successfully');
                setShowEditModal(false);
                setSelectedPayment(null);
                
                // Refresh data setelah beberapa detik
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } else {
                setErrors(result.errors || {});
                showNotification('error', result.message || 'Failed to update payment');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('error', 'Network error');
        } finally {
            setLoading(false);
        }
    };

    // ==================== DELETE PAYMENT ====================
    const openDeleteModal = (payment) => {
        setSelectedPayment(payment);
        setShowDeleteModal(true);
    };

    const handleDeletePayment = async () => {
        if (!selectedPayment || !companyId) {
            showNotification('error', 'Missing data');
            return;
        }

        setLoading(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(`/companies/${companyId}/payments/${selectedPayment.id}`, {
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
                // OPTIMISTIC UPDATE: Remove from local state
                setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
                
                // Update selected payments
                setSelectedPayments(prev => prev.filter(id => id !== selectedPayment.id));
                
                showNotification('success', result.message || 'Payment deleted successfully');
                setShowDeleteModal(false);
                setSelectedPayment(null);
                
                // Refresh data setelah beberapa detik
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } else {
                showNotification('error', result.message || 'Failed to delete payment');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('error', 'Network error');
        } finally {
            setLoading(false);
        }
    };

    // ==================== BULK DELETE ====================
    const handleBulkDelete = async () => {
        if (selectedPayments.length === 0) {
            showNotification('warning', 'No payments selected');
            return;
        }

        if (!window.confirm(`Delete ${selectedPayments.length} payment(s)?`)) {
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
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ payment_ids: selectedPayments })
            });

            const result = await response.json();
            
            if (result.success) {
                // OPTIMISTIC UPDATE: Remove all selected
                setPayments(prev => prev.filter(p => !selectedPayments.includes(p.id)));
                setSelectedPayments([]);
                
                showNotification('success', result.message || 'Payments deleted successfully');
                
                // Refresh data setelah beberapa detik
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } else {
                showNotification('error', result.message || 'Failed to delete payments');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('error', 'Network error');
        } finally {
            setLoading(false);
        }
    };

    // ==================== HANDLE SELECTION ====================
    const handleSelectAll = () => {
        if (selectedPayments.length === filteredData.length && filteredData.length > 0) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(filteredData.map(p => p.id));
        }
    };

    const handleSelectPayment = (id) => {
        setSelectedPayments(prev => 
            prev.includes(id) 
                ? prev.filter(paymentId => paymentId !== id)
                : [...prev, id]
        );
    };

    // Calculate statistics
    const totalPayments = payments.length;
    const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const transferCount = payments.filter(p => p.method?.toLowerCase() === 'transfer').length;
    const cashCount = payments.filter(p => p.method?.toLowerCase() === 'cash').length;
    const checkCount = payments.filter(p => p.method?.toLowerCase() === 'check').length;

    // Empty state
    if (payments.length === 0) {
        return (
            <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No payments found
                </h3>
                <p className="text-gray-500">
                    There are no payments recorded yet.
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Notification */}
            {notification.show && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                    <div className="flex items-center">
                        {notification.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 mr-2" />
                        ) : (
                            <AlertCircle className="w-5 h-5 mr-2" />
                        )}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Payment History
                </h2>
                <p className="text-sm text-gray-600">
                    {totalPayments} payment{totalPayments !== 1 ? 's' : ''} • {formatCurrency(totalReceived)} total
                </p>
            </div>

            {/* Search & Filter */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search payments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <div className="w-full sm:w-48">
                        <select
                            value={methodFilter}
                            onChange={(e) => setMethodFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        >
                            <option value="all">All Methods</option>
                            <option value="transfer">Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                        </select>
                    </div>
                </div>
                
                {/* Bulk Actions */}
                {selectedPayments.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">
                                    {selectedPayments.length} selected
                                </span>
                            </div>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={loading}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-1" />
                                )}
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                <input
                                    type="checkbox"
                                    checked={selectedPayments.length === filteredData.length && filteredData.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-blue-600 rounded"
                                    disabled={loading}
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Invoice
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Method
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Bank
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Notes
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedPayments.includes(payment.id)}
                                        onChange={() => handleSelectPayment(payment.id)}
                                        className="h-4 w-4 text-blue-600 rounded"
                                        disabled={loading}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">
                                        {getInvoiceNumber(payment)}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {formatDate(payment.date)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-bold text-green-700">
                                        {formatCurrency(payment.amount)}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {getMethodBadge(payment.method)}
                                </td>
                                <td className="px-4 py-3">
                                    {payment.bank || '-'}
                                </td>
                                <td className="px-4 py-3 max-w-[200px]">
                                    <div className="text-sm text-gray-600 truncate">
                                        {payment.note || '-'}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => openEditModal(payment)}
                                            disabled={loading}
                                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded disabled:opacity-50"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(payment)}
                                            disabled={loading}
                                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
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

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Received</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalReceived)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Transfers</p>
                    <p className="text-2xl font-bold text-gray-900">{transferCount}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Cash</p>
                    <p className="text-2xl font-bold text-gray-900">{cashCount}</p>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Edit Payment</h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    disabled={loading}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                                        required
                                        disabled={loading}
                                    />
                                    {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Method *
                                    </label>
                                    <select
                                        value={formData.method}
                                        onChange={(e) => setFormData({...formData, method: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        disabled={loading}
                                    >
                                        <option value="transfer">Transfer</option>
                                        <option value="cash">Cash</option>
                                        <option value="check">Check</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className={`w-full px-3 py-2 border ${errors.date ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                                        required
                                        disabled={loading}
                                    />
                                    {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bank}
                                        onChange={(e) => setFormData({...formData, bank: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        rows="3"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    disabled={loading}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditPayment}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                                >
                                    {loading ? (
                                        <Loader className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                                <h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
                            </div>
                            
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to delete this payment?
                            </p>
                            
                            <div className="bg-gray-50 p-3 rounded mb-6">
                                <p className="font-medium">Invoice: {getInvoiceNumber(selectedPayment)}</p>
                                <p className="text-sm text-gray-500">
                                    {formatDate(selectedPayment.date)} • {formatCurrency(selectedPayment.amount)}
                                </p>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={loading}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeletePayment}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                                >
                                    {loading ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentTable;