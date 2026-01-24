// resources/js/Pages/Companies/QuotationTable.jsx
import React, { useState, useMemo } from "react";
import { FileText, Search, Filter, Calendar, RefreshCw } from "lucide-react";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import SubModuleTableLayout, { ExpandableTextCell, ExpandableAmountCell } from "@/Layouts/SubModuleTableLayout";

const QuotationTable = ({ data, statusOptions = [], companyId, auth_permissions, filters = {}, summary = {}, totals = {}, years = [] }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(filters?.status || "all");
    const [monthFilter, setMonthFilter] = useState(filters?.month || "");
    const [yearFilter, setYearFilter] = useState(filters?.year || "");
    const [deletingId, setDeletingId] = useState(null);

    const perms = auth_permissions || {}; 
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return `Rp 0`;
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return t("quotation_table.not_available");
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        } catch {
            return dateString;
        }
    };

    // Fungsi untuk mengambil informasi status - MIRIP DENGAN QoutationsIndex
    const getStatusInfo = (row) => {
        // Prioritas 1: Ambil dari relasi langsung di data row (status_rel)
        if (row.status_rel) {
            return {
                name: row.status_rel.name,
                color: row.status_rel.color,
                is_system: row.status_rel.is_system || false
            };
        }
        
        // Prioritas 2: Cari di statusOptions berdasarkan ID
        const statusId = row.quotation_statuses_id;
        if (statusId && statusOptions.length > 0) {
            const status = statusOptions.find(s => s.id === statusId);
            if (status) {
                return {
                    name: status.name,
                    color: status.color,
                    is_system: status.is_system || false
                };
            }
        }
        
        // Fallback
        return {
            name: "Unknown",
            color: "#9ca3af",
            is_system: false
        };
    };

    // Status badge component - disederhanakan (non-clickable)
    const getStatusBadge = (row) => {
        const statusInfo = getStatusInfo(row);
        const { name, color } = statusInfo;
        
        return (
            <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                style={{ 
                    backgroundColor: `${color}15`,
                    color: color,
                    border: `1px solid ${color}`
                }}
            >
                {name}
            </span>
        );
    };

    const handleEdit = (row) => {
        if (row && row.id) {
            router.visit(`/quotation/edit/${row.id}`);
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm(t("quotation_table.confirm_delete", { number: row.quotation_number }))) return;
        
        setDeletingId(row.id);
        try {
            await router.delete(`/quotation/${row.id}`, {
                preserveScroll: true,
                preserveState: true,
            });
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setDeletingId(null);
        }
    };

    // Filter data berdasarkan filters
    const filteredData = useMemo(() => {
        return data.filter(quotation => {
            const matchesSearch = !searchTerm || 
                (quotation.quotation_number && quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (quotation.subject && quotation.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (quotation.lead?.company_name && quotation.lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (quotation.company_contact_person?.name && quotation.company_contact_person.name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === "all" || 
                (quotation.quotation_statuses_id && quotation.quotation_statuses_id === statusFilter);

            const matchesMonth = !monthFilter || 
                (quotation.date && new Date(quotation.date).getMonth() + 1 === parseInt(monthFilter));

            const matchesYear = !yearFilter || 
                (quotation.date && new Date(quotation.date).getFullYear() === parseInt(yearFilter));

            return matchesSearch && matchesStatus && matchesMonth && matchesYear;
        });
    }, [data, searchTerm, statusFilter, monthFilter, yearFilter]);

    // Siapkan kolom
    const columns = useMemo(() => [
        {
            key: 'quotation_number',
            label: t("quotation_table.quotation_number"),
            width: '150px',
            render: (value, row) => (
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                        {value}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5 truncate">
                        {formatDate(row.date)}
                    </div>
                </div>
            )
        },
        {
            key: 'subject',
            label: t("quotation_table.subject"),
            width: '180px',
            render: (value) => (
                <ExpandableTextCell 
                    text={value || t("quotation_table.not_available")} 
                    maxLength={30}
                    className="text-xs"
                />
            )
        },
        {
            key: 'company_name',
            label: t("quotation_table.company_name"),
            width: '160px',
            render: (value, row) => {
                const companyName = row.lead?.company_name || value || t("quotation_table.not_available");
                const isClient = !!row.is_client;
                
                return (
                    <div className={`font-medium truncate ${isClient ? "text-blue-600" : "text-gray-900"} text-xs`}>
                        {companyName}
                    </div>
                );
            }
        },
        {
            key: 'contact',
            label: t("quotation_table.contact"),
            width: '130px',
            render: (value, row) => (
                <div className="text-gray-600 text-xs truncate">
                    {row.company_contact_person?.name || row.lead?.contact_person || value || "-"}
                </div>
            )
        },
        {
            key: 'created_by',
            label: t("quotation_table.created_by"),
            width: '120px',
            render: (value, row) => (
                <div className="text-gray-600 text-xs truncate">
                    {row.creator?.name || "Admin"}
                </div>
            )
        },
        {
            key: 'total',
            label: t("quotation_table.total"),
            width: '140px',
            render: (value, row) => {
                const taxValue = row.tax || 0;
                return (
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-xs">
                            {formatCurrency(value || 0)}
                        </div>
                        {taxValue > 0 && (
                            <div className="text-red-500 text-[10px] font-medium mt-0.5">
                                {t("quotation_table.ppn_total")}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: t("quotation_table.status"),
            width: '130px',
            render: (value, row) => getStatusBadge(row)
        }
    ], [t]);

    // Bulan untuk filter
    const months = [
        { value: "", label: t("quotation_table.all_months") },
        { value: "1", label: "Jan" },
        { value: "2", label: "Feb" },
        { value: "3", label: "Mar" },
        { value: "4", label: "Apr" },
        { value: "5", label: "May" },
        { value: "6", label: "Jun" },
        { value: "7", label: "Jul" },
        { value: "8", label: "Aug" },
        { value: "9", label: "Sep" },
        { value: "10", label: "Oct" },
        { value: "11", label: "Nov" },
        { value: "12", label: "Dec" },
    ];

    const handleApplyFilters = () => {
        const params = {
            search: searchTerm,
            status: statusFilter !== "all" ? statusFilter : "",
            month: monthFilter,
            year: yearFilter
        };
        
        // Anda bisa implementasikan filter submission di sini
        console.log("Applying filters:", params);
        // router.get(route("quotation.index"), params, { preserveState: true });
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setMonthFilter("");
        setYearFilter("");
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("quotation_table.no_quotations_found")}
                </h3>
                <p className="text-gray-600">
                    {t("quotation_table.no_quotations_message")}
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
                        {t("quotation_table.quotation_list")}
                    </h2>
                    <p className="text-gray-600 text-xs">
                        {t("quotation_table.quotation_count", { 
                            count: data.length,
                            filteredCount: filteredData.length
                        })}
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-3">
                    {/* Search Input */}
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <input
                                type="text"
                                placeholder={t("quotation_table.search_placeholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">{t("quotation_table.all_status")}</option>
                            {statusOptions?.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month Filter */}
                    <div>
                        <div className="relative">
                            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <select
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {months.map((month) => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Year Filter */}
                    <div>
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">{t("quotation_table.all_years")}</option>
                            {(years || []).map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyFilters}
                            className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                        >
                            <Filter className="w-3 h-3" />
                            {t("quotation_table.apply")}
                        </button>
                        <button
                            onClick={handleResetFilters}
                            className="flex-1 px-2 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" />
                            {t("quotation_table.reset")}
                        </button>
                    </div>
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

export default QuotationTable;