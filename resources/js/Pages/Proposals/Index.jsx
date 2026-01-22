import React, { useEffect, useState } from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import TableLayout from "@/Layouts/TableLayout";
import { Head, Link, usePage, useForm, router } from "@inertiajs/react";
import ModalAdd from "@/Components/ModalAdd";
import PrimaryButton from "@/Components/PrimaryButton";
import {
    Search,
    Filter,
    Plus,
    Calendar,
    Download,
    RefreshCw,
} from "lucide-react";
import DeleteConfirmationModal from "@/Components/DeleteConfirmationModal";
import NotificationModal from "@/Components/NotificationModal";
import { useTranslation } from "react-i18next";
// import DevelopmentPage from "../DevelopmentPage";
// import DevelopmentPage from "../DevelopmentPage";

export default function ProposalsIndex({
    proposals,
    statusOptions,
    summary,
    filters,
    filterData,
    lead,
    auth_permissions,
}) {
    // const dev = true
    // if (dev) {
    //     return <HeaderLayout><DevelopmentPage /></HeaderLayout>;

    // }
    // Dummy data

    const { t } = useTranslation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("add");
    const [editingId, setEditingId] = useState(null);

    const canRead = auth_permissions.can_read === 1;
    const canCreate = auth_permissions.can_create === 1;
    const canUpdate = auth_permissions.can_update === 1;
    const canDelete = auth_permissions.can_delete === 1;

    // Debug: log totals to confirm prop is received from server
    useEffect(() => {
        console.log("Inertia summary:", summary);
    }, [summary]);

    const columns = [
        {
            key: "no",
            label: t("proposals.table.no_date"),
            render: (value, row) => {
                const isEdited = Boolean(row.edited);

                return (
                    <div>
                        <a
                            href={
                                isEdited
                                    ? `/proposal/${row.element_id}`
                                    : undefined
                            }
                            target={isEdited ? "_blank" : undefined}
                            rel={isEdited ? "noopener noreferrer" : undefined}
                            onClick={(e) => {
                                if (!isEdited) e.preventDefault();
                            }}
                            className={`font-semibold flex items-center gap-1 ${
                                isEdited
                                    ? "text-blue-600 hover:underline"
                                    : "text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {value}
                        </a>

                        <div className="text-gray-500 text-sm mt-1">
                            {row.date || "-"}
                        </div>
                    </div>
                );
            },
        },
        {
            key: "title",
            label: t("proposals.table.title"),
        },
        {
            key: "company_name",
            label: t("proposals.table.company_name"),
            render: (value, row) => {
                const isClient = !!row.is_client;

                return (
                    <span
                        className={`font-medium ${
                            isClient ? "text-blue-600" : "text-black"
                        }`}
                    >
                        {row.lead?.company_name || value}
                    </span>
                );
            },
        },
        {
            key: "contact",
            label: t("proposals.table.contact"),
        },
        {
            key: "created_by",
            label: t("proposals.table.created_by"),
        },
        
        {
            key: "proposal_statuses_id",
            label: t("proposals.table.status"),
            render: (value, row) => {
                // Ambil ID dari row data JSON Anda
                const currentStatusId = row.proposal_statuses_id;
                console.log("Check Data:", { 
                    valueFromArg1: value, 
                    rowObject: row,
                    statusRel: row?.status_rel 
                });
                
                // Ambil detail status langsung dari relasi (status_rel) yang ada di JSON
                const currentStatusRel = row.status_rel; 

                // Cari object status di statusOptions (untuk dropdown list)
                const statusObj = statusOptions.find((s) => s.id === currentStatusId);
                
                // Gunakan nama dari relasi JSON atau fallback ke statusObj
                const statusName = currentStatusRel?.name || statusObj?.name || "Unknown";
                const statusColor = currentStatusRel?.color || statusObj?.color || "#9ca3af";

                // Daftar status yang tidak boleh diedit manual (Sesuaikan dengan Nama di Database)
                const nonSelectableStatuses = ["approved", "opened", "draft", "sent", "failed", "rejected", "revise"];

                const isNonEditable = statusObj 
                    ? statusObj.is_system || nonSelectableStatuses.includes(statusName)
                    : false;

                const handleStatusChange = (id, newStatusId) => {
                    console.log("Mengirim Update ID:", { id, proposal_statuses_id: newStatusId });

                    router.patch(
                        route("proposal.update-status", id),
                        { proposal_statuses_id: newStatusId },
                        {
                            preserveScroll: true,
                            onSuccess: () => toast("Status updated successfully"),
                            onError: (errors) => {
                                console.error("Gagal Update:", errors);
                                toast("Failed to update status", "error");
                            },
                        }
                    );
                };

                if (isNonEditable) {
                    return (
                        <span 
                            className="text-xs font-bold py-1 px-2 rounded-lg border-2" 
                            style={{ 
                                borderColor: statusColor, 
                                color: statusColor 
                            }}
                        >
                            {statusName}
                        </span>
                    );
                }

                return (
                    <select
                        value={currentStatusId} // Value menggunakan UUID
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        className="appearance-none text-xs font-bold py-1 px-2 rounded-lg border-2 focus:ring-0 cursor-pointer transition-all"
                        style={{ 
                            borderColor: statusColor, 
                            color: statusColor,
                            backgroundImage: "none"
                        }}
                    >
                        {statusOptions.length > 0 ? (
                            statusOptions
                                .filter(s => !nonSelectableStatuses.includes(s.name))
                                .map((s) => (
                                    // Option Value = UUID, Label = Name
                                    <option key={s.id} value={s.id} style={{ color: s.color }}>
                                        {s.name}
                                    </option>
                                ))
                        ) : (
                            // Fallback jika statusOptions kosong, tampilkan status saat ini saja
                            <option value={currentStatusId}>{statusName}</option>
                        )}
                    </select>
                );
            },
        },
    ];

    const [localFilters, setLocalFilters] = useState({
        search: filters?.search || "",
        status: filters?.status || "all",
        proposal_id: filters?.proposal_id || "",
    });

    useEffect(() => {
        setLocalFilters({
            search: filters?.search || "",
            status: filters?.status || "all",
            month: filters?.month || "",
            year: filters?.year || "",
        });
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
        setData(key, value);
    };

    const applyFilters = () => {
        get(route("proposal.index"), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            data: {
                proposal_id: localFilters.proposal_id,
                search: localFilters.search,
                status:
                    localFilters.status !== "all" ? localFilters.status : "",
            },
        });
    };

    const resetFilters = () => {
        const defaultFilters = {
            search: "",
            proposal_id: "",
            status: "all",
        };
        setLocalFilters(defaultFilters);
        setData(defaultFilters);
        router.get(
            route("proposal.index"),
            {},
            {
                replace: true,
                preserveState: false,
                preserveScroll: true,
            }
        );
    };

    const statusColors = {
        sent: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-200",
            icon: "⚡",
        },
        opened: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-200",
            icon: "✅",
        },
        rejected: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-200",
            icon: "⏳",
        },
        failed: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-200",
            icon: "❌",
        },
        // approved: { bg: 'bg-greed-100', text: 'text-greed-800', border: 'border-greed-200' },
        // draft: { bg: 'bg-grey-100', text: 'text-grey-800', border: 'border-grey-200' },
        // revised: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };

    const tableData = proposals.data.map((q) => ({
        id: q.id,
        no: q.proposal_number,
        date: q.date,
        title: q.title || "-",
        lead_id: q.lead_id || "-",
        company_name: q.lead?.company_name || "-",
        contact: q.lead?.contact_person || "-",
        created_by: q.creator?.name || "Admin", // Sesuaikan field ini
        status: q.status,
        edited: q.edited,
        proposal_statuses_id: q.proposal_statuses_id,
        element_id: q.proposal_element_template_id,
    }));

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        lead_id: "",
    });

    const handleAdd = () => {
        setMode("add");
        setEditingId(null);
        reset();
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        if (mode === "add") {
            post(route("proposal.add"), {
                onSuccess: () => {
                    reset();
                    setIsModalOpen(false);
                },
            });
        }

        if (mode === "edit") {
            put(route("proposal.update", editingId), {
                onSuccess: () => {
                    reset();
                    setIsModalOpen(false);
                },
            });
        }
    };

    const handleEdit = (item) => {
        console.log(item);
        setMode("edit");
        setEditingId(item.id);

        setData({
            name: item.title ?? "",
            lead_id: item.lead_id ?? "",
        });

        setIsModalOpen(true);
    };

    const handleDelete = (item) => {
        if (item && item.id) {
            router.delete(`/proposal/${item.id}`);
        } else {
            console.error("Data proposal tidak memiliki ID", item);
        }
    };

    const proposalOptions = proposals?.data
        ? [...new Set(proposals.data.map((p) => p.title).filter(Boolean))]
        : [];

    return (
        <>
            <ModalAdd
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={mode === "add" ? "Create Proposal" : "Edit Proposal"}
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <span>{mode === "add" ? "Create" : "Update"}</span>
                        </PrimaryButton>
                    </>
                }
            >
                {/* Isi Form Input Di Sini (Children) */}
                <div className="space-y-4">
                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                title*
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Company Name*
                            </label>
                            <div className="relative">
                                <select
                                    value={data.lead_id}
                                    onChange={(e) =>
                                        setData("lead_id", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent appearance-none transition-colors ${
                                        errors.lead_id
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    required
                                >
                                    <option value="" className="text-gray-400">
                                        Select Company Name
                                    </option>
                                    {lead &&
                                        lead.map((leads) => (
                                            <option
                                                key={leads.id}
                                                value={leads.id}
                                            >
                                                {leads.company_name}
                                            </option>
                                        ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalAdd>

            <HeaderLayout
                title="Proposals Management"
                subtitle="Manage all company proposals"
            />
            <div className="px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Proposal
                    </h1>
                    {/* ADD BUTTON */}
                    {canCreate && (
                        <PrimaryButton
                            onClick={handleAdd}
                            className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span>{t("proposals.button_add")}</span>
                        </PrimaryButton>
                    )}
                </div>
                <Head title="Proposals" />
                <div className="grid grid-cols-4 gap-6 my-7">
                    {Object.entries(statusColors).map(([status, colors]) => (
                        <div
                            key={status}
                            className={`rounded-xl p-5 shadow-sm border ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p
                                        className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}
                                    >
                                        {t(`proposals.stats.${status}`)}
                                    </p>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                        {summary[status] || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Total Proposal
                                    </p>
                                </div>
                                <div
                                    className={`p-3 rounded-full ${colors.bg}`}
                                >
                                    <span className="text-lg">
                                        {colors.icon}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ACTION BAR */}
                <div className="bg-white border-none border-gray-200 py-2">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* SEARCH AND FILTERS */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                            {/* Company Filter */}
                        </div>
                    </div>

                    {/* Results Count */}
                    {/*<div className="mt-4 text-sm text-gray-600">
                        {t('proposals.filters.showing_info', { count: localFilters.length, total: proposals.length })}
                    </div>*/}
                </div>

                {/* TABLE SECTION */}
                <div className="py-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-sm">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600 font-medium">
                                {t("common.loading") || "Loading..."}
                            </p>
                        </div>
                    ) : tableData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-sm bg-gray-50">
                            <div className="h-12 w-12 text-gray-300 mb-4">
                                <svg
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium mb-2">
                                {localFilters.search
                                    ? t("proposals.empty.no_match")
                                    : t("proposals.empty.no_data")}
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                {localFilters.search
                                    ? t("proposals.empty.try_again")
                                    : t("proposals.empty.start_add")}
                            </p>
                            {localFilters.search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    {t("proposals.filters.clear_search")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                            <TableLayout
                                data={tableData}
                                columns={columns}
                                onEdit={canUpdate ? handleEdit : null}
                                onDelete={canDelete ? handleDelete : null}
                                showAction={canUpdate || canDelete}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

import { ChevronDown } from "lucide-react";
