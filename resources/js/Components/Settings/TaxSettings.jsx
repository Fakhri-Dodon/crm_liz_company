import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/Table";
import { Button } from "@/Components/ui/Button";
import { Edit, Trash2, Loader2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import SimpleModal from "@/Components/ui/SimpleModal";
import { Description } from "@headlessui/react";

export default function TaxSettings() {
    const { ppn, pph } = usePage().props;

    const [isPpnModalOpen, setIsPpnModalOpen] = useState(false);
    const [isPphModalOpen, setIsPphModalOpen] = useState(false);
    const [editingPpn, setEditingPpn] = useState(null);
    const [editingPph, setEditingPph] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'ppn' atau 'pph'

    const ppnForm = useForm({
        name: "",
        rate: "",
        description: "",
    });

    const pphForm = useForm({
        name: "",
        rate: "",
        description: "",
    });

    const openAddPpn = () => {
        setEditingPpn(null);
        ppnForm.reset();
        setIsPpnModalOpen(true);
    };

    const openEditPpn = (ppn) => {
        setEditingPpn(ppn);
        ppnForm.setData({
            name: ppn.name,
            rate: (parseFloat(ppn.rate) * 100).toString(),
            description: ppn.description || "",
        });
        setIsPpnModalOpen(true);
    };

    const handlePpnSubmit = (e) => {
        e.preventDefault();

        ppnForm.transform((data) => ({
            ...data,
            rate: parseFloat(data.rate) / 100,
        }));

        if (editingPpn) {
            ppnForm.put(`/setting/ppn/update/${editingPpn.id}`, {
                onSuccess: () => {
                    toast.success("PPN updated successfully");
                    setIsPpnModalOpen(false);
                },
            });
        } else {
            ppnForm.post("/setting/ppn/store", {
                onSuccess: () => {
                    toast.success("PPN added successfully");
                    setIsPpnModalOpen(false);
                    ppnForm.reset();
                },
            });
        }
    };

    const handleDeletePpn = (id) => {
        if (confirm("Are you sure you want to delete this PPN?")) {
            ppnForm.delete(`/setting/ppn/destroy/${id}`, {
                onSuccess: () => toast.success("PPN deleted successfully"),
            });
        }
    };

    const openAddPph = () => {
        setEditingPph(null);
        pphForm.reset();
        setIsPphModalOpen(true);
    };

    const openEditPph = (pph) => {
        setEditingPph(pph);
        pphForm.setData({
            name: pph.name,
            rate: (parseFloat(pph.rate) * 100).toString(),
            description: pph.description || "",
        });
        setIsPphModalOpen(true);
    };

    const handlePphSubmit = (e) => {
        e.preventDefault();

        pphForm.transform((data) => ({
            ...data,
            rate: parseFloat(data.rate) / 100,
        }));

        if (editingPph) {
            pphForm.put(`/setting/pph/update/${editingPph.id}`, {
                onSuccess: () => {
                    toast.success("PPH updated successfully");
                    setIsPphModalOpen(false);
                },
            });
        } else {
            pphForm.post("/setting/pph/store", {
                onSuccess: () => {
                    toast.success("PPH added successfully");
                    setIsPphModalOpen(false);
                    pphForm.reset();
                },
            });
        }
    };

    const handleDeletePph = (id) => {
        if (confirm("Are you sure you want to delete this PPH?")) {
            pphForm.delete(`/setting/pph/destroy/${id}`, {
                onSuccess: () => toast.success("PPH deleted successfully"),
            });
        }
    };

    const confirmDelete = (id, type) => {
        setDeleteId(id);
        setDeleteType(type);
        setIsDeleteConfirmOpen(true);
    };

    const handleExecuteDelete = () => {
        const form = deleteType === "ppn" ? ppnForm : pphForm;
        const url = `/setting/${deleteType}/destroy/${deleteId}`;

        form.delete(url, {
            onSuccess: () => {
                toast.success(
                    `${deleteType.toUpperCase()} deleted successfully`
                );
                setIsDeleteConfirmOpen(false);
                setDeleteId(null);
            },
            onFinish: () => setIsDeleteConfirmOpen(false),
        });
    };

    return (
        <div className="space-y-8 p-6">
            <h2 className="text-xl font-bold text-red-700 mb-6 uppercase tracking-wider">
                Tax Settings (PPN & PPH)
            </h2>

            {/* --- SECTION: PPN --- */}
            <div className="space-y-4 pt-9">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">
                        PPN (Value Added Tax)
                    </h3>
                    <Button
                        onClick={openAddPpn}
                        className="bg-teal-800 hover:bg-teal-900 text-white shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add PPN
                    </Button>
                </div>

                <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white text-center w-16 font-bold">
                                    No
                                </TableHead>
                                <TableHead className="text-white font-bold">
                                    PPN
                                </TableHead>
                                <TableHead className="text-white font-bold">
                                    Rate
                                </TableHead>
                                <TableHead className="text-white font-bold">
                                    Description
                                </TableHead>
                                <TableHead className="text-white text-center w-24 font-bold">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ppn?.map((ppn, index) => (
                                <TableRow key={ppn.id} className="border-b">
                                    <TableCell className="text-center">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {ppn.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {ppn.rate}
                                    </TableCell>
                                    <TableCell>{ppn.description}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-2">
                                            <Edit
                                                className="w-4 h-4 text-blue-600 cursor-pointer"
                                                onClick={() => openEditPpn(ppn)}
                                            />
                                            <Trash2
                                                className="w-4 h-4 text-red-600 cursor-pointer"
                                                onClick={() =>
                                                    confirmDelete(ppn.id, 'ppn')
                                                }
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* --- MODAL: PPN (ADD/EDIT) --- */}
            <SimpleModal
                isOpen={isPpnModalOpen}
                onClose={() => {
                    setIsPpnModalOpen(false);
                    ppnForm.reset();
                }}
                title={editingPpn ? "Edit PPN" : "Create New PPN"}
            >
                <form onSubmit={handlePpnSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            PPN<span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Example: 35%"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={ppnForm.data.name}
                            onChange={(e) =>
                                ppnForm.setData("name", e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            PPN Rate<span className="text-red-600">*</span>
                        </label>
                        <div className="relative mt-1">
                            <input
                                type="number"
                                required
                                placeholder="adjust to PPN input"
                                className="block w-full border border-gray-300 rounded-md p-2 pr-10"
                                value={ppnForm.data.rate}
                                onChange={(e) =>
                                    ppnForm.setData("rate", e.target.value)
                                }
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">
                                    %
                                </span>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 italic">
                            Enter a whole number (e.g., 11 will be saved as
                            0.11)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            rows="3"
                            placeholder="Add notes if necessary..."
                            value={ppnForm.data.description}
                            onChange={(e) =>
                                ppnForm.setData("description", e.target.value)
                            }
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPpnModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-900 text-white hover:bg-teal-800"
                            disabled={ppnForm.processing}
                        >
                            {ppnForm.processing ? (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            ) : editingPpn ? (
                                "Update PPN"
                            ) : (
                                "Save PPN"
                            )}
                        </Button>
                    </div>
                </form>
            </SimpleModal>

            {/* --- SECTION: PPH --- */}
            <div className="space-y-4 pt-9">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">
                        PPH (Income Tax)
                    </h3>
                    <Button
                        onClick={openAddPph}
                        className="bg-teal-800 hover:bg-teal-900 text-white shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add PPH
                    </Button>
                </div>

                <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white text-center w-16 font-bold">
                                    No
                                </TableHead>
                                <TableHead className="text-white font-bold">
                                    PPH
                                </TableHead>
                                <TableHead className="text-white font-bold">
                                    Rate
                                </TableHead>
                                <TableHead className="text-white font-bold">
                                    Description
                                </TableHead>
                                <TableHead className="text-white text-center w-24 font-bold">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pph?.map((pph, index) => (
                                <TableRow key={pph.id} className="border-b">
                                    <TableCell className="text-center">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        {pph.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {pph.rate}
                                    </TableCell>
                                    <TableCell>{pph.description}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-2">
                                            <Edit
                                                className="w-4 h-4 text-blue-600 cursor-pointer"
                                                onClick={() => openEditPph(pph)}
                                            />
                                            <Trash2
                                                className="w-4 h-4 text-red-600 cursor-pointer"
                                                onClick={() =>
                                                    confirmDelete(pph.id, 'pph')
                                                }
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* --- MODAL: PPH (ADD/EDIT) --- */}
            <SimpleModal
                isOpen={isPphModalOpen}
                onClose={() => {
                    setIsPphModalOpen(false);
                    pphForm.reset();
                }}
                title={editingPph ? "Edit PPH" : "Create New PPH"}
            >
                <form onSubmit={handlePphSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            PPH<span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Example: 35%"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={pphForm.data.name}
                            onChange={(e) =>
                                pphForm.setData("name", e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            PPH Rate<span className="text-red-600">*</span>
                        </label>
                        <div className="relative mt-1">
                            <input
                                type="number"
                                required
                                placeholder="adjust to PPH input"
                                className="block w-full border border-gray-300 rounded-md p-2 pr-10"
                                value={pphForm.data.rate}
                                onChange={(e) =>
                                    pphForm.setData("rate", e.target.value)
                                }
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">
                                    %
                                </span>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 italic">
                            Enter a whole number (e.g., 5 will be saved as 0.05)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            rows="3"
                            placeholder="Add notes if necessary..."
                            value={pphForm.data.description}
                            onChange={(e) =>
                                pphForm.setData("description", e.target.value)
                            }
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPphModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-900 text-white hover:bg-teal-800"
                            disabled={pphForm.processing}
                        >
                            {pphForm.processing ? (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            ) : editingPph ? (
                                "Update PPH"
                            ) : (
                                "Save PPH"
                            )}
                        </Button>
                    </div>
                </form>
            </SimpleModal>

            {/* --- MODAL: DELETE CONFIRMATION --- */}
            <SimpleModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete this{" "}
                        <span className="font-bold text-red-600">
                            {deleteType?.toUpperCase()}
                        </span>
                        ? This action cannot be undone.
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteConfirmOpen(false)}
                            disabled={ppnForm.processing || pphForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleExecuteDelete}
                            disabled={ppnForm.processing || pphForm.processing}
                        >
                            {ppnForm.processing || pphForm.processing ? (
                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            ) : (
                                "Yes, Delete it"
                            )}
                        </Button>
                    </div>
                </div>
            </SimpleModal>
        </div>
    );
}
