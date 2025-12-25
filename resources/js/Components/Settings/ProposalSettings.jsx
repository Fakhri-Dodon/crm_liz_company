import React, { useState, useEffect } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import { Button } from "@/Components/ui/Button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/Table";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import { api } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/Components/ui/switch";
import SimpleModal from "@/Components/ui/SimpleModal";

export default function ProposalSettings() {
    const { numbering, config, statuses } = usePage().props;
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState(null);
    const [formData, setFormData] = useState({
        id: null,
        prefix: "",
        padding: "",
        next_number: "",
    });
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing: actionProcessing,
        reset,
        errors,
    } = useForm({
        name: "",
        note: "",
        color: "",
        color_name: "",
    });

    const handleAddStatusClick = () => {
      setEditingStatus(null);
      reset(); 
      setIsStatusModalOpen(true);
    };

    const handleEditClick = () => {
        setFormData({
            id: numbering?.id || null,
            prefix: numbering?.prefix || "",
            padding: numbering?.padding || "",
            next_number: numbering?.next_number || "",
        });
        setIsModalOpen(true);
    };

    const openModal = (status) => {
        setEditingStatus(status);
        setData({
            name: status.name,
            note: status.note || "",
            color: status.color,
            color_name: status.color_name,
        });
        setIsStatusModalOpen(true);
    };

    const openEditStatusModal = (status) => {
        setEditingStatus(status);
        setData({
            name: status.name,
            note: status.note || "",
            color: status.color,
            color_name: status.color_name,
        });
        setIsStatusModalOpen(true);
    };

    const handleStatusSubmit = (e) => {
        e.preventDefault();
        if (editingStatus) {
            put(`/setting/proposal-status/update/${editingStatus.id}`, {
                onSuccess: () => {
                    toast.success("Status updated successfully");
                    setIsStatusModalOpen(false);
                },
            });
        } else {
            post("/setting/proposal-status/store", {
                onSuccess: () => {
                    toast.success("Status added successfully");
                    setIsStatusModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleStatusDelete = (id) => {
        if (confirm("Are you sure you want to delete this status?")) {
            destroy(`/setting/proposal-status/destroy/${id}`, {
                onSuccess: () => toast.success("Status deleted successfully"),
                onError: () => toast.error("Failed to delete status"),
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsProcessing(true);

        router.post(
            `/setting/proposal_numbering/update/${formData.id}`,
            formData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Numbering setting updated!");
                    setIsModalOpen(false);
                },
                onError: () => toast.error("Something went wrong"),
                onFinish: () => setIsProcessing(false),
            }
        );
    };
    // Helper Konversi Boolean
    const toBool = (val) =>
        val === true || val === 1 || val === "1" || val === "true";

    // State Lokal untuk UI yang Responsif
    const [localSettings, setLocalSettings] = useState({
        proposal_user_base_visibility: false,
        proposal_default_filter_by_login: false,
    });

    // Update state local saat config dari server berubah
    useEffect(() => {
        if (config) {
            setLocalSettings({
                proposal_user_base_visibility: toBool(
                    config.proposal_user_base_visibility
                ),
                proposal_default_filter_by_login: toBool(
                    config.proposal_default_filter_by_login
                ),
            });
        }
    }, [config]);

    // --- LOGIKA UPDATE SETTING ---
    const handleToggle = (field, currentBoolValue) => {
        const nextValue = !currentBoolValue;

        // Update UI instan (Optimistic UI)
        setLocalSettings((prev) => ({ ...prev, [field]: nextValue }));
        setIsProcessing(true);

        router.post(
            "/setting/general/store",
            { [field]: nextValue ? 1 : 0 }, // Kirim 1 atau 0 ke Laravel
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Settings updated");
                },
                onError: () => {
                    // Rollback jika gagal
                    setLocalSettings((prev) => ({
                        ...prev,
                        [field]: currentBoolValue,
                    }));
                    toast.error("Failed to update settings");
                },
                onFinish: () => setIsProcessing(false),
            }
        );
    };

    // Logika Hapus Status
    const deleteMutation = useMutation({
        mutationFn: (id) => api.entities.ProposalStatus.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["proposalStatuses"]);
            toast.success("Status deleted");
            router.reload(); // Refresh data props dari server
        },
    });

    const getStatusColor = (color) => {
        const colors = {
            orange: "text-orange-500 border-orange-500",
            blue: "text-blue-500 border-blue-500",
            green: "text-green-500 border-green-500",
            red: "text-red-500 border-red-500",
            draft: "text-gray-500 border-gray-400",
        };
        return colors[color] || "text-gray-500 border-gray-500";
    };

    const templates = [
        { name: "Modern", color: "bg-teal-800" },
        { name: "Professional", color: "bg-cyan-400" },
        { name: "Creative", color: "bg-red-700" },
    ];

    return (
        <div className="space-y-12 pt-10 px-4">
            <div>
                <h2 className="text-xl font-bold text-red-700 mb-6 uppercase tracking-wider">
                    Proposal Settings
                </h2>

                {/* --- Section 1: Numbering --- */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">
                        Proposal Numbering Setting
                    </h3>
                    <Button
                        onClick={handleEditClick}
                        className="bg-teal-800 hover:bg-teal-900 text-white px-8 h-9 font-bold uppercase text-xs tracking-widest"
                    >
                        Edit
                    </Button>
                </div>

                <div className="border border-teal-900 rounded-t-lg overflow-hidden mb-4 shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900 text-white">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white font-bold w-16 text-center">
                                    No
                                </TableHead>
                                <TableHead className="text-white font-bold w-32 text-center">
                                    Field
                                </TableHead>
                                <TableHead className="text-white font-bold w-32 text-center">
                                    Value
                                </TableHead>
                                <TableHead className="text-white font-bold text-center">
                                    Description
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="border-b border-gray-300">
                                <TableCell className="text-center font-medium">
                                    1
                                </TableCell>
                                <TableCell className="text-center font-bold uppercase text-xs">
                                    Prefix
                                </TableCell>
                                <TableCell className="text-center font-bold text-teal-700">
                                    {numbering.prefix}
                                </TableCell>
                                <TableCell className="text-gray-600 italic text-sm">
                                    {numbering.prefix_description}
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-b border-gray-300">
                                <TableCell className="text-center font-medium">
                                    2
                                </TableCell>
                                <TableCell className="text-center font-bold uppercase text-xs">
                                    Padding
                                </TableCell>
                                <TableCell className="text-center font-bold text-teal-700">
                                    {numbering.padding}
                                </TableCell>
                                <TableCell className="text-gray-600 italic text-sm">
                                    {numbering.padding_description}
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-b border-gray-300">
                                <TableCell className="text-center font-medium">
                                    3
                                </TableCell>
                                <TableCell className="text-center font-bold uppercase text-xs">
                                    Next Number
                                </TableCell>
                                <TableCell className="text-center font-bold text-teal-700">
                                    {numbering.next_number}
                                </TableCell>
                                <TableCell className="text-gray-600 italic text-sm">
                                    {numbering.next_number_description}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <h1 className="font-bold uppercase text-[10px]">
                    <span className="text-red-700">EXAMPLE </span>: PRO-00001
                    (Padding 5), PRO-0001 (Padding 4)
                </h1>
                <h1 className="font-bold uppercase text-[10px]">
                    Display proposal number when saving proposal, for example
                    "PRO-00001"
                </h1>

                <SimpleModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="EDIT PROPOSAL NUMBERING"
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input type="hidden" value={formData.id} />
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-teal-900 uppercase">
                                Prefix
                            </label>
                            <input
                                type="text"
                                className="w-full border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                                value={formData.prefix}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        prefix: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-teal-900 uppercase">
                                Padding (Length)
                            </label>
                            <input
                                type="number"
                                className="w-full border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                                value={formData.padding}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        padding: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-teal-900 uppercase">
                                Next Number
                            </label>
                            <input
                                type="number"
                                className="w-full border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                                value={formData.next_number}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        next_number: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase"
                            >
                                Cancel
                            </button>
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className="bg-teal-800 hover:bg-teal-900 text-white px-6 py-2 text-xs font-bold uppercase tracking-widest"
                            >
                                {isProcessing ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </SimpleModal>

                {/* --- Section 2: Status --- */}
                <div className="flex justify-between items-center mb-4 mt-10">
                    <h3 className="font-bold text-gray-800">Proposal Status</h3>
                    <Button
                        onClick={() => handleAddStatusClick()}
                        className="bg-teal-800 hover:bg-teal-900 text-white shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Status
                    </Button>
                </div>

                <div className="border border-teal-900 rounded-t-lg overflow-hidden mb-12 shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900 text-white">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white font-bold w-16 text-center">
                                    ID
                                </TableHead>
                                <TableHead className="text-white font-bold w-32 text-center">
                                    Status
                                </TableHead>
                                <TableHead className="text-white font-bold text-center">
                                    Note
                                </TableHead>
                                <TableHead className="text-white font-bold w-32 text-center">
                                    Color
                                </TableHead>
                                <TableHead className="text-white font-bold w-24 text-center">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {statuses && statuses.length > 0 ? (
                                statuses.map((status, index) => (
                                    <TableRow
                                        key={status.id}
                                        className="border-b border-gray-300"
                                    >
                                        <TableCell className="text-center font-medium">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell
                                            className={`text-center font-bold ${
                                                getStatusColor(
                                                    status.color
                                                ).split(" ")[0]
                                            }`}
                                        >
                                            {status.name}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {status.note || "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                                                {status.color_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-blue-600"
                                                    onClick={() => openEditStatusModal(status)}
                                                >
                                                    <Edit className="w-4 h-4"/>
                                                </Button>
                                                {!status.is_system && (
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                      onClick={() => handleStatusDelete(status.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-gray-400 italic"
                                    >
                                        No statuses available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <SimpleModal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                    title={
                        editingStatus
                            ? "Edit Proposal Status"
                            : "Create New Proposal Status"
                    }
                >
                    <form onSubmit={handleStatusSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Status Name
                            </label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Note
                            </label>
                            <textarea
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                                rows="2"
                                value={data.note}
                                onChange={(e) =>
                                    setData("note", e.target.value)
                                }
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Select Color
                            </label>
                            <select
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                                value={data.color_name}
                                onChange={(e) => {
                                    const selectedName = e.target.value;
                                    const colorMap = {
                                        Orange: "#F97316",
                                        Blue: "#3B82F6",
                                        Green: "#22C55E",
                                        Red: "#ef4444",
                                        Gray: "#6B7280",
                                    };
                                    setData((prev) => ({
                                        ...prev,
                                        color_name: selectedName,
                                        color: colorMap[selectedName] || "",
                                    }));
                                }}
                            >
                                <option value="">-- Choose Color --</option>
                                <option value="Orange">Orange</option>
                                <option value="Red">Red</option>
                                <option value="Blue">Blue</option>
                                <option value="Green">Green</option>
                                <option value="Gray">Gray</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsStatusModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-teal-900 text-white"
                                disabled={actionProcessing}
                            >
                                {actionProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </SimpleModal>

                {/* --- Section 3: Restrictions --- */}
                <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm tracking-widest">
                    Proposal Restrictions
                </h3>
                <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm mb-12">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white font-bold w-48 text-center border-r border-teal-800">
                                    Field
                                </TableHead>
                                <TableHead className="text-white font-bold w-32 text-center border-r border-teal-800">
                                    Setting
                                </TableHead>
                                <TableHead className="text-white font-bold text-center border-r border-teal-800">
                                    Description
                                </TableHead>
                                <TableHead className="text-white font-bold w-64 text-center">
                                    Current Status
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Row 1: Visibility */}
                            <TableRow className="border-b">
                                <TableCell className="font-bold px-4 text-center border-r bg-gray-50/50">
                                    User-Base Visibility
                                </TableCell>
                                <TableCell className="text-center py-6 border-r">
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch
                                            checked={
                                                localSettings.proposal_user_base_visibility
                                            }
                                            onCheckedChange={() =>
                                                handleToggle(
                                                    "proposal_user_base_visibility",
                                                    localSettings.proposal_user_base_visibility
                                                )
                                            }
                                            disabled={isProcessing}
                                        />
                                        <span
                                            className={`text-[10px] font-black uppercase ${
                                                localSettings.proposal_user_base_visibility
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {localSettings.proposal_user_base_visibility
                                                ? "ON"
                                                : "OFF"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 text-sm border-r">
                                    Restrict users to see only Proposals they
                                    created or related to their Leads.
                                </TableCell>
                                <TableCell className="px-4 text-sm bg-gray-50/50">
                                    <div className="space-y-1">
                                        <p>
                                            <span className="font-bold text-red-700 uppercase text-[10px]">
                                                ON
                                            </span>{" "}
                                            = User sees only their Leads
                                        </p>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <p>
                                            <span className="font-bold text-red-700 uppercase text-[10px]">
                                                OFF
                                            </span>{" "}
                                            = User sees all accessible Leads
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Row 2: Filter */}
                            <TableRow>
                                <TableCell className="font-bold px-4 text-center border-r bg-gray-50/50">
                                    Default Filter by Login
                                </TableCell>
                                <TableCell className="text-center py-6 border-r">
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch
                                            checked={
                                                localSettings.proposal_default_filter_by_login
                                            }
                                            onCheckedChange={() =>
                                                handleToggle(
                                                    "proposal_default_filter_by_login",
                                                    localSettings.proposal_default_filter_by_login
                                                )
                                            }
                                            disabled={isProcessing}
                                        />
                                        <span
                                            className={`text-[10px] font-black uppercase ${
                                                localSettings.proposal_default_filter_by_login
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {localSettings.proposal_default_filter_by_login
                                                ? "ON"
                                                : "OFF"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 text-sm border-r">
                                    Automatically filter Proposal table to show
                                    only data related to the logged-in user.
                                </TableCell>
                                <TableCell className="px-4 text-sm bg-gray-50/50 italic text-gray-600">
                                    If{" "}
                                    <span className="font-bold text-red-700 uppercase text-[10px]">
                                        OFF
                                    </span>
                                    , table shows all visible Leads initially;
                                    user can still filter manually.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Section 4: Templates */}
            <div className="pt-4 pb-10">
                <h2 className="text-xl font-bold text-red-700 mb-6 uppercase tracking-wider text-right">
                    Templates
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    {templates.map((template, idx) => (
                        <div key={idx} className="group cursor-pointer">
                            <div className="border border-gray-300 aspect-[3/4] flex flex-col transition-all group-hover:shadow-lg group-hover:border-teal-500 rounded-md overflow-hidden">
                                <div
                                    className={`h-2/3 w-full ${template.color} group-hover:opacity-90`}
                                ></div>
                                <div className="h-1/3 w-full bg-white flex items-center justify-center text-[10px] font-bold text-gray-300 tracking-widest">
                                    PREVIEW
                                </div>
                            </div>
                            <p className="mt-3 text-xs font-bold text-gray-700 uppercase text-center">
                                {template.name}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <Button className="bg-teal-800 hover:bg-teal-900 text-white px-10 h-9 font-bold uppercase text-xs tracking-widest">
                        Add New Template
                    </Button>
                </div>
            </div>

            {/* Syncing Loader Overlay */}
            {isProcessing && (
                <div className="fixed bottom-8 right-8 bg-teal-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 border border-teal-500/50 animate-in fade-in slide-in-from-bottom-4">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-300" />
                    <span className="font-bold text-[10px] uppercase tracking-widest">
                        Synchronizing...
                    </span>
                </div>
            )}
        </div>
    );
}