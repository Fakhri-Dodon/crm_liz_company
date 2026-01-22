// resources/js/Pages/Companies/QuotationTable.jsx
import React, { useState } from "react";
import { FileText, Calendar, Users, ChevronDown, ChevronUp, Edit, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { Link, router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";

const QuotationTable = ({ data, groupedData = [], companyId, auth_permissions }) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState("table");
    const [expandedLead, setExpandedLead] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [expandedAmounts, setExpandedAmounts] = useState({});
    const [expandedSubjects, setExpandedSubjects] = useState({});

    const perms = auth_permissions || {}; 
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return t("quotation_table.currency_format", { amount: 0 });
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    };

    const toggleAmount = (id) => {
        setExpandedAmounts(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleSubject = (id) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const formatAmountDisplay = (amount, id, showFull = false) => {
        const formatted = formatCurrency(amount);
        const isExpanded = expandedAmounts[id];
        
        // Jika teks pendek atau dalam mode expanded, tampilkan penuh
        if (showFull || isExpanded || formatted.length <= 20) {
            return formatted;
        }
        
        // Potong teks dan tambahkan indikator
        return `${formatted.substring(0, 20)}...`;
    };

    const formatSubjectDisplay = (subject, id) => {
        if (!subject) return t("quotation_table.not_available");
        const isExpanded = expandedSubjects[id];
        
        // Jika teks pendek atau dalam mode expanded, tampilkan penuh
        if (isExpanded || subject.length <= 30) {
            return subject;
        }
        
        // Potong teks dan tambahkan indikator
        return `${subject.substring(0, 30)}...`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return t("quotation_table.not_available");
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium";
        const statusLower = status?.toLowerCase() || '';
        
        if (statusLower.includes('accepted') || statusLower.includes('approved')) {
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>✓ {t("quotation_table.status_accepted")}</span>;
        }
        if (statusLower.includes('sent')) {
            return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>↗ {t("quotation_table.status_sent")}</span>;
        }
        if (statusLower.includes('pending')) {
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>⌛ {t("quotation_table.status_pending")}</span>;
        }
        if (statusLower.includes('draft')) {
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>📝 {t("quotation_table.status_draft")}</span>;
        }
        if (statusLower.includes('rejected') || statusLower.includes('cancelled')) {
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>✗ {t("quotation_table.status_cancelled")}</span>;
        }
        if (statusLower.includes('expired')) {
            return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>⌛ {t("quotation_table.status_expired")}</span>;
        }
        if (statusLower.includes('revised')) {
            return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>↻ {t("quotation_table.status_revised")}</span>;
        }
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status || t("quotation_table.status_unknown")}</span>;
    };

    const handleDelete = async (id, quotationNumber) => {
        if (!window.confirm(t("quotation_table.confirm_delete", { number: quotationNumber }))) return;
        
        setDeletingId(id);
        router.delete(route("quotation.destroy", id), {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const MobileCardView = ({ quotation }) => {
        const isAmountExpanded = expandedAmounts[quotation.id];
        const formattedAmount = formatCurrency(quotation.total);
        
        return (
            <div className="bg-white border border-gray-200 rounded p-2 mb-2 hover:bg-gray-50 text-xs">
                <div className="grid grid-cols-12 gap-1 items-center">
                    <div className="col-span-4">
                        <div className="font-semibold text-gray-900 truncate" title={quotation.quotation_number}>
                            {quotation.quotation_number}
                        </div>
                        <div className="text-[10px] text-gray-500">{formatDate(quotation.date)}</div>
                    </div>
                    <div className="col-span-3">
                        <div className="text-gray-700 truncate" title={quotation.subject}>
                            {formatSubjectDisplay(quotation.subject, quotation.id)}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{quotation.lead?.company_name || t("quotation_table.not_available")}</div>
                    </div>
                    <div className="col-span-3">
                        <div className="flex items-center justify-end gap-1">
                            <div 
                                className={`font-semibold text-gray-900 ${isAmountExpanded ? 'text-left' : 'text-right truncate'}`}
                                title={formattedAmount}
                            >
                                {formatAmountDisplay(quotation.total, quotation.id)}
                            </div>
                            {formattedAmount.length > 20 && (
                                <button 
                                    onClick={() => toggleAmount(quotation.id)}
                                    className="p-0.5 text-gray-400 hover:text-gray-600"
                                    title={isAmountExpanded ? t("quotation_table.collapse") : t("quotation_table.expand")}
                                >
                                    {isAmountExpanded ? (
                                        <Minimize2 className="w-3 h-3" />
                                    ) : (
                                        <Maximize2 className="w-3 h-3" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="col-span-2">
                        {getStatusBadge(quotation.status)}
                    </div>
                </div>
                {(canUpdate || canDelete) && (
                    <div className="flex gap-1 mt-1 pt-1 border-t border-gray-100">
                        {canUpdate && (
                            <Link href={route("quotation.edit", quotation.id)} className="flex-1 text-center px-1 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] hover:bg-blue-100">
                                {t("quotation_table.edit")}
                            </Link>
                        )}
                        {canDelete && (
                            <button onClick={() => handleDelete(quotation.id, quotation.quotation_number)} disabled={deletingId === quotation.id} className="flex-1 text-center px-1 py-0.5 bg-red-50 text-red-700 rounded text-[10px] hover:bg-red-100 disabled:opacity-50">
                                {t("quotation_table.delete")}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const EmptyState = () => (
        <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">{t("quotation_table.no_quotations_found")}</h3>
            <p className="text-xs text-gray-600">{t("quotation_table.no_quotations_message")}</p>
        </div>
    );

    return (
        <div className="text-sm">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-900">{t("quotation_table.quotation_list")}</h2>
                    <p className="text-xs text-gray-600">
                        {t("quotation_table.quotation_count", { count: data.length, leadCount: groupedData.length })}
                    </p>
                </div>

                {groupedData.length > 0 && data.length > 0 && (
                    <div className="flex border border-gray-300 rounded overflow-hidden">
                        <button onClick={() => setViewMode("table")} className={`px-2 py-1 text-xs ${viewMode === "table" ? "bg-gray-200" : "bg-white"}`}>
                            {t("quotation_table.view_all")}
                        </button>
                        <button onClick={() => setViewMode("grouped")} className={`px-2 py-1 text-xs ${viewMode === "grouped" ? "bg-gray-200" : "bg-white"}`}>
                            {t("quotation_table.view_by_lead")}
                        </button>
                    </div>
                )}
            </div>

            {data.length === 0 && <EmptyState />}

            {/* Mobile View */}
            <div className="sm:hidden">
                {data.length > 0 && viewMode === "grouped" && groupedData.length > 0 ? (
                    <div className="space-y-2">
                        {groupedData.map((group) => (
                            <div key={group.lead_id} className="bg-white border border-gray-200 rounded overflow-hidden">
                                <div className="p-2 bg-gray-50 cursor-pointer" onClick={() => setExpandedLead(expandedLead === group.lead_id ? null : group.lead_id)}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-gray-600" />
                                            <span className="font-medium text-gray-900 text-xs">{group.lead_name}</span>
                                            <span className="text-[10px] text-gray-600">({group.count})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {getStatusBadge(group.latest_status)}
                                            {expandedLead === group.lead_id ? (
                                                <ChevronUp className="w-3 h-3 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3 text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {expandedLead === group.lead_id && (
                                    <div className="p-1 border-t border-gray-200">
                                        {group.quotations.map((quotation) => (
                                            <MobileCardView key={quotation.id} quotation={quotation} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : data.length > 0 && (
                    <div>
                        {data.map((quotation) => (
                            <MobileCardView key={quotation.id} quotation={quotation} />
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                {data.length > 0 && viewMode === "grouped" && groupedData.length > 0 ? (
                    <div className="space-y-2">
                        {groupedData.map((group) => (
                            <div key={group.lead_id} className="border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 cursor-pointer" onClick={() => setExpandedLead(expandedLead === group.lead_id ? null : group.lead_id)}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-600" />
                                            <span className="font-medium text-gray-900">{group.lead_name}</span>
                                            <span className="text-xs text-gray-600">({group.count})</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-gray-900">
                                                    {formatAmountDisplay(group.total_value, `group_${group.lead_id}`, true)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(group.latest_status)}
                                            {expandedLead === group.lead_id ? (
                                                <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {expandedLead === group.lead_id && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-2 py-1.5 text-left">{t("quotation_table.quotation_number")}</th>
                                                    <th className="px-2 py-1.5 text-left">{t("quotation_table.date")}</th>
                                                    <th className="px-2 py-1.5 text-left">{t("quotation_table.subject")}</th>
                                                    <th className="px-2 py-1.5 text-left">{t("quotation_table.amount")}</th>
                                                    <th className="px-2 py-1.5 text-left">{t("quotation_table.status")}</th>
                                                    {(canUpdate || canDelete) && <th className="px-2 py-1.5 text-left">{t("quotation_table.actions")}</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.quotations.map((quotation) => {
                                                    const formattedAmount = formatCurrency(quotation.total);
                                                    const isAmountExpanded = expandedAmounts[quotation.id];
                                                    const isSubjectExpanded = expandedSubjects[quotation.id];
                                                    
                                                    return (
                                                        <tr key={quotation.id} className="border-t border-gray-100 hover:bg-gray-50">
                                                            <td className="px-2 py-1.5 whitespace-nowrap font-medium">{quotation.quotation_number}</td>
                                                            <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(quotation.date)}</td>
                                                            <td className="px-2 py-1.5 max-w-[150px]">
                                                                <div className="flex items-center gap-1">
                                                                    <span title={quotation.subject}>
                                                                        {formatSubjectDisplay(quotation.subject, quotation.id)}
                                                                    </span>
                                                                    {quotation.subject && quotation.subject.length > 30 && (
                                                                        <button 
                                                                            onClick={() => toggleSubject(quotation.id)}
                                                                            className="p-0.5 text-gray-400 hover:text-gray-600"
                                                                            title={isSubjectExpanded ? t("quotation_table.collapse") : t("quotation_table.expand")}
                                                                        >
                                                                            {isSubjectExpanded ? (
                                                                                <Minimize2 className="w-3 h-3" />
                                                                            ) : (
                                                                                <Maximize2 className="w-3 h-3" />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-1.5 whitespace-nowrap">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-medium" title={formattedAmount}>
                                                                        {formatAmountDisplay(quotation.total, quotation.id)}
                                                                    </span>
                                                                    {formattedAmount.length > 20 && (
                                                                        <button 
                                                                            onClick={() => toggleAmount(quotation.id)}
                                                                            className="p-0.5 text-gray-400 hover:text-gray-600"
                                                                            title={isAmountExpanded ? t("quotation_table.collapse") : t("quotation_table.expand")}
                                                                        >
                                                                            {isAmountExpanded ? (
                                                                                <Minimize2 className="w-3 h-3" />
                                                                            ) : (
                                                                                <Maximize2 className="w-3 h-3" />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-1.5 whitespace-nowrap">{getStatusBadge(quotation.status)}</td>
                                                            {(canUpdate || canDelete) && (
                                                                <td className="px-2 py-1.5 whitespace-nowrap">
                                                                    <div className="flex gap-1">
                                                                        {canUpdate && (
                                                                            <Link href={route("quotation.edit", quotation.id)} className="p-0.5 text-blue-600 hover:text-blue-800" title={t("quotation_table.edit")}>
                                                                                <Edit className="w-3.5 h-3.5" />
                                                                            </Link>
                                                                        )}
                                                                        {canDelete && (
                                                                            <button onClick={() => handleDelete(quotation.id, quotation.quotation_number)} className="p-0.5 text-red-600 hover:text-red-800" title={t("quotation_table.delete")}>
                                                                                <Trash2 className="w-3.5 h-3.5" />
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
                                )}
                            </div>
                        ))}
                    </div>
                ) : data.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("quotation_table.quotation_number")}</th>
                                    <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("quotation_table.date")}</th>
                                    <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("quotation_table.subject")}</th>
                                    <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("quotation_table.lead")}</th>
                                    <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("quotation_table.amount")}</th>
                                    <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("quotation_table.status")}</th>
                                    {(canUpdate || canDelete) && <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("quotation_table.actions")}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((quotation) => {
                                    const formattedAmount = formatCurrency(quotation.total);
                                    const isAmountExpanded = expandedAmounts[quotation.id];
                                    const isSubjectExpanded = expandedSubjects[quotation.id];
                                    
                                    return (
                                        <tr key={quotation.id} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-2 py-1.5 whitespace-nowrap font-medium">{quotation.quotation_number}</td>
                                            <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(quotation.date)}</td>
                                            <td className="px-2 py-1.5 max-w-[120px]">
                                                <div className="flex items-center gap-1">
                                                    <span title={quotation.subject}>
                                                        {formatSubjectDisplay(quotation.subject, quotation.id)}
                                                    </span>
                                                    {quotation.subject && quotation.subject.length > 30 && (
                                                        <button 
                                                            onClick={() => toggleSubject(quotation.id)}
                                                            className="p-0.5 text-gray-400 hover:text-gray-600"
                                                            title={isSubjectExpanded ? t("quotation_table.collapse") : t("quotation_table.expand")}
                                                        >
                                                            {isSubjectExpanded ? (
                                                                <Minimize2 className="w-3 h-3" />
                                                            ) : (
                                                                <Maximize2 className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1.5 max-w-[100px] truncate" title={quotation.lead?.company_name}>{quotation.lead?.company_name || t("quotation_table.not_available")}</td>
                                            <td className="px-2 py-1.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium" title={formattedAmount}>
                                                        {formatAmountDisplay(quotation.total, quotation.id)}
                                                    </span>
                                                    {formattedAmount.length > 20 && (
                                                        <button 
                                                            onClick={() => toggleAmount(quotation.id)}
                                                            className="p-0.5 text-gray-400 hover:text-gray-600"
                                                            title={isAmountExpanded ? t("quotation_table.collapse") : t("quotation_table.expand")}
                                                        >
                                                            {isAmountExpanded ? (
                                                                <Minimize2 className="w-3 h-3" />
                                                            ) : (
                                                                <Maximize2 className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap">{getStatusBadge(quotation.status)}</td>
                                            {(canUpdate || canDelete) && (
                                                <td className="px-2 py-1.5 whitespace-nowrap">
                                                    <div className="flex gap-1">
                                                        {canUpdate && (
                                                            <Link href={route("quotation.edit", quotation.id)} className="p-0.5 text-blue-600 hover:text-blue-800" title={t("quotation_table.edit")}>
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </Link>
                                                        )}
                                                        {canDelete && (
                                                            <button onClick={() => handleDelete(quotation.id, quotation.quotation_number)} className="p-0.5 text-red-600 hover:text-red-800" title={t("quotation_table.delete")}>
                                                                <Trash2 className="w-3.5 h-3.5" />
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
                )}
            </div>

            {/* Summary Statistics */}
            {data.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-blue-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t("quotation_table.total_quotations")}</p>
                            <p className="text-sm font-bold">{data.length}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t("quotation_table.total_leads")}</p>
                            <p className="text-sm font-bold">{groupedData.length || t("quotation_table.not_available")}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t("quotation_table.total_value")}</p>
                            <p className="text-xs font-bold">
                                {formatCurrency(data.reduce((sum, q) => sum + (q.total || 0), 0))}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded">
                            <p className="text-[10px] text-gray-600">{t("quotation_table.accepted")}</p>
                            <p className="text-sm font-bold">{data.filter(q => q.status === "accepted" || q.status === "approved").length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationTable;