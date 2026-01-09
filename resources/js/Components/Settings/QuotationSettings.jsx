import React, { useState, useEffect } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import { Switch } from "@/Components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/Table";
import { Button } from "@/Components/ui/Button";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import SimpleModal from "@/Components/ui/SimpleModal";

export default function QuotationSettings() {
    const { config, statuses } = usePage().props;
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState(null);

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

    const openAddModal = () => {
        setEditingStatus(null);
        reset();
        setIsModalOpen(true);
    };

    // Buka Modal untuk Edit
    const openEditModal = (status) => {
        setEditingStatus(status);
        setData({
            name: status.name,
            note: status.note || "",
            color: status.color,
            color_name: status.color_name,
        });
        setIsModalOpen(true);
    };

    // Handle Simpan (Add atau Update)
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingStatus) {
            put(`/setting/quotation-status/update/${editingStatus.id}`, {
                onSuccess: () => {
                    toast.success("Status updated successfully");
                    setIsModalOpen(false);
                },
            });
        } else {
            post("/setting/quotation-status/store", {
                onSuccess: () => {
                    toast.success("Status added successfully");
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this status?")) {
            destroy(`/setting/quotation-status/destroy/${id}`, {
                onSuccess: () => toast.success("Status deleted successfully"),
                onError: () => toast.error("Failed to delete status"),
            });
        }
    };

    const handleAddStatus = (e) => {
        e.preventDefault();
        post("/setting/quotation-status/store", {
            onSuccess: () => {
                toast.success("Status added successfully");
                setIsAddModalOpen(false);
                reset();
            },
            onError: () => toast.error("Failed to add status"),
        });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-red-700 mb-6 uppercase tracking-wider">
                        Quotation Settings
                    </h2>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-teal-800 hover:bg-teal-900 text-white shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Status
                    </Button>
                </div>
                <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
                    <div className="min-w-[720px]">
                        <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm">
                            <Table>
                                <TableHeader className="bg-teal-900">
                                    <TableRow className="hover:bg-teal-900 border-none">
                                        <TableHead className="text-white text-center w-16 font-bold">
                                            No
                                        </TableHead>
                                        <TableHead className="text-white font-bold">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-white font-bold">
                                            Note
                                        </TableHead>
                                        <TableHead className="text-white font-bold">
                                            Color
                                        </TableHead>
                                        <TableHead className="text-white font-bold">
                                            Created By
                                        </TableHead>
                                        <TableHead className="text-white text-center w-24 font-bold">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {statuses?.length > 0 ? (
                                        statuses.map((status, index) => (
                                            <TableRow
                                                key={status.id}
                                                className="border-b"
                                            >
                                                <TableCell className="text-center">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {status.name}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {status.note}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    status.color,
                                                            }}
                                                        ></div>
                                                        {status.color_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {status.creator?.name ||
                                                        "System"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-2">
                                                        <Edit
                                                            className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition-transform"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    status
                                                                )
                                                            }
                                                        />
                                                        <Trash2
                                                            className="w-4 h-4 text-red-600 cursor-pointer hover:scale-110 transition-transform"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    status.id
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center py-10 text-gray-400 italic"
                                            >
                                                No status data available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            <SimpleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    editingStatus
                        ? "Edit Quotation Status"
                        : "Create New Quotation Status"
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Status Name
                        </label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
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
                            onChange={(e) => setData("note", e.target.value)}
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
                            <option value="Blue">Blue</option>
                            <option value="Green">Green</option>
                            <option value="Gray">Gray</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
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
        </div>
    );
}
