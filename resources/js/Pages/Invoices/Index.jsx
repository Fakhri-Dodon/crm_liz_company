import React, { useState } from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import { Link, usePage, router } from "@inertiajs/react";
import DevelopmentPage from "../DevelopmentPage";

export default function Index() {
    const dev = false; // Ubah ke true untuk menampilkan halaman development
    if (dev) {
        return <DevelopmentPage />;
    }
    const { props } = usePage();

    // Try to use server props if available, otherwise fallback to sample data for UI preview
    const invoices = props.invoices ?? [
        {
            id: 1,
            number: "INV-00001",
            date: "21-10-2024",
            company: "PT. Pumigas Indonesia",
            amount: 12000000,
            paid_amount: 6000000,
            tax: { ppn: 660000, pph: 120000 },
            due_amount: 6540000,
            status: "Draft",
        },
        {
            id: 2,
            number: "INV-00002",
            date: "28-10-2024",
            company: "PT. Pumigas Indonesia",
            amount: 12000000,
            paid_amount: 3600000,
            tax: { ppn: 396000, pph: 72000 },
            due_amount: 3924000,
            status: "Paid",
        },
        {
            id: 3,
            number: "INV-00003",
            date: "11-11-2024",
            company: "China Communication Engineering Construction",
            amount: 12000000,
            paid_amount: 2400000,
            tax: { ppn: 264000, pph: 48000 },
            due_amount: 2616000,
            status: "Unpaid",
        },
    ];

    const totalAmount = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const paidCount = invoices.filter((i) => i.status === "Paid").length;
    const unpaidCount = invoices.filter((i) => i.status === "Unpaid").length;
    const cancelledCount = invoices.filter((i) => i.status === "Cancelled").length;

    const formatRp = (value) =>
        value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

    const handleCreateInvoice = () => {
        router.visit(route("invoice.create"));
    };

    const handleEditInvoice = (id) => {
        router.visit(route("invoice.edit", id));
    };

    const handleDeleteInvoice = (id, number) => {
        if (confirm(`Are you sure you want to delete invoice ${number}?`)) {
            router.delete(route("invoice.destroy", id), {
                onSuccess: () => {
                    // Invoice deleted successfully
                },
                onError: (errors) => {
                    console.error("Delete failed:", errors);
                    alert("Failed to delete invoice");
                }
            });
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">INVOICE</h2>

            <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="border border-blue-500 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-blue-600 font-semibold">Invoice</div>
                            <div className="text-sm text-gray-500">Total Invoice</div>
                        </div>
                        <div className="text-2xl font-bold">{invoices.length}</div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-500">Rp</div>
                        <div className="text-lg font-bold">{formatRp(totalAmount)}</div>
                    </div>
                </div>

                <div className="border border-green-500 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-green-600 font-semibold">Paid</div>
                            <div className="text-sm text-gray-500">Total Invoice</div>
                        </div>
                        <div className="text-2xl font-bold">{paidCount}</div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-500">Rp</div>
                        <div className="text-lg font-bold">{formatRp(totalPaid)}</div>
                    </div>
                </div>

                <div className="border border-orange-400 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-orange-500 font-semibold">Unpaid</div>
                            <div className="text-sm text-gray-500">Total Invoice</div>
                        </div>
                        <div className="text-2xl font-bold">{unpaidCount}</div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-500">Rp</div>
                        <div className="text-lg font-bold">{formatRp(totalAmount - totalPaid)}</div>
                    </div>
                </div>

                <div className="border border-red-500 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-red-600 font-semibold">Cancelled</div>
                            <div className="text-sm text-gray-500">Total Invoice</div>
                        </div>
                        <div className="text-2xl font-bold">{cancelledCount}</div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-500">Rp</div>
                        <div className="text-lg font-bold">-</div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-end mb-4">
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Keyword</label>
                    <input className="w-full border rounded px-3 py-2" placeholder="Search" />
                </div>
                <div className="w-72">
                    <label className="text-xs text-gray-500">Status</label>
                    <select className="w-full border rounded px-3 py-2">
                        <option>All</option>
                        <option>Paid</option>
                        <option>Unpaid</option>
                        <option>Draft</option>
                    </select>
                </div>
                <div className="w-48">
                    <label className="text-xs text-gray-500">Year</label>
                    <select className="w-full border rounded px-3 py-2">
                        <option>2024</option>
                        <option>2025</option>
                    </select>
                </div>
                <div>
                    <button onClick={handleCreateInvoice} className="bg-teal-800 text-white px-4 py-2 rounded">Add invoice</button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white border rounded">
                <table className="min-w-full divide-y">
                    <thead className="bg-green-50">
                        <tr>
                            <th className="px-4 py-3 text-left">No</th>
                            <th className="px-4 py-3 text-left">Invoice</th>
                            <th className="px-4 py-3 text-left">Company Name</th>
                            <th className="px-4 py-3 text-left">Invoice Ammount</th>
                            <th className="px-4 py-3 text-left">Payment</th>
                            <th className="px-4 py-3 text-left">Tax</th>
                            <th className="px-4 py-3 text-left">Ammount Due</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                        {invoices.map((inv, idx) => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">{idx + 1}</td>
                                <td className="px-4 py-4">
                                    <div className="text-teal-700 font-semibold">
                                        <Link href={`#`}>{inv.number}</Link>
                                    </div>
                                    <div className="text-xs text-gray-500">{inv.date}</div>
                                </td>
                                <td className="px-4 py-4 text-blue-600">{inv.company}</td>
                                <td className="px-4 py-4">{formatRp(inv.amount)}</td>
                                <td className="px-4 py-4 text-red-600">{formatRp(inv.paid_amount)}<div className="text-xs text-red-400">Partial</div></td>
                                <td className="px-4 py-4 text-red-600">
                                    <div>PPN 11% Rp {inv.tax.ppn.toLocaleString()}</div>
                                    <div>PPh 2% Rp {inv.tax.pph.toLocaleString()}</div>
                                </td>
                                <td className="px-4 py-4 font-bold">{formatRp(inv.due_amount)}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-3 py-1 rounded border text-sm ${inv.status==='Paid'? 'border-green-500 text-green-600':'border-gray-300 text-gray-700'}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <button onClick={() => handleEditInvoice(inv.id)} className="mr-2 text-gray-600 hover:text-gray-800">✎</button>
                                    <button onClick={() => handleDeleteInvoice(inv.id, inv.number)} className="text-red-600 hover:text-red-800">🗑</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

Index.layout = (page) => <HeaderLayout>{page}</HeaderLayout>;
