import React, { useState, useEffect } from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import { Head, router } from "@inertiajs/react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import axios from "axios";

export default function PaymentIndex({ payments = [], stats = {}, filters = {} }) {
    const [keyword, setKeyword] = useState(filters.keyword || "");
    const [selectedMethod, setSelectedMethod] = useState(filters.method || "Transfer");
    const [selectedMonth, setSelectedMonth] = useState(filters.month || "January");
    const [selectedYear, setSelectedYear] = useState(filters.year || "2024");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [deletingPayment, setDeletingPayment] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [processing, setProcessing] = useState(false);
    
    const [formData, setFormData] = useState({
        invoice_id: "",
        company_name: "",
        amount: "",
        method: "transfer",
        date: "",
        bank: "",
        note: ""
    });

    const paymentMethods = ["Transfer", "Cash", "Check"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID").format(amount);
    };

    const handleSearch = () => {
        router.get(route('payment.index'), {
            keyword,
            method: selectedMethod,
            month: selectedMonth,
            year: selectedYear
        }, {
            preserveState: true,
            preserveScroll: true,
        });
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

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
        setFormData({
            invoice_id: payment.invoice_id || "",
            company_name: payment.company_name,
            amount: payment.amount,
            method: payment.methode.toLowerCase(),
            date: payment.payment_date.split('-').reverse().join('-'), // Convert from dd-mm-yyyy to yyyy-mm-dd
            bank: payment.bank || "",
            note: payment.note || ""
        });
        setShowAddModal(true);
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
            <Head title="Payment" />
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">PAYMENT</h1>
                    <button
                        onClick={handleAddPayment}
                        className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-md transition-colors"
                    >
                        Add Payment
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border-2 border-blue-500 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-blue-600 font-semibold text-lg">Payment</h3>
                                <p className="text-gray-600 text-sm">Total Payment</p>
                            </div>
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-semibold">
                                {stats.total_payment?.count || 0}
                            </span>
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                            Rp {formatCurrency(stats.total_payment?.amount || 0)}
                        </div>
                    </div>

                    <div className="bg-white border-2 border-green-500 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-green-600 font-semibold text-lg">Transfer</h3>
                                <p className="text-gray-600 text-sm">Total Payment</p>
                            </div>
                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-semibold">
                                {stats.transfer?.count || 0}
                            </span>
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                            Rp {formatCurrency(stats.transfer?.amount || 0)}
                        </div>
                    </div>

                    <div className="bg-white border-2 border-yellow-500 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-yellow-600 font-semibold text-lg">Chash</h3>
                                <p className="text-gray-600 text-sm">Total Payment</p>
                            </div>
                            <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full font-semibold">
                                {stats.cash?.count || 0}
                            </span>
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                            Rp {stats.cash?.amount > 0 ? formatCurrency(stats.cash.amount) : "-"}
                        </div>
                    </div>

                    <div className="bg-white border-2 border-red-500 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-red-600 font-semibold text-lg">Check</h3>
                                <p className="text-gray-600 text-sm">Total Payment</p>
                            </div>
                            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">
                                {stats.check?.count || 0}
                            </span>
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                            Rp {stats.check?.amount > 0 ? formatCurrency(stats.check.amount) : "-"}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Keyword"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <button className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-md transition-colors" onClick={handleSearch}>
                                Search
                            </button>
                        </div>

                        <div>
                            <select
                                value={selectedMethod}
                                onChange={(e) => setSelectedMethod(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                {paymentMethods.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                            <label className="text-xs text-gray-600 ml-1">Methode</label>
                        </div>

                        <div>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                            <label className="text-xs text-gray-600 ml-1">Month</label>
                        </div>

                        <div>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                            <label className="text-xs text-gray-600 ml-1">Year</label>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg overflow-hidden shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-green-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        <div>Company Name</div>
                                        <div className="text-xs font-normal text-gray-600">Click to view Client-Profile</div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ammount</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Methode</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bank</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Note</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {payments.length > 0 ? payments.map((payment, index) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="text-blue-600 font-medium">{payment.invoice_number}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{payment.payment_date}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {payment.company_id ? (
                                                <a 
                                                    href={route('companies.show', payment.company_id)}
                                                    className="text-blue-600 cursor-pointer hover:underline"
                                                >
                                                    {payment.company_name}
                                                </a>
                                            ) : (
                                                <span>{payment.company_name}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div>Rp</div>
                                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {payment.methode}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{payment.bank || '-'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="text-red-600">{payment.note || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditPayment(payment)}
                                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <FiEdit2 className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayment(payment)}
                                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <FiTrash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                            No payment data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Payment Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-xl">
                            <div className="bg-teal-700 text-white px-6 py-4 rounded-t-lg">
                                <h2 className="text-xl font-semibold">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Invoice<span className="text-red-500">*</span>
                                        </label>
                                        {editingPayment ? (
                                            <input
                                                type="text"
                                                value={formData.company_name}
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                                            />
                                        ) : (
                                            <select
                                                value={formData.invoice_id}
                                                onChange={(e) => handleInvoiceChange(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                required
                                            >
                                                <option value="">Select Invoice</option>
                                                {invoices.length > 0 ? (
                                                    invoices.map((invoice) => (
                                                        <option key={invoice.id} value={invoice.id}>
                                                            {invoice.invoice_number} - {invoice.company_name || 'No Company'} (Remaining: Rp {formatCurrency(invoice.remaining_amount || invoice.total_amount - invoice.paid_amount)})
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>No unpaid invoices available</option>
                                                )}
                                            </select>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.company_name}
                                            disabled
                                            placeholder="Appears when selecting invoice"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Ammount<span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="Rp."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Methode<span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.method}
                                            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            required
                                        >
                                            <option value="transfer">Transfer</option>
                                            <option value="cash">Cash</option>
                                            <option value="check">Check</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Payment Date<span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Bank
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bank}
                                            onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                                            placeholder="Bank name and branch"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Note
                                        </label>
                                        <textarea
                                            value={formData.note}
                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        disabled={processing}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        CLOSE
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors disabled:opacity-50"
                                    >
                                        {processing ? 'PROCESSING...' : 'SUBMIT'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-md">
                            <div className="bg-teal-700 text-white px-6 py-4 rounded-t-lg">
                                <h2 className="text-xl font-semibold">Delete Payment</h2>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-center mb-4">Are you sure?</h3>
                                <div className="border border-gray-300 rounded-md p-4 mb-6">
                                    <p className="text-red-600 text-center">
                                        Do you really want to delete this payment permanently. You cannot undo this action
                                    </p>
                                </div>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={confirmDelete}
                                        disabled={processing}
                                        className="px-8 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors disabled:opacity-50"
                                    >
                                        {processing ? 'DELETING...' : 'YES'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={processing}
                                        className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        NO
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HeaderLayout>
    );
}
