import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import HeaderLayout from "@/Layouts/HeaderLayout";
import TableLayout from "@/Layouts/TableLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import { Link, usePage, router, useForm } from "@inertiajs/react";
import { Search, Filter, Calendar, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import DevelopmentPage from "../DevelopmentPage";

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
    Toast.fire({
        icon: icon,
        title: title
    });
};

export default function Index() {
    const { t } = useTranslation();
    const dev = false; // Ubah ke true untuk menampilkan halaman development
    if (dev) {
        return <DevelopmentPage />;
    }
    const { props } = usePage();

    // Show success message if exists
    useEffect(() => {
        if (props.flash?.success) {
            console.log('Flash message:', props.flash.success);
        }
    }, [props.flash]);

    // Get invoices and generate year options
    const invoices = props.invoices ?? [
        {
            id: 1,
            number: "INV-00001",
            date: "21-10-2024",
            company: "PT. Pumigas Indonesia",
            amount: 12000000,
            // total = amount + taxes
            total: 12000000 + 660000 + 120000,
            paid_amount: 6000000,
            tax: { ppn: 660000, pph: 120000 },
            due_amount: 6540000,
            status: "Draft",
        },
        {
            id: 2,
            number: "INV-00002",
            date: "28-10-2024",
            company: "PT. Pumigas Indonesia",
            amount: 12000000,
            total: 12000000 + 396000 + 72000,
            paid_amount: 3600000,
            tax: { ppn: 396000, pph: 72000 },
            due_amount: 3924000,
            status: "Paid",
        },
        {
            id: 3,
            number: "INV-00003",
            date: "11-11-2024",
            company: "China Communication Engineering Construction",
            amount: 12000000,
            total: 12000000 + 264000 + 48000,
            paid_amount: 2400000,
            tax: { ppn: 264000, pph: 48000 },
            due_amount: 2616000,
            status: "Unpaid",
        },
    ];

    // Use full invoice total (including taxes) for the dashboard totals. Fall back to `amount` if `total` is not available.
    const totalAmount = invoices.reduce((s, i) => s + (i.total ?? i.amount ?? 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const paidCount = invoices.filter((i) => i.status === "Paid").length;
    const unpaidCount = invoices.filter((i) => i.status === "Unpaid").length;
    const cancelledCount = invoices.filter((i) => i.status === "Cancelled").length;

    // Generate year options dynamically
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let year = currentYear; year >= 2020; year--) {
        yearOptions.push(year);
    }

    const formatRp = (value) =>
        value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

    // Months for filter
    const months = [
        { value: '', label: t('invoices.filters.all_months') || 'All Months' },
        { value: '1', label: 'Jan' },
        { value: '2', label: 'Feb' },
        { value: '3', label: 'Mar' },
        { value: '4', label: 'Apr' },
        { value: '5', label: 'May' },
        { value: '6', label: 'Jun' },
        { value: '7', label: 'Jul' },
        { value: '8', label: 'Aug' },
        { value: '9', label: 'Sep' },
        { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' },
        { value: '12', label: 'Dec' }
    ];

    // Filter state and helpers
    const { data, setData, get } = useForm({
        search: '',
        status: 'all',
        month: '',
        year: ''
    });

    const [localFilters, setLocalFilters] = useState({
        search: data.search || '',
        status: data.status || 'all',
        month: data.month || '',
        year: data.year || ''
    });

    useEffect(() => {
        setLocalFilters({
            search: data.search || '',
            status: data.status || 'all',
            month: data.month || '',
            year: data.year || ''
        });
    }, [data.search, data.status, data.month, data.year]);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
        setData(key, value);
    };

    const applyFilters = () => {
        get(route('invoice.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            data: {
                search: localFilters.search,
                status: localFilters.status !== 'all' ? localFilters.status : '',
                month: localFilters.month,
                year: localFilters.year
            }
        });
    };

    const resetFilters = () => {
        const defaultFilters = { search: '', status: 'all', month: '', year: '' };
        setLocalFilters(defaultFilters);
        setData(defaultFilters);
        router.get(route('invoice.index'), {}, {
            replace: true,
            preserveState: false,
            preserveScroll: true
        });
    };

    // Columns and table data for TableLayout
    const statusStyles = {
        Paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
        Unpaid: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
        Draft: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
        Cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
        Partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' }
    };

    const columns = [
        {
            key: 'no',
            label: t('invoices.table.no_date') || 'Invoice',
            render: (value, row, idx) => (
                <div>
                    <div className="text-teal-700 font-semibold hover:text-teal-900 cursor-pointer" onClick={() => handlePreview(row.original)}>{value}</div>
                    <div className="text-xs text-gray-500">{row.date}</div>
                </div>
            )
        },
        { key: 'company_name', label: t('invoices.table.company_name') || 'Company Name' },
        { key: 'amount', label: t('invoices.table.amount') || 'Invoice Amount' },
        { key: 'payment', label: t('invoices.table.payment') || 'Payment' },
        { key: 'tax', label: t('invoices.table.tax') || 'Tax' },
        { key: 'due_amount', label: t('invoices.table.due_amount') || 'Amount Due' },
        {
            key: 'status',
            label: t('invoices.table.status') || 'Status',
            render: (value, row) => {
                const nonEditableStatuses = ['Cancelled'];
                if (nonEditableStatuses.includes(value)) {
                    const classes = `text-xs font-bold py-1 px-2 rounded-lg border-2 ${statusStyles[value] ? statusStyles[value].border : 'border-gray-300'}`;
                    return <span className={classes}>{value}</span>;
                }

                return (
                    <select
                        value={value}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        className={`appearance-none text-xs font-bold py-1 px-2 rounded-lg border-2 focus:ring-0 cursor-pointer transition-all ${statusStyles[value] ? statusStyles[value].border + ' ' + statusStyles[value].text : 'border-gray-300'}`}
                    >
                        <option value="Draft">{t('invoices.stats.draft') || 'Draft'}</option>
                        <option value="Unpaid">{t('invoices.stats.unpaid') || 'Unpaid'}</option>
                        <option value="Partial">{t('invoices.stats.partial') || 'Partial'}</option>
                        <option value="Paid">{t('invoices.stats.paid') || 'Paid'}</option>
                        <option value="Cancelled">{t('invoices.stats.cancelled') || 'Cancelled'}</option>
                    </select>
                );
            }
        },
        {
            key: 'actions',
            label: t('invoices.table.actions') || 'Action',
            render: (value, row) => (
                <>
                    <button onClick={() => handleEditInvoice(row.id)} className="mr-2 text-gray-600 hover:text-gray-800">✎</button>
                    <button onClick={() => handleDeleteInvoice(row.id, row.no)} className="text-red-600 hover:text-red-800">🗑</button>
                </>
            )
        }
    ];

    const tableData = invoices.map(inv => ({
        id: inv.id,
        no: inv.number,
        date: inv.date,
        company_name: inv.company,
        amount: formatRp(inv.amount),
        payment: formatRp(inv.paid_amount || 0),
        tax: `PPN ${inv.tax?.ppn ? inv.tax.ppn.toLocaleString() : 0} / PPh ${inv.tax?.pph ? inv.tax.pph.toLocaleString() : 0}`,
        due_amount: formatRp(inv.due_amount),
        status: inv.status,
        original: inv
    }));

    const handlePreview = (invoice) => {
        // Navigate to invoice show/preview route
        router.visit(route("invoice.show", invoice.id));
    };

    const handleCreateInvoice = () => {
        router.visit(route("invoice.create"));
    };

    const handleEditInvoice = (id) => {
        router.visit(route("invoice.edit", id));
    };

    const handleDeleteInvoice = (id, number) => {
        if (confirm(`Are you sure you want to delete invoice ${number}?`)) {
            router.delete(route("invoice.destroy", id), {
                onSuccess: () => {
                    // Invoice deleted successfully
                },
                onError: (errors) => {
                    console.error("Delete failed:", errors);
                    alert("Failed to delete invoice");
                }
            });
        }
    };

    const handleStatusChange = (id, newStatus) => {
        router.patch(route("invoice.update-status", id), {
            status: newStatus
        }, {
            preserveScroll: true,
            onStart: () => {
                // optional: show spinner or feedback
            },
            onSuccess: (page) => {
                toast('Status updated to ' + newStatus.toUpperCase());
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
                toast('Failed to update status', 'error');
            }
        });
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">{t("invoices.title") || "INVOICE"}</h2>

            {/* Status Summary - styled like Quotations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 my-7">
                {/** compute summary and totals from invoices */}
                {(() => {
                    const statusColors = {
                        Paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
                        Unpaid: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
                        Draft: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
                        Cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
                        Partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' }
                    };

                    const summary = invoices.reduce((acc, inv) => {
                        acc[inv.status] = (acc[inv.status] || 0) + 1;
                        return acc;
                    }, {});

                    const totalsByStatus = invoices.reduce((acc, inv) => {
                        const amount = (inv.total ?? inv.amount ?? 0);
                        acc[inv.status] = (acc[inv.status] || 0) + amount;
                        return acc;
                    }, {});

                    return Object.entries(statusColors).map(([status, colors]) => (
                        <div 
                            key={status}
                            className={`rounded-xl p-4 sm:p-5 shadow-sm border ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md min-h-[110px] flex flex-col justify-between`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}>
                                        {t(`invoices.stats.${status.toLowerCase()}`) || status}
                                    </p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                        {summary[status] || 0}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${colors.bg} ${colors.text}`}>
                                    <div className={`w-3 h-3 rounded-full ${colors.text.replace('text-', 'bg-')}`}></div>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600 font-semibold truncate">
                                    {formatRp(totalsByStatus[status] || 0)}
                                </p>
                            </div>
                        </div>
                    ));
                })()}
            </div>

            {/* Filter & Actions - Quotation style */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('invoices.filters.search_placeholder')}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('invoices.filters.search_placeholder')}
                                value={localFilters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:flex lg:space-x-4 gap-4">
                        <div className="lg:w-40">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('invoices.filters.status')}
                            </label>
                            <select
                                value={localFilters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                            >
                                <option value="all">{t('invoices.filters.all_status')}</option>
                                <option value="Paid">{t('invoices.stats.paid')}</option>
                                <option value="Unpaid">{t('invoices.stats.unpaid')}</option>
                                <option value="Draft">{t('invoices.stats.draft')}</option>
                                <option value="Partial">{t('invoices.stats.partial')}</option>
                                <option value="Cancelled">{t('invoices.stats.cancelled')}</option>
                            </select>
                        </div>

                        <div className="lg:w-40">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('invoices.filters.month')}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={localFilters.month}
                                    onChange={(e) => handleFilterChange('month', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                                >
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="lg:w-32">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('invoices.filters.year')}
                            </label>
                            <select
                                value={localFilters.year}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                            >
                                <option value="">{t('invoices.filters.all_years')}</option>
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2.5 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] flex items-center gap-2 transition-colors justify-center text-sm font-medium"
                        >
                            <Filter className="w-4 h-4" />
                            {t('invoices.filters.apply')}
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center text-sm font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t('invoices.filters.reset')}
                        </button>
                        <PrimaryButton onClick={handleCreateInvoice} className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg">
                            <span>{t('invoices.button_add') || 'Add Invoice'}</span>
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            {/* Table - use TableLayout for consistent look */}
            <div className="py-8">
                <div className="overflow-x-auto -mx-4 px-4">
                    <TableLayout
                        data={tableData}
                        columns={columns}
                        onEdit={handleEditInvoice}
                        onDelete={handleDeleteInvoice}
                        showAction={true}
                    />
                </div>
            </div>
        </div>
    );
}

Index.layout = (page) => <HeaderLayout>{page}</HeaderLayout>;
