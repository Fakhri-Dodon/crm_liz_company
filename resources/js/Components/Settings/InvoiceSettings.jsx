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
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import SimpleModal from "@/Components/ui/SimpleModal";

export default function InvoiceSettings() {
    const { numbering, statuses, paymentTypes } = usePage().props;

    const [isNumberingModalOpen, setIsNumberingModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPaymentType, setEditingPaymentType] = useState(null);

    const statusForm = useForm({
        name: "",
        note: "",
        color: "",
        color_name: "",
    });

    const paymentTypeForm = useForm({
        name: "",
        note: "",
        order: 0,
    });

    const numberingForm = useForm({
        id: numbering?.id || null,
        prefix: numbering?.prefix || "",
        padding: numbering?.padding || "",
        next_number: numbering?.next_number || "",
    });

    const openEditNumbering = () => {
        numberingForm.setData({
            id: numbering.id,
            prefix: numbering.prefix,
            padding: numbering.padding,
            next_number: numbering.next_number,
        });
        setIsNumberingModalOpen(true);
    };

    const handleNumberingSubmit = (e) => {
        e.preventDefault();
        numberingForm.post(
            `/setting/invoice_numbering/update/${numberingForm.data.id}`,
            {
                onSuccess: () => {
                    toast.success("Numbering setting updated!");
                    setIsNumberingModalOpen(false);
                },
            }
        );
    };

    const openAddStatus = () => {
        setEditingStatus(null);
        statusForm.reset();
        setIsStatusModalOpen(true);
    };

    const openEditStatus = (status) => {
        setEditingStatus(status);
        statusForm.setData({
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
            statusForm.put(`/setting/invoice-status/update/${editingStatus.id}`, {
                onSuccess: () => {
                    toast.success("Status updated successfully");
                    setIsStatusModalOpen(false);
                },
            });
        } else {
            statusForm.post("/setting/invoice-status/store", {
                onSuccess: () => {
                    toast.success("Status added successfully");
                    setIsStatusModalOpen(false);
                    statusForm.reset();
                },
            });
        }
    };

    const handleDeleteStatus = (id) => {
        if (confirm("Are you sure you want to delete this status?")) {
            statusForm.delete(`/setting/invoice-status/destroy/${id}`, {
                onSuccess: () => toast.success("Status deleted successfully"),
            });
        }
    };

    const handlePaymentTypeSubmit = (e) => {
        e.preventDefault();
        if (editingPaymentType) {
            paymentTypeForm.put(`/setting/payment-type/update/${editingPaymentType.id}`, {
                onSuccess: () => {
                    toast.success("Payment type updated successfully");
                    setIsPaymentModalOpen(false);
                },
            });
        } else {
            paymentTypeForm.post(`/setting/payment-type/store`, {
                onSuccess: () => {
                    toast.success("Payment type added successfully");
                    setIsPaymentModalOpen(false);
                    paymentTypeForm.reset();
                },
            });
        }
    };

    const handleDeletePaymentType = (id) => {
        if (confirm('Are you sure you want to delete this payment type?')) {
            paymentTypeForm.delete(`/setting/payment-type/destroy/${id}`, {
                onSuccess: () => toast.success('Payment type deleted successfully'),
            });
        }
    };

    return (
        <div className="space-y-8 p-6">
            <h2 className="text-xl font-bold text-red-700 mb-6 uppercase tracking-wider">Invoice Settings</h2>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Numbering Setting</h3>
                    <Button onClick={openEditNumbering} className="bg-teal-800 hover:bg-teal-900 text-white px-8 h-9 font-bold uppercase text-xs tracking-widest">Edit</Button>
                </div>

                <div className="border border-teal-900 rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white font-bold w-16 text-center">No</TableHead>
                                <TableHead className="text-white font-bold w-32 text-center">Field</TableHead>
                                <TableHead className="text-white font-bold w-32 text-center">Value</TableHead>
                                <TableHead className="text-white font-bold text-center">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="border-b">
                                <TableCell className="text-center font-medium">1</TableCell>
                                <TableCell className="text-center font-bold uppercase text-xs">Prefix</TableCell>
                                <TableCell className="text-center font-bold text-teal-700">{numbering.prefix}</TableCell>
                                <TableCell className="text-gray-600 italic text-sm">{numbering.prefix_description}</TableCell>
                            </TableRow>
                            <TableRow className="border-b">
                                <TableCell className="text-center font-medium">2</TableCell>
                                <TableCell className="text-center font-bold uppercase text-xs">Padding</TableCell>
                                <TableCell className="text-center font-bold text-teal-700">{numbering.padding}</TableCell>
                                <TableCell className="text-gray-600 italic text-sm">{numbering.padding_description}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="text-center font-medium">3</TableCell>
                                <TableCell className="text-center font-bold uppercase text-xs">Next Number</TableCell>
                                <TableCell className="text-center font-bold text-teal-700">{numbering.next_number}</TableCell>
                                <TableCell className="text-gray-600 italic text-sm">{numbering.next_number_description}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="space-y-4 pt-9">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Invoice Statuses</h3>
                    <Button onClick={openAddStatus} className="bg-teal-800 hover:bg-teal-900 text-white shadow-md flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Status
                    </Button>
                </div>

                <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white text-center w-16 font-bold">No</TableHead>
                                <TableHead className="text-white font-bold">Status</TableHead>
                                <TableHead className="text-white font-bold">Note</TableHead>
                                <TableHead className="text-white font-bold">Color</TableHead>
                                <TableHead className="text-white text-center w-24 font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {statuses?.map((status, index) => (
                                <TableRow key={status.id} className="border-b">
                                    <TableCell className="text-center">{index + 1}</TableCell>
                                    <TableCell className="font-bold">{status.name}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{status.note}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                                            {status.color_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-2">
                                            <Edit className="w-4 h-4 text-blue-600 cursor-pointer" onClick={() => openEditStatus(status)} />
                                            <Trash2 className="w-4 h-4 text-red-600 cursor-pointer" onClick={() => handleDeleteStatus(status.id)} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="space-y-4 pt-9">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Payment Types</h3>
                    <Button onClick={() => { setEditingPaymentType(null); paymentTypeForm.reset(); setIsPaymentModalOpen(true); }} className="bg-teal-800 hover:bg-teal-900 text-white shadow-md flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Payment Type
                    </Button>
                </div>

                <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white text-center w-16 font-bold">No</TableHead>
                                <TableHead className="text-white font-bold">Name</TableHead>
                                <TableHead className="text-white font-bold">Note</TableHead>
                                <TableHead className="text-white font-bold text-center w-24">Order</TableHead>
                                <TableHead className="text-white text-center w-24 font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentTypes?.map((pt, index) => (
                                <TableRow key={pt.id} className="border-b">
                                    <TableCell className="text-center">{index + 1}</TableCell>
                                    <TableCell className="font-bold">{pt.name}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{pt.note}</TableCell>
                                    <TableCell className="text-center">{pt.order}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-2">
                                            <Edit className="w-4 h-4 text-blue-600 cursor-pointer" onClick={() => {
                                                setEditingPaymentType(pt);
                                                paymentTypeForm.setData({ name: pt.name, note: pt.note || '', order: pt.order || 0 });
                                                setIsPaymentModalOpen(true);
                                            }} />
                                            <Trash2 className="w-4 h-4 text-red-600 cursor-pointer" onClick={() => handleDeletePaymentType(pt.id)} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <SimpleModal isOpen={isNumberingModalOpen} onClose={() => setIsNumberingModalOpen(false)} title="EDIT INVOICE NUMBERING">
                <form onSubmit={handleNumberingSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-teal-900 uppercase">Prefix</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg text-sm" value={numberingForm.data.prefix} onChange={(e) => numberingForm.setData("prefix", e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-teal-900 uppercase">Padding (Length)</label>
                        <input type="number" className="w-full border-gray-300 rounded-lg text-sm" value={numberingForm.data.padding} onChange={(e) => numberingForm.setData("padding", e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-teal-900 uppercase">Next Number</label>
                        <input type="number" className="w-full border-gray-300 rounded-lg text-sm" value={numberingForm.data.next_number} onChange={(e) => numberingForm.setData("next_number", e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="submit" disabled={numberingForm.processing} className="bg-teal-800 text-white">{numberingForm.processing ? "Saving..." : "Save Changes"}</Button>
                    </div>
                </form>
            </SimpleModal>

            <SimpleModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={editingStatus ? "Edit Invoice Status" : "Create New Invoice Status"}>
                <form onSubmit={handleStatusSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status Name</label>
                        <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={statusForm.data.name} onChange={(e) => statusForm.setData("name", e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Note</label>
                        <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" value={statusForm.data.note} onChange={(e) => statusForm.setData("note", e.target.value)}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Select Color</label>
                        <select required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={statusForm.data.color_name} onChange={(e) => {
                            const colorMap = { Orange: "#F97316", Blue: "#3B82F6", Green: "#22C55E", Gray: "#6B7280" };
                            statusForm.setData({ ...statusForm.data, color_name: e.target.value, color: colorMap[e.target.value] || "" });
                        }}>
                            <option value="">-- Choose Color --</option>
                            <option value="Orange">Orange</option>
                            <option value="Blue">Blue</option>
                            <option value="Green">Green</option>
                            <option value="Gray">Gray</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="submit" className="bg-teal-900 text-white" disabled={statusForm.processing}>{statusForm.processing ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                    </div>
                </form>
            </SimpleModal>

            <SimpleModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={editingPaymentType ? "Edit Payment Type" : "Create New Payment Type"}>
                <form onSubmit={handlePaymentTypeSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={paymentTypeForm.data.name} onChange={(e) => paymentTypeForm.setData("name", e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Note</label>
                        <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows="2" value={paymentTypeForm.data.note} onChange={(e) => paymentTypeForm.setData("note", e.target.value)}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Order</label>
                        <input type="number" className="mt-1 block w-32 border border-gray-300 rounded-md p-2" value={paymentTypeForm.data.order} onChange={(e) => paymentTypeForm.setData("order", e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="submit" className="bg-teal-900 text-white" disabled={paymentTypeForm.processing}>{paymentTypeForm.processing ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                    </div>
                </form>
            </SimpleModal>
        </div>
    );
}
