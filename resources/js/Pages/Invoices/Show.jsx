import React from "react";
import { usePage, router } from "@inertiajs/react";
import HeaderLayout from "@/Layouts/HeaderLayout";

export default function Show() {
    const { props } = usePage();
    const { invoice } = props;

    const formatIDR = (value) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(value || 0);

    const handleBack = () => {
        router.visit(route("invoice.index"));
    };

    const handleEdit = () => {
        router.visit(route("invoice.edit", invoice.id));
    };

    const handleDownloadPDF = () => {
        if (invoice.pdf_path) {
            window.open(`/storage/${invoice.pdf_path}`, '_blank');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Get logo URL from app config
    const logoUrl = props.app_config?.doc_logo_path 
                    ? `/storage/${props.app_config.doc_logo_path}` 
                    : null;

    return (
        <div className="min-h-screen bg-gray-800">
            {/* Header Actions */}
            <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex justify-between items-center print:hidden">
                <button
                    onClick={handleBack}
                    className="text-white hover:text-gray-300 font-semibold"
                >
                    ← Back to Invoices
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-500"
                    >
                        Print / Save PDF
                    </button>
                    <button
                        onClick={handleEdit}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700"
                    >
                        Edit Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Preview - Print Ready */}
            <div className="max-w-5xl mx-auto my-8 print:my-0 print:max-w-full">
                <div className="bg-white shadow-2xl print:shadow-none p-12 print:p-8 text-[12px]">
                    {/* Header with Logo */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            {logoUrl && (
                                <img 
                                    src={logoUrl} 
                                    alt="Company Logo" 
                                    className="h-20 object-contain mb-4"
                                />
                            )}
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-bold italic mb-4">INVOICE</h1>
                            <div className="text-sm">
                                <p className="text-gray-400 uppercase text-[10px] font-bold">NUMBER</p>
                                <p className="font-bold">{invoice.invoice_number || "---"}</p>
                            </div>
                            <div className="text-sm mt-2">
                                <p className="text-gray-400 uppercase text-[10px] font-bold">DATE</p>
                                <p className="font-bold">{invoice.date || "---"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="border border-black p-5 rounded-sm">
                            <div className="grid gap-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">To:</p>
                                    <p className="font-bold text-emerald-800">
                                        {invoice.contact_person || "---"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Email:</p>
                                    <p className="text-black">{invoice.email || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Handphone:</p>
                                    <p className="text-black">{invoice.phone || "---"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border border-black p-5 rounded-sm">
                            <div className="grid gap-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Company:</p>
                                    <p className="font-black">{invoice.company_name || "---"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Address:</p>
                                    <p className="text-black leading-tight">
                                        {invoice.address || "No address provided."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Services Table */}
                    <div className="mb-8">
                        <p className="text-[15px] font-bold text-black mb-2">Services</p>
                        <table className="w-full border-collapse border border-black">
                            <thead className="bg-gray-50 uppercase text-[10px] font-black border-b border-black">
                                <tr>
                                    <th className="p-2 text-center w-8 border border-black">No</th>
                                    <th className="p-2 text-left border border-black">Description</th>
                                    <th className="p-2 text-center w-24 border border-black">Qualification</th>
                                    <th className="p-2 text-right w-32">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(invoice.invoice_items || invoice.items || []).map((item, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="p-2 text-center font-bold text-gray-400 border border-black">
                                            {i + 1}
                                        </td>
                                        <td className="p-2 font-bold uppercase border border-black">
                                            {item.name || item.services?.split(' - ')[0] || "---"}
                                        </td>
                                        <td className="p-2 text-center border border-black">
                                            {item.processing || item.services?.split(' - ')[1] || "---"}
                                        </td>
                                        <td className="p-2 text-right font-black border-b border-black">
                                            {formatIDR(item.price || item.amount || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Terms and Totals */}
                    <div className="mt-10 flex justify-between">
                        <div className="w-1/2">
                            <div className="h-[6rem] mb-5">
                                <p className="text-[15px] font-black mb-1">Payment Terms</p>
                                <p className="text-red-600 text-[11px] font-medium leading-tight whitespace-pre-wrap">
                                    {invoice.payment_terms || "---"}
                                </p>
                            </div>
                            <div className="h-[3rem] mb-20">
                                <p className="text-[15px] font-black mb-1">Note</p>
                                <p className="text-red-600 text-[11px] font-medium leading-tight whitespace-pre-wrap">
                                    {invoice.note || "---"}
                                </p>
                            </div>
                        </div>
                        <div className="w-1/3 space-y-1 font-bold">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatIDR(invoice.invoice_amout || 0)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>
                                    Down Payment{" "}
                                    {invoice.payment_percentage
                                        ? `${(invoice.payment_percentage * 100).toFixed(0)}%`
                                        : ""}
                                </span>
                                <span>{formatIDR(invoice.down_payment || 0)}</span>
                            </div>

                            <div className="flex justify-between text-red-600">
                                <span>
                                    VAT (PPN){" "}
                                    {invoice.ppn && invoice.invoice_amout
                                        ? `${((invoice.ppn / invoice.invoice_amout) * 100).toFixed(0)}%`
                                        : ""}
                                </span>
                                <span>{formatIDR(invoice.ppn || 0)}</span>
                            </div>

                            <div className="flex justify-between text-red-600 border-b border-black pb-1">
                                <span>
                                    VAT (PPh){" "}
                                    {invoice.pph && invoice.invoice_amout
                                        ? `${((invoice.pph / invoice.invoice_amout) * 100).toFixed(0)}%`
                                        : ""}
                                </span>
                                <span>{formatIDR(invoice.pph || 0)}</span>
                            </div>

                            <div className="flex justify-between text-sm font-black pt-1">
                                <span>TOTAL</span>
                                <span>{formatIDR(invoice.total || 0)}</span>
                            </div>
                            
                            <p className="text-[17px] uppercase font-black pt-[0.9rem] pb-[5.2rem]">
                                {invoice.company_name || "---"}
                            </p>
                            <div className="text-left">
                                <p className="text-[15px] uppercase font-black pt-[0.9rem]">
                                    {invoice.contact_person || "---"}
                                </p>
                                <p className="text-[15px] text-gray-400">
                                    {invoice.position || "---"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

Show.layout = (page) => <HeaderLayout>{page}</HeaderLayout>;
