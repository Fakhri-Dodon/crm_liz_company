import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import HeaderLayout from "@/Layouts/HeaderLayout";
import { Head, router, useForm } from "@inertiajs/react";
import TableLayout from "@/Layouts/TableLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import { Search, Filter, Calendar, RefreshCw, FileText, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import axios from "axios";

export const toast = (title, icon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({ icon: icon, title: title });
};

export default function PaymentIndex({ payments = [], stats = {}, filters = {}, auth_permissions }) {
    const { t } = useTranslation();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [deletingPayment, setDeletingPayment] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [processing, setProcessing] = useState(false);

    const canRead = auth_permissions.can_read === 1;
    const canCreate = auth_permissions.can_create === 1;
    const canUpdate = auth_permissions.can_update === 1;
    const canDelete = auth_permissions.can_delete === 1;
    
    const [formData, setFormData] = useState({
        invoice_id: "",
        company_name: "",
        amount: "",
        method: "transfer",
        date: "",
        bank: "",
        note: ""
    });

    const paymentMethods = [t("payments.method.transfer"), t("payments.method.cash"), t("payments.method.check")];
    const months = [
        { value: '', label: t('payments.filters.all_months') || 'All Months' },
        { value: '1', label: t("payments.month.january") }, { value: '2', label: t("payments.month.february") }, { value: '3', label: t("payments.month.march") }, { value: '4', label: t("payments.month.april") },
        { value: '5', label: t("payments.month.may") }, { value: '6', label: t("payments.month.june") }, { value: '7', label: t("payments.month.july") }, { value: '8', label: t("payments.month.august") },
        { value: '9', label: t("payments.month.september") }, { value: '10', label: t("payments.month.october") }, { value: '11', label: t("payments.month.november") }, { value: '12', label: t("payments.month.december") }
    ];

    // Small colors/config to mimic Project card style ✅
    const statColors = {
        total_payment: {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            border: 'border-blue-200',
            icon: '📊'
        },
        transfer: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-200',
            icon: '💸'
        },
        cash: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            border: 'border-yellow-200',
            icon: '💵'
        },
        check: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-200',
            icon: '🧾'
        }
    };

    const methodsToShow = ['total_payment', 'transfer', 'cash', 'check'];

    // Filter state (useForm + localFilters for UI)
    const { data, setData, get } = useForm({
        keyword: filters.keyword || '',
        method: filters.method || 'all',
        month: filters.month || '',
        year: filters.year || ''
    });

    const [localFilters, setLocalFilters] = useState({
        keyword: data.keyword || '',
        method: data.method || 'all',
        month: data.month || '',
        year: data.year || ''
    });

    useEffect(() => {
        setLocalFilters({
            keyword: data.keyword || '',
            method: data.method || 'all',
            month: data.month || '',
            year: data.year || ''
        });
    }, [data.keyword, data.method, data.month, data.year]);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
        setData(key, value);
    };

    const applyFilters = () => {
        get(route('payment.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            data: {
                keyword: localFilters.keyword,
                method: localFilters.method !== 'all' ? localFilters.method : '',
                month: localFilters.month,
                year: localFilters.year
            }
        });
    };

    const resetFilters = () => {
        const defaultFilters = { keyword: '', method: 'all', month: '', year: '' };
        setLocalFilters(defaultFilters);
        setData(defaultFilters);
        router.get(route('payment.index'), {}, { replace: true, preserveState: false, preserveScroll: true });
    };

    // Table columns and data
    // Currency formatter (declare before using it in table data)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID").format(amount);
    };

    const columns = [
        { key: 'no', label: t('payments.table.no_date') || 'No & Date', render: (value, row) => (
            <div>
                <div className="text-blue-600 font-semibold">{value}</div>
                <div className="text-xs text-gray-500">{row.date}</div>
            </div>
        ) },
        { key: 'invoice', label: t('payments.table.invoice') },
        { key: 'date', label: t('payments.table.date') },
        { key: 'company_name', label: t('payments.table.company_name') },
        { key: 'amount', label: t('payments.table.amount') },
        { key: 'method', label: t('payments.table.method') },
        { key: 'bank', label: t('payments.table.bank') },
        { key: 'note', label: t('payments.table.note') },
        
    ];

    const tableData = payments.map((p) => ({
        id: p.id,
        no: p.invoice_number || `#${p.id}`,
        date: p.payment_date,
        invoice: p.invoice_number,
        company_name: p.company_name || 'N/A',
        amount: `Rp ${formatCurrency(p.amount)}`,
        method: p.methode,
        bank: p.bank || '-',
        note: p.note || '-',
        original: p
    }));

    // Load invoices when modal opens
    useEffect(() => {
        if (showAddModal && !editingPayment) {
            loadInvoices();
        }
    }, [showAddModal]);

    const loadInvoices = async () => {
        try {
            const response = await axios.get(route('payment.get-invoices'));
            setInvoices(response.data);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        }
    };

    const handleAddPayment = () => {
        setEditingPayment(null);
        setSelectedInvoice(null);
        setFormData({
            invoice_id: "",
            company_name: "",
            amount: "",
            method: "transfer",
            date: "",
            bank: "",
            note: ""
        });
        setShowAddModal(true);
    };

    const handleInvoiceChange = (invoiceId) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            setSelectedInvoice(invoice);
            setFormData(prev => ({
                ...prev,
                invoice_id: invoiceId,
                company_name: invoice.company_name,
                amount: invoice.remaining_amount || (invoice.total_amount - invoice.paid_amount)
            }));
        }
    };

    const handleEditPayment = async (payment) => {
        setEditingPayment(payment);
        // Helper untuk memastikan invoice yang diedit ada di list
        const syncInvoiceData = (invoicesList) => {
            let invoice = invoicesList.find(inv => inv.id === payment.invoice_id);
            // Jika invoice tidak ada di list, tambahkan manual
            if (!invoice && payment.invoice_id) {
                invoice = {
                    id: payment.invoice_id,
                    invoice_number: payment.invoice_number,
                    company_name: payment.company_name,
                    remaining_amount: payment.amount,
                    total_amount: payment.amount,
                    paid_amount: 0
                };
                invoicesList = [...invoicesList, invoice];
                setInvoices(invoicesList);
            }
            setSelectedInvoice(invoice || null);
            setFormData({
                invoice_id: payment.invoice_id || "",
                company_name: invoice ? invoice.company_name : payment.company_name,
                amount: payment.amount,
                method: payment.methode ? payment.methode.toLowerCase() : "transfer",
                date: payment.payment_date ? payment.payment_date.split('-').reverse().join('-') : "", // Convert from dd-mm-yyyy to yyyy-mm-dd
                bank: payment.bank || "",
                note: payment.note || ""
            });
        };

        if (invoices.length > 0) {
            syncInvoiceData(invoices);
            setShowAddModal(true);
        } else {
            // Load invoices dulu jika belum ada
            try {
                const response = await axios.get(route('payment.get-invoices'));
                syncInvoiceData(response.data);
                setShowAddModal(true);
            } catch (error) {
                // fallback: gunakan data payment saja
                setFormData({
                    invoice_id: payment.invoice_id || "",
                    company_name: payment.company_name,
                    amount: payment.amount,
                    method: payment.methode ? payment.methode.toLowerCase() : "transfer",
                    date: payment.payment_date ? payment.payment_date.split('-').reverse().join('-') : "",
                    bank: payment.bank || "",
                    note: payment.note || ""
                });
                setShowAddModal(true);
            }
        }
    };

    const handleDeletePayment = (payment) => {
        setDeletingPayment(payment);
        setShowDeleteModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        const submitData = {
            invoice_id: formData.invoice_id,
            amount: formData.amount,
            method: formData.method,
            date: formData.date,
            bank: formData.bank,
            note: formData.note,
        };

        if (editingPayment) {
            router.patch(route('payment.update', editingPayment.id), submitData, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddModal(false);
                    setProcessing(false);
                },
                onError: () => {
                    setProcessing(false);
                }
            });
        } else {
            router.post(route('payment.store'), submitData, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddModal(false);
                    setProcessing(false);
                },
                onError: () => {
                    setProcessing(false);
                }
            });
        }
    };

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(route('payment.destroy', deletingPayment.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingPayment(null);
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <HeaderLayout>
            <Head title={t("payments.title")}/>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{t("payments.title")}</h1>
                    {canCreate && (
                        <button
                            onClick={handleAddPayment}
                            className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-md transition-colors"
                        >
                            {t("payments.button_add")}
                        </button>
                    )}
                </div>

                {/* Stats Cards (updated style similar to Project) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {methodsToShow.map((key) => {
                        const colors = statColors[key];
                        const label = key === 'total_payment' ? t('payments.title') : t(`payments.method.${key}`);
                        const count = key === 'total_payment' ? (stats.total_payment?.count || 0) : (stats[key]?.count || 0);
                        const amount = key === 'total_payment' ? (stats.total_payment?.amount || 0) : (stats[key]?.amount || 0);

                        return (
                            <div key={key} className={`rounded-xl p-5 shadow-sm border ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}>
                                            {label}
                                        </p>
                                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                            {count}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Rp {formatCurrency(amount)}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${colors.bg}`}>
                                        <span className="text-lg">{colors.icon}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters & Actions - Quotation style */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                        {/* Search Input */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.filters.search_placeholder')}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder={t('payments.filters.search_placeholder')}
                                    value={localFilters.keyword}
                                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:flex lg:space-x-4 gap-4">
                            <div className="lg:w-40">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.filters.method')}</label>
                                <select value={localFilters.method} onChange={(e) => handleFilterChange('method', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm">
                                    <option value="all">{t('payments.filters.all_methods') || 'All Methods'}</option>
                                    {paymentMethods.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="lg:w-40">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.filters.month')}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <select value={localFilters.month} onChange={(e) => handleFilterChange('month', e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm">
                                        {months.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="lg:w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.filters.year')}</label>
                                <select value={localFilters.year} onChange={(e) => handleFilterChange('year', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm">
                                    <option value="">{t('payments.filters.all_years') || 'All Years'}</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button onClick={applyFilters} className="px-4 py-2.5 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] flex items-center gap-2 transition-colors justify-center text-sm font-medium"><Filter className="w-4 h-4" />{t('payments.filters.apply')}</button>
                            <button onClick={resetFilters} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center text-sm font-medium"><RefreshCw className="w-4 h-4" />{t('payments.filters.reset')}</button>
                            
                        </div>
                    </div>
                </div>

                {/* Table - use TableLayout for consistent look */}
                <div className="py-4">
                    <div className="overflow-x-auto -mx-4 px-4">
                        <TableLayout
                            data={tableData}
                            columns={columns}
                            onEdit={canUpdate ? handleEditPayment : null}
                            onDelete={canDelete ? handleDeletePayment : null}
                            showAction={canUpdate || canDelete}
                        />
                    </div>
                </div>

                {showAddModal && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                        <div className="relative min-h-screen flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#005954]/10 rounded-lg">
                                            <FileText className="w-6 h-6 text-[#005954]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">{editingPayment ? t("payments.edit_title") : t("payments.add_title")}</h2>
                                            <p className="text-sm text-gray-500 mt-1">{editingPayment ? (t("payments.edit_subtitle") || 'Update payment details') : (t("payments.add_subtitle") || 'Create a new payment')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        disabled={processing}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("payments.table.invoice")}<span className="text-red-500">*</span>
                                        </label>

                                        {editingPayment ? (
                                            <input
                                                type="text"
                                                value={
                                                    (selectedInvoice && selectedInvoice.invoice_number ? selectedInvoice.invoice_number + ' - ' : (editingPayment.invoice_number ? editingPayment.invoice_number + ' - ' : '')) +
                                                    (selectedInvoice && selectedInvoice.company_name ? selectedInvoice.company_name : (editingPayment.company_name || 'No Company'))
                                                }
                                                disabled
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-sm"
                                            />
                                        ) : (
                                            <select
                                                value={formData.invoice_id}
                                                onChange={(e) => handleInvoiceChange(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent text-sm"
                                                required
                                            >
                                                <option value="">{t("payments.select_invoice") || "Select Invoice"}</option>
                                                {(() => {
                                                    let invoiceOptions = invoices.slice();
                                                    if (editingPayment && formData.invoice_id) {
                                                        const alreadyInList = invoiceOptions.some(inv => inv.id === formData.invoice_id);
                                                        if (!alreadyInList) {
                                                            invoiceOptions.push({
                                                                id: formData.invoice_id,
                                                                invoice_number: editingPayment.invoice_number,
                                                                company_name: editingPayment.company_name,
                                                                remaining_amount: editingPayment.amount,
                                                                total_amount: editingPayment.amount,
                                                                paid_amount: 0
                                                            });
                                                        }
                                                    }
                                                    if (invoiceOptions.length > 0) {
                                                        return invoiceOptions.map((invoice) => (
                                                            <option key={invoice.id} value={invoice.id}>
                                                                {invoice.invoice_number} - {invoice.company_name || 'No Company'} (Remaining: Rp {formatCurrency(invoice.remaining_amount || invoice.total_amount - invoice.paid_amount)})
                                                            </option>
                                                        ));
                                                    } else {
                                                        return <option value="" disabled>{t("payments.no_unpaid_invoice") || "No unpaid invoices available"}</option>;
                                                    }
                                                })()}
                                            </select>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("payments.table.company_name")}</label>
                                        <input type="text" value={formData.company_name} disabled placeholder="Appears when selecting invoice" className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-sm" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("payments.table.amount")}<span className="text-red-500">*</span></label>
                                        <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="Rp." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent text-sm" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("payments.table.method")}<span className="text-red-500">*</span></label>
                                        <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent text-sm" required>
                                            <option value="transfer">{t("payments.method.transfer")}</option>
                                            <option value="cash">{t("payments.method.cash")}</option>
                                            <option value="check">{t("payments.method.check")}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("payments.table.date")}<span className="text-red-500">*</span></label>
                                        <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent text-sm" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("payments.table.bank")}</label>
                                        <input type="text" value={formData.bank} onChange={(e) => setFormData({ ...formData, bank: e.target.value })} placeholder="Bank name and branch" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent text-sm" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("payments.table.note")}</label>
                                        <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} rows="3" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent min-h-[100px] resize-none text-sm" />
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                                        <button type="button" onClick={() => setShowAddModal(false)} disabled={processing} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1">{t("payments.close") || "CANCEL"}</button>
                                        <button type="submit" disabled={processing} className="px-6 py-3 bg-[#005954] text-white rounded-xl hover:bg-[#004d47] transition-colors font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md">{processing ? (t("payments.processing") || "PROCESSING...") : (t("payments.submit") || "SUBMIT")}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                        <div className="relative min-h-screen flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#005954]/10 rounded-lg">
                                            <span className="text-[#005954]"><FiTrash2 className="w-5 h-5" /></span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{t("payments.delete_title") || "Delete Payment"}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{t("payments.delete_confirm") || "Are you sure?"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDeleteModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" disabled={processing}>
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="border border-gray-300 rounded-md p-4 mb-6">
                                        <p className="text-red-600 text-center">
                                            {t("payments.delete_warning") || "Do you really want to delete this payment permanently. You cannot undo this action"}
                                        </p>
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                                        <button onClick={() => setShowDeleteModal(false)} disabled={processing} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1">{t("payments.no") || "NO"}</button>
                                        <button onClick={confirmDelete} disabled={processing} className="px-6 py-3 bg-[#005954] text-white rounded-xl hover:bg-[#004d47] transition-colors font-medium flex-1 disabled:opacity-50">{processing ? (t("payments.deleting") || "DELETING...") : (t("payments.yes") || "YES")}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HeaderLayout>
    );
}