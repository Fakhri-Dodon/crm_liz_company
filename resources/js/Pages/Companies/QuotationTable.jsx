// resources/js/Pages/Companies/QuotationTable.jsx
import React, { useState, useMemo } from "react";
import { FileText, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Link, router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import SubModuleTableLayout, { ExpandableTextCell, ExpandableAmountCell } from "@/Layouts/SubModuleTableLayout";

const QuotationTable = ({ data, groupedData = [], companyId, auth_permissions, filters = {} }) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState("table");
    const [deletingId, setDeletingId] = useState(null);

    const perms = auth_permissions || {}; 
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return t("quotation_table.currency_format", { amount: 0 });
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

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase() || '';
        
        const statusConfig = {
            'accepted': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓', label: t("quotation_table.status_accepted") },
            'approved': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓', label: t("quotation_table.status_accepted") },
            'sent': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '↗', label: t("quotation_table.status_sent") },
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⌛', label: t("quotation_table.status_pending") },
            'draft': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📝', label: t("quotation_table.status_draft") },
            'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: '✗', label: t("quotation_table.status_cancelled") },
            'cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: '✗', label: t("quotation_table.status_cancelled") },
            'expired': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⌛', label: t("quotation_table.status_expired") },
            'revised': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '↻', label: t("quotation_table.status_revised") }
        };

        const config = Object.entries(statusConfig).find(([key]) => 
            statusLower.includes(key)
        )?.[1] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '', label: status || t("quotation_table.status_unknown") };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.icon && <span className="mr-1">{config.icon}</span>}
                {config.label}
            </span>
        );
    };

    const handleEdit = (row) => {
        router.visit(route("quotation.edit", row.id));
    };

    const handleDelete = async (row) => {
        if (!window.confirm(t("quotation_table.confirm_delete", { number: row.quotation_number }))) return;
        
        setDeletingId(row.id);
        router.delete(route("quotation.destroy", row.id), {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setDeletingId(null),
        });
    };

    // Calculate statistics
    const totalValue = data.reduce((sum, q) => sum + (q.total || 0), 0);
    const acceptedCount = data.filter(q => 
        q.status === "accepted" || q.status === "approved"
    ).length;

    // Prepare columns
    const columns = useMemo(() => [
        {
            key: 'quotation_number',
            label: t("quotation_table.quotation_number"),
            width: '150px',
            render: (value, row) => (
                <div className="font-medium text-gray-900">
                    <div>{value}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {formatDate(row.date)}
                    </div>
                </div>
            )
        },
        {
            key: 'date',
            label: t("quotation_table.date"),
            width: '120px',
            className: 'hidden lg:table-cell',
            render: (value) => (
                <div className="text-sm text-gray-600">
                    {formatDate(value)}
                </div>
            )
        },
        {
            key: 'subject',
            label: t("quotation_table.subject"),
            width: '250px',
            render: (value) => (
                <ExpandableTextCell 
                    text={value || t("quotation_table.not_available")} 
                    maxLength={50} 
                />
            )
        },
        {
            key: 'lead',
            label: t("quotation_table.lead"),
            width: '200px',
            render: (value) => {
                if (!value) return t("quotation_table.not_available");
                const leadName = typeof value === 'object' ? value.company_name : value;
                return <ExpandableTextCell text={leadName} maxLength={30} />;
            }
        },
        {
            key: 'total',
            label: t("quotation_table.amount"),
            width: '180px',
            render: (value) => (
                <ExpandableAmountCell 
                    amount={value} 
                    formatFunction={formatCurrency} 
                />
            )
        },
        {
            key: 'status',
            label: t("quotation_table.status"),
            width: '130px',
            render: (value) => getStatusBadge(value)
        }
    ], [t]);

    // Grouped View Component
    const GroupedView = () => {
        const [expandedGroup, setExpandedGroup] = useState({});

        const toggleGroup = (leadId) => {
            setExpandedGroup(prev => ({
                ...prev,
                [leadId]: !prev[leadId]
            }));
        };

        return (
            <div className="space-y-3">
                {groupedData.map((group) => (
                    <div key={group.lead_id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div 
                            className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleGroup(group.lead_id)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Users className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">{group.lead_name}</div>
                                        <div className="text-sm text-gray-600">
                                            {group.count} quotations • {formatCurrency(group.total_value)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {getStatusBadge(group.latest_status)}
                                    {expandedGroup[group.lead_id] ? (
                                        <ChevronUp className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {expandedGroup[group.lead_id] && (
                            <div className="border-t border-gray-200 bg-white">
                                <div className="p-3">
                                    <SubModuleTableLayout
                                        columns={columns}
                                        data={group.quotations}
                                        onEdit={canUpdate ? handleEdit : undefined}
                                        onDelete={canDelete ? handleDelete : undefined}
                                        showAction={canUpdate || canDelete}
                                        showHeader={false}
                                        showFooter={false}
                                        pagination={null}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header with View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{t("quotation_table.quotation_list")}</h2>
                    <p className="text-sm text-gray-600">
                        {t("quotation_table.quotation_count", { 
                            count: data.length, 
                            leadCount: groupedData.length 
                        })}
                    </p>
                </div>

                {groupedData.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{t("quotation_table.view")}:</span>
                        <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
                            <button 
                                onClick={() => setViewMode("table")}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    viewMode === "table" 
                                        ? "bg-gray-900 text-white" 
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("quotation_table.view_table")}
                            </button>
                            <button 
                                onClick={() => setViewMode("grouped")}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    viewMode === "grouped" 
                                        ? "bg-gray-900 text-white" 
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {t("quotation_table.view_by_lead")}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Statistics Cards */}
            {data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">{t("quotation_table.total_quotations")}</div>
                        <div className="text-2xl font-bold text-gray-900">{data.length}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">{t("quotation_table.total_leads")}</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {groupedData.length || t("quotation_table.not_available")}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">{t("quotation_table.total_value")}</div>
                        <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(totalValue)}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">{t("quotation_table.accepted")}</div>
                        <div className="text-2xl font-bold text-gray-900">{acceptedCount}</div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {data.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("quotation_table.no_quotations_found")}
                    </h3>
                    <p className="text-gray-600">
                        {t("quotation_table.no_quotations_message")}
                    </p>
                </div>
            ) : (
                <>
                    {viewMode === "grouped" && groupedData.length > 0 ? (
                        <GroupedView />
                    ) : (
                        <SubModuleTableLayout
                            columns={columns}
                            data={data}
                            onEdit={canUpdate ? handleEdit : undefined}
                            onDelete={canDelete ? handleDelete : undefined}
                            showAction={canUpdate || canDelete}
                            tableTitle=""
                            showHeader={false}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default QuotationTable;