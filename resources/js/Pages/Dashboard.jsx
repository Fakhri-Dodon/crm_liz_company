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

    const getRoleConfig = () => {
        switch (role) {
            case "Marketing":
                return {
                    total_lead: {
                        bg: "bg-purple-50",
                        border: "border-purple-200",
                        text: "text-purple-600",
                        val: Leads,
                        label: "Total Lead",
                    },
                    new_lead: {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        text: "text-blue-600",
                        val: NewLeads,
                        label: "New Lead",
                    },
                    converted: {
                        bg: "bg-green-50",
                        border: "border-green-200",
                        text: "text-green-600",
                        val: Converted,
                        label: "Converted",
                    },
                };
            case "Finance":
                return {
                    invoice: {
                        bg: "bg-green-50",
                        border: "border-green-200",
                        text: "text-green-600",
                        val: TotalInvoice,
                        label: "Invoice",
                    },
                    paid: {
                        bg: "bg-emerald-50",
                        border: "border-emerald-200",
                        text: "text-emerald-600",
                        val: PaidCount,
                        label: "Paid",
                    },
                    unpaid: {
                        bg: "bg-yellow-50",
                        border: "border-yellow-200",
                        text: "text-yellow-600",
                        val: UnpaidCount,
                        label: "Unpaid",
                    },
                    revenue: {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        text: "text-blue-600",
                        val: Revenue,
                        label: "Revenue",
                    },
                };
            default:
                return {
                    clients: {
                        bg: "bg-blue-50",
                        border: "border-blue-200",
                        text: "text-blue-600",
                        val: Clients,
                        label: "Clients",
                    },
                    leads: {
                        bg: "bg-indigo-50",
                        border: "border-indigo-200",
                        text: "text-indigo-600",
                        val: Leads,
                        label: "Leads Active",
                    },
                    projects: {
                        bg: "bg-sky-50",
                        border: "border-sky-200",
                        text: "text-sky-600",
                        val: Projects,
                        label: "Projects",
                    },
                    users: {
                        bg: "bg-slate-50",
                        border: "border-slate-200",
                        text: "text-slate-600",
                        val: Users,
                        label: "Users Online",
                    },
                };
        }
    };

    const statusConfig = getRoleConfig();

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl md:text-2xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div>
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {/* Judul Dashboard Dinamis */}
                        <div className="mb-2">
                            <h1 className="text-2xl font-bold text-gray-800 capitalize">
                                {role} Dashboard -{" "}
                                {role === "Admin" || role === "Manager"
                                    ? "System Overview" 
                                    : "Performance Overview"}
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 my-7">
                            {Object.entries(statusConfig).map(
                                ([key, colors]) => (
                                    <div
                                        key={key}
                                        className={`rounded-xl p-4 sm:p-5 shadow-sm border ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md min-h-[110px] flex flex-col justify-between`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p
                                                    className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}
                                                >
                                                    {colors.label}
                                                </p>
                                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                                    {colors.val}
                                                </p>
                                            </div>
                                            <div
                                                className={`p-3 rounded-full ${colors.bg} ${colors.text}`}
                                            >
                                                <div
                                                    className={`w-3 h-3 rounded-full ${colors.text.replace(
                                                        "text-",
                                                        "bg-"
                                                    )}`}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-sm text-gray-600 font-semibold truncate">
                                                {colors.label} Updated
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {/* --- DETAIL DATA SECTION --- */}
                        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"> */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-bold text-gray-700">
                                    {(role === "Admin" || role === "Manager") && "Recent Activities"}
                                    {role === "Marketing" &&
                                        "Lead Source & Funnel"}
                                    {role === "Finance" &&
                                        "Monthly Revenue Status"}
                                </h3>
                            </div>
                            <div className="p-4">
                                {(role === "Admin" || role === "Manager") && (
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="text-gray-400 uppercase text-xs border-b">
                                                <th className="pb-2 font-medium">
                                                    Date
                                                </th>
                                                <th className="pb-2 font-medium">
                                                    User
                                                </th>
                                                <th className="pb-2 font-medium">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600">
                                            {RecentActivities &&
                                            RecentActivities.length > 0 ? (
                                                RecentActivities.map(
                                                    (activity, index) => (
                                                        <tr
                                                            key={index}
                                                            className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <td className="py-3 text-xs text-gray-400">
                                                                {activity.date}
                                                            </td>
                                                            <td className="py-3 font-medium text-gray-900">
                                                                {activity.user}
                                                            </td>
                                                            <td className="py-3 italic text-gray-500">
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
                                                        className="py-10 text-center text-gray-400"
                                                    >
                                                        Belum ada log aktivitas
                                                        tercatat.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {/* BAGIAN KANAN: Recent Lead List (Hanya muncul jika role Marketing) */}
                                {role === "Marketing" && (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                                            <h3 className="font-bold text-gray-700">
                                                Recent Lead List
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-gray-400 uppercase text-xs border-b">
                                                            <th className="pb-2 font-medium">
                                                                Company / PIC
                                                            </th>
                                                            <th className="pb-2 font-medium">
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-gray-600">
                                                        {RecentLeads &&
                                                        RecentLeads.length >
                                                            0 ? (
                                                            RecentLeads.map(
                                                                (lead) => (
                                                                    <tr
                                                                        key={
                                                                            lead.id
                                                                        }
                                                                        className="border-b last:border-0 hover:bg-gray-50"
                                                                    >
                                                                        <td className="py-3">
                                                                            <div className="font-medium text-gray-900">
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
                                                                        <td className="py-3">
                                                                            <span
                                                                                className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-${lead.status_color}-100 text-${lead.status_color}-700`}
                                                                            >
                                                                                {
                                                                                    lead.status_name
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="3"
                                                                    className="py-4 text-center text-gray-400"
                                                                >
                                                                    No leads
                                                                    available.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* BAGIAN KANAN: Invoice List (Hanya muncul jika role Finance) */}
                                {role === "Finance" && (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                                            <h3 className="font-bold text-gray-700">
                                                Recent Invoice List
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-gray-400 uppercase text-xs border-b">
                                                            <th className="pb-2 font-medium">
                                                                Inv Number /
                                                                Date
                                                            </th>
                                                            <th className="pb-2 font-medium">
                                                                Amount
                                                            </th>
                                                            <th className="pb-2 font-medium">
                                                                Status
                                                            </th>
                                                            <th className="pb-2 font-medium text-right">
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-gray-600">
                                                        {RecentInvoices &&
                                                        RecentInvoices.length >
                                                            0 ? (
                                                            RecentInvoices.map(
                                                                (inv) => (
                                                                    <tr
                                                                        key={
                                                                            inv.id
                                                                        }
                                                                        className="border-b last:border-0 hover:bg-gray-50"
                                                                    >
                                                                        <td className="py-3">
                                                                            <div className="font-medium text-gray-900">
                                                                                {
                                                                                    inv.invoice_number
                                                                                }
                                                                            </div>
                                                                            <div className="text-xs text-gray-400">
                                                                                {
                                                                                    inv.due_date
                                                                                }
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 font-semibold text-gray-700">
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
                                                                        <td className="py-3">
                                                                            <span
                                                                                className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                                                    inv.status ===
                                                                                    "Paid"
                                                                                        ? "bg-green-100 text-green-700"
                                                                                        : inv.status ===
                                                                                          "Unpaid"
                                                                                        ? "bg-red-100 text-red-700"
                                                                                        : "bg-yellow-100 text-yellow-700"
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    inv.status
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 text-right">
                                                                            <button className="text-blue-600 hover:text-blue-800 font-medium">
                                                                                Details
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="4"
                                                                    className="py-4 text-center text-gray-400"
                                                                >
                                                                    No invoices
                                                                    found.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* </div> */}

                            {/* BAGIAN KANAN */}
                            {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="font-bold text-gray-700">
                                        {role === "admin" && "Module Status"}
                                        {role === "marketing" &&
                                            "Recent Lead List"}
                                        {role === "finance" && "Invoice List"}
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="text-gray-400 uppercase text-xs border-b">
                                                <th className="pb-2 font-medium">
                                                    {role === "finance"
                                                        ? "Invoice"
                                                        : "Name/Module"}
                                                </th>
                                                <th className="pb-2 font-medium">
                                                    {role === "finance"
                                                        ? "Client"
                                                        : "Status"}
                                                </th>
                                                <th className="pb-2 font-medium text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600">
                                            <tr className="border-b last:border-0">
                                                <td className="py-3 font-medium text-gray-900">
                                                    {role === "finance"
                                                        ? "INV-45"
                                                        : "PT Alpha"}
                                                </td>
                                                <td className="py-3">
                                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                                                        {role === "finance"
                                                            ? "Paid"
                                                            : "Active"}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button className="text-blue-600 hover:underline font-medium">
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
