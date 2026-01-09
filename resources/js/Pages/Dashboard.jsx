import AuthenticatedLayout from "@/Layouts/HeaderLayout";
import { Head } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import React from "react";

export default function Dashboard({
    auth,
    Clients,
    Leads,
    Users,
    Projects,
    NewLeads,
    Converted,
    TotalInvoice,
    PaidCount,
    UnpaidCount,
    Revenue,
    RecentInvoices,
    RecentActivities,
    RecentLeads,
}) {
    const { t } = useTranslation();
    const role = auth?.user?.role_name;

    // const role = 'Finance';

    const getRoleConfig = () => {
        switch (role) {
            case "Marketing":
                return {
                    total_lead: {
                        bg: "bg-purple-50",
                        border: "border-purple-200",
                        text: "text-purple-600",
                        val: Leads,
                        label: t("dashboard.marketing.total_leads"),
                    },
                    new_lead: {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        text: "text-blue-600",
                        val: NewLeads,
                        label: t("dashboard.marketing.new_leads"),
                    },
                    converted: {
                        bg: "bg-green-50",
                        border: "border-green-200",
                        text: "text-green-600",
                        val: Converted,
                        label: t("dashboard.marketing.converted"),
                    },
                };
            case "Finance":
                return {
                    invoice: {
                        bg: "bg-green-50",
                        border: "border-green-200",
                        text: "text-green-600",
                        val: TotalInvoice,
                        label: t("dashboard.finance.invoice"),
                    },
                    paid: {
                        bg: "bg-emerald-50",
                        border: "border-emerald-200",
                        text: "text-emerald-600",
                        val: PaidCount,
                        label: t("dashboard.finance.paid"),
                    },
                    unpaid: {
                        bg: "bg-yellow-50",
                        border: "border-yellow-200",
                        text: "text-yellow-600",
                        val: UnpaidCount,
                        label: t("dashboard.finance.unpaid"),
                    },
                    revenue: {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        text: "text-blue-600",
                        val: Revenue,
                        label: t("dashboard.finance.revenue"),
                    },
                };
            default:
                return {
                    clients: {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        text: "text-blue-600",
                        val: Clients,
                        label: t("dashboard.default.clients"),
                    },
                    leads: {
                        bg: "bg-indigo-50",
                        border: "border-indigo-200",
                        text: "text-indigo-600",
                        val: Leads,
                        label: t("dashboard.default.leads_active"),
                    },
                    projects: {
                        bg: "bg-sky-50",
                        border: "border-sky-200",
                        text: "text-sky-600",
                        val: Projects,
                        label: t("dashboard.default.projects"),
                    },
                    users: {
                        bg: "bg-slate-50",
                        border: "border-slate-200",
                        text: "text-slate-600",
                        val: Users,
                        label: t("dashboard.default.users_online"),
                    },
                };
        }
    };

    const statusConfig = getRoleConfig();

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold leading-tight text-gray-800">
                    {t("dashboard.default.title")}
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="px-4 sm:px-8 py-6">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {role} {t("dashboard.default.title")}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {role === "Admin" || role === "Manager"
                            ? t("dashboard.default.system_overview")
                            : t("dashboard.default.system_overview")}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {Object.entries(statusConfig).map(([key, colors]) => (
                        <div
                            key={key}
                            className={`relative group overflow-hidden rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${colors.border} ${colors.bg}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p
                                        className={`text-xs font-bold uppercase tracking-wider opacity-80 ${colors.text}`}
                                    >
                                        {colors.label}
                                    </p>
                                    <p className="text-3xl font-black text-gray-900 mt-2">
                                        {colors.val}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center text-xs font-medium text-gray-500 border-t border-black/5 pt-3">
                                <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {colors.label} {t("dashboard.default.updated")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail Data Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <span className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></span>
                            {(role === "Admin" || role === "Manager") &&
                                t("dashboard.default.recent_activities")}
                            {role === "Marketing" &&
                                t("dashboard.marketing.source_funnel")}
                            {role === "Finance" &&
                                t("dashboard.finance.recent_invoice_list")}
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <div className="p-6">
                                {/* Table for Admin / Manager */}
                                {(role === "Admin" || role === "Manager") && (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-gray-400 uppercase text-[11px] font-bold tracking-widest border-b border-gray-100">
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.default.table.date"
                                                    )}
                                                </th>
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.default.table.user"
                                                    )}
                                                </th>
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.default.table.action"
                                                    )}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {RecentActivities?.length > 0 ? (
                                                RecentActivities.map(
                                                    (activity, index) => (
                                                        <tr
                                                            key={index}
                                                            className="group hover:bg-blue-50/30 transition-colors"
                                                        >
                                                            <td className="py-4 px-2 text-sm text-gray-400 tabular-nums">
                                                                {activity.date}
                                                            </td>
                                                            <td className="py-4 px-2 text-sm font-semibold text-gray-900">
                                                                {activity.user}
                                                            </td>
                                                            <td className="py-4 px-2 text-sm italic text-gray-500">
                                                                {
                                                                    activity.action
                                                                }
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                        className="py-12 text-center text-gray-400 font-medium"
                                                    >
                                                        No recent activities
                                                        found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {/* Table for Marketing */}
                                {role === "Marketing" && (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-gray-400 uppercase text-[11px] font-bold tracking-widest border-b border-gray-100">
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.marketing.table.company"
                                                    )}
                                                </th>
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.marketing.table.status"
                                                    )}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {RecentLeads?.length > 0 ? (
                                                RecentLeads.map((lead) => (
                                                    <tr
                                                        key={lead.id}
                                                        className="group hover:bg-orange-50/30 transition-colors"
                                                    >
                                                        <td className="py-4 px-2">
                                                            <div className="font-bold text-gray-900">
                                                                {
                                                                    lead.company_name
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {
                                                                    lead.contact_person
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-inset bg-${lead.status_color}-50 text-${lead.status_color}-700 ring-${lead.status_color}-200`}
                                                            >
                                                                {
                                                                    lead.status_name
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="2"
                                                        className="py-12 text-center text-gray-400 font-medium"
                                                    >
                                                        No leads available.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {/* Table for Finance */}
                                {role === "Finance" && (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-gray-400 uppercase text-[11px] font-bold tracking-widest border-b border-gray-100">
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.finance.table.number_date"
                                                    )}
                                                </th>
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.finance.table.amount"
                                                    )}
                                                </th>
                                                <th className="pb-4 px-2">
                                                    {t(
                                                        "dashboard.finance.table.status"
                                                    )}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {RecentInvoices?.length > 0 ? (
                                                RecentInvoices.map((inv) => (
                                                    <tr
                                                        key={inv.id}
                                                        className="group hover:bg-green-50/30 transition-colors"
                                                    >
                                                        <td className="py-4 px-2">
                                                            <div className="font-bold text-gray-900">
                                                                {
                                                                    inv.invoice_number
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {inv.due_date}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2 font-bold text-gray-700 tabular-nums">
                                                            {new Intl.NumberFormat(
                                                                "id-ID",
                                                                {
                                                                    style: "currency",
                                                                    currency:
                                                                        "IDR",
                                                                    maximumFractionDigits: 0,
                                                                }
                                                            ).format(
                                                                inv.amount
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-inset ${
                                                                    inv.status ===
                                                                    "Paid"
                                                                        ? "bg-green-50 text-green-700 ring-green-200"
                                                                        : inv.status ===
                                                                          "Unpaid"
                                                                        ? "bg-red-50 text-red-700 ring-red-200"
                                                                        : "bg-yellow-50 text-yellow-700 ring-yellow-200"
                                                                }`}
                                                            >
                                                                {inv.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                        className="py-12 text-center text-gray-400 font-medium"
                                                    >
                                                        No invoices found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
