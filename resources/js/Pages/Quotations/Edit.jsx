import React, { useState, useEffect, useCallback } from "react";
import { useForm, router } from "@inertiajs/react";
import DocumentBuilder from "@/Components/PDF_Builder/Builder";
import { Edit as EditIcon, Trash2, Loader2, Plus } from "lucide-react";
import html2pdf from "html2pdf.js";

export default function Edit({ leads = [], companies = [], auth, quotation }) {
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        processing: "",
        price: "",
    });

    const builderAddItem = (newItem) => {
        const itemWithId = {
            ...newItem,
            id: Date.now() + Math.random(),
            price: Number(newItem.price) || 0,
        };

        console.log("Menambahkan item dengan ID:", itemWithId.id);

        setData("services", [...data.services, itemWithId]);
    };

    const {
        data,
        setData,
        patch,
        processing: formLoading,
    } = useForm({
        document_type: "QUOTATION",

        client_type: quotation.is_client ? "Client" : "Lead",

        date: quotation.date || "",
        number: quotation.quotation_number || "",
        company_id: (() => {
            if (quotation.is_client) {
                const company = companies.find(
                    (c) => String(c.lead_id) === String(quotation.lead_id)
                );
                return company ? company.id : null;
            }
            return quotation.lead_id || null;
        })(),
        contact_person_id: quotation.contact_person_id
            ? String(quotation.contact_person_id)
            : "",
        company_name: quotation.lead?.company_name || null,
        address: quotation.lead?.address || "",
        contact_person: quotation.lead?.contact_person || quotation.company?.lead?.contact_person || "",
        position: quotation.lead?.position || "",
        email: quotation.lead?.email || "",
        phone: quotation.lead?.phone || "",
        subject: quotation.subject || "",
        payment_terms: quotation.payment_terms || "",
        note: quotation.note || "",
        valid_until: quotation.valid_until || "",
        services:
            quotation.items.map((item) => ({
                id: item.id,
                name: item.name,
                processing: item.processing,
                price: item.amount,
            })) || [],

        discount: parseFloat(quotation.discount) > 0 ? "yes" : "no",
        discount_amount: parseFloat(quotation.discount) || 0,

        // Compute initial subtotal from whichever field is available (sub_total, subtotal) or from items
        // then derive tax rate (data.tax holds tax amount from backend)
        sub_total: (() => {
            const itemsSum = Array.isArray(quotation.items) && quotation.items.length
                ? quotation.items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0)
                : 0;

            // Prefer items sum when available (server subtotal may be "0.00")
            if (itemsSum > 0) return itemsSum;

            if (quotation.sub_total !== undefined && quotation.sub_total !== null) {
                const v = parseFloat(quotation.sub_total) || 0;
                if (v > 0) return v;
            }

            if (quotation.subtotal !== undefined && quotation.subtotal !== null) {
                const v = parseFloat(quotation.subtotal) || 0;
                if (v > 0) return v;
            }

            return itemsSum;
        })(),

        tax_amount: parseFloat(quotation.tax) || 0,

        tax: (() => {
            const taxAmount = parseFloat(quotation.tax) || 0;
            const itemsSum = Array.isArray(quotation.items) && quotation.items.length
                ? quotation.items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0)
                : 0;

            let subTotal = itemsSum;
            if (subTotal <= 0) {
                if (quotation.sub_total !== undefined && quotation.sub_total !== null) subTotal = parseFloat(quotation.sub_total) || 0;
                if (subTotal <= 0 && quotation.subtotal !== undefined && quotation.subtotal !== null) subTotal = parseFloat(quotation.subtotal) || 0;
            }

            if (taxAmount <= 0 || subTotal <= 0) return 0;

            const ratio = taxAmount / subTotal;
            return isFinite(ratio) ? parseFloat(ratio.toFixed(2)) : 0;
        })(),

        tax_type: (() => {
            const taxAmount = parseFloat(quotation.tax) || 0;
            const itemsSum = Array.isArray(quotation.items) && quotation.items.length
                ? quotation.items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0)
                : 0;

            let subTotal = itemsSum;
            if (subTotal <= 0) {
                if (quotation.sub_total !== undefined && quotation.sub_total !== null) subTotal = parseFloat(quotation.sub_total) || 0;
                if (subTotal <= 0 && quotation.subtotal !== undefined && quotation.subtotal !== null) subTotal = parseFloat(quotation.subtotal) || 0;
            }

            if (taxAmount <= 0 || subTotal <= 0) return null;
            const ratio = taxAmount / subTotal;
            return ratio >= 0.12 ? "PPN 12%" : "PPN 11%";
        })(),

        total: parseFloat(quotation.total) || (function() {
            const itemsSum = Array.isArray(quotation.items) && quotation.items.length ? quotation.items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0) : 0;
            let s = itemsSum;
            if (s <= 0) {
                if (quotation.sub_total !== undefined && quotation.sub_total !== null) s = parseFloat(quotation.sub_total) || 0;
                if (s <= 0 && quotation.subtotal !== undefined && quotation.subtotal !== null) s = parseFloat(quotation.subtotal) || 0;
            }
            const t = parseFloat(quotation.tax) || 0;
            const d = parseFloat(quotation.discount) || 0;
            return s + t - d;
        })(),
    });

    console.log("full data :", data);

    console.log("data tax :", data.tax);

    // useEffect(() => {
    //     const subTotal = data.services.reduce(
    //         (acc, curr) => acc + Number(curr.price || 0),
    //         0
    //     );

    //     // Pastikan tax_rate dibagi 100 jika itu persentase (misal 11 jadi 0.11)
    //     const taxRatePercent = Number(data.tax_rate || 0) / 100;
    //     const ppn = data.tax_type ? subTotal * taxRatePercent : 0;
    //     const discount = Number(data.discount_amount || 0);
    //     const total = subTotal + ppn - discount;

    //     // Hanya update jika ada perubahan nyata untuk menghindari re-render berlebih
    //     if (Math.abs(data.total - total) > 0.01) {
    //         setData((prev) => ({
    //             ...prev,
    //             sub_total: subTotal,
    //             tax_amount: ppn,
    //             total: total,
    //         }));
    //     }

    //     // if (quotation.lead_id && !data.contact_person_id) {
    //     //     setData("contact_person_id", quotation.contact_person_id);
    //     // }
    // }, [data.services, data.tax_rate, data.tax_type, data.discount_amount]);

    useEffect(() => {
        if (data.contact_person_id) {
            handleContactChange(data.contact_person_id);
        }
    }, []);

    const handleSave = async () => {
        if (data.services.length === 0) {
            alert(
                "Peringatan: Anda harus menambahkan setidaknya satu jasa/layanan sebelum menyimpan."
            );
            return;
        }

        if (!data.company_id) {
            alert("Pilih client");
            return;
        }

        try {
            const element = document.getElementById("quotation-pdf");
            const opt = {
                margin: 0,
                filename: `${data.number}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            const pdfBlob = await html2pdf()
                .set(opt)
                .from(element)
                .output("blob");

            const subTotalFinal = data.services.reduce(
                (acc, curr) => acc + Number(curr.price || 0),
                0
            );
            const taxAmountFinal = subTotalFinal * (parseFloat(data.tax) || 0);
            const totalFinal =
                subTotalFinal +
                taxAmountFinal -
                (parseFloat(data.discount_amount) || 0);

            const formData = new FormData();

            formData.append("_method", "PATCH");

            Object.keys(data).forEach((key) => {
                if (key === "services") {
                    const cleanServices = data.services.map((s) => ({
                        id: s.id || null,
                        name: s.name || s.name || "-",
                        processing: s.processing || "-",
                        price: s.price || 0,
                    }));
                    formData.append("services", JSON.stringify(cleanServices));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                } else if (key === "sub_total") {
                    formData.append("sub_total", subTotalFinal);
                } else if (key === "tax_amount") {
                    formData.append("tax_amount", taxAmountFinal);
                } else if (key === "total") {
                    formData.append("total", totalFinal);
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });

            formData.append("pdf_file", pdfBlob, `${data.number}.pdf`);

            router.post(`/quotation/update/${quotation.id}`, formData, {
                forceFormData: true,
                onSuccess: () => alert("Berhasil disimpan!"),
                onError: (err) => {
                    console.error("Penyebab Gagal Simpan", err);
                    for (let pair of formData.entries()) {
                        console.log(pair[0] + ": " + pair[1]);
                    }
                },
            });
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const updateField = (field, value) => {
        console.log(`Updating ${field} to:`, value);
        setData(field, value);
    };

    const formatIDR = (num) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(num);

    const quotationPDFPreview = ({ data }) => {
        const doc = new jsPDF();
        const subTotal = data.services.reduce(
            (acc, curr) => acc + Number(curr.price || 0),
            0
        );
        const taxValue = data.tax_type ? subTotal * (Number(data.tax) || 0) : 0;
        const discountValue =
            data.has_discount === "yes" ? Number(data.discount_amount || 0) : 0;
        const total = subTotal + taxValue - discountValue;

        doc.text(`Quotation untuk: ${data.clientName}`, 10, 10);

        const string = doc.output("bloburl");
        window.open(string, "_blank");

        return (
            <div className="p-8 text-sm text-gray-800 leading-relaxed h-full flex flex-col">
                {/* 1. HEADER & LOGO */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-blue-900 tracking-tighter italic">
                            LOGO
                        </h1>
                        <p className="text-[10px] text-gray-500 max-w-[200px] mt-2">
                            Jl. Alamat Perusahaan No. 123, Jakarta Indonesia
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold uppercase tracking-widest">
                            {data.document_type || "QUOTATION"}
                        </h2>
                        <p className="font-mono text-xs">
                            No: {data.document_number || "---"}
                        </p>
                        <p className="font-mono text-xs">
                            Date: {data.date || "---"}
                        </p>
                    </div>
                </div>

                {/* 2. INFORMASI PENERIMA */}
                <div className="grid grid-cols-2 gap-10 mb-10">
                    <div>
                        <h3 className="font-bold border-b border-gray-300 mb-2 uppercase text-[10px] text-gray-500">
                            To:
                        </h3>
                        <p className="font-bold text-lg">
                            {data.company_name || "Customer Name"}
                        </p>
                        <p>{data.address || "Customer Address"}</p>
                    </div>
                    <div>
                        <h3 className="font-bold border-b border-gray-300 mb-2 uppercase text-[10px] text-gray-500">
                            Subject:
                        </h3>
                        <p className="whitespace-pre-line">
                            {data.subject || "---"}
                        </p>
                    </div>
                </div>

                {/* 3. TABLE LAYANAN */}
                <table className="w-full mb-8 text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 uppercase text-[10px] tracking-wider">
                            <th className="p-2 border">No</th>
                            <th className="p-2 border">Description</th>
                            <th className="p-2 border">Process Time</th>
                            <th className="p-2 border text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.services.map((item, index) => (
                            <tr key={item.id} className="border-b">
                                <td className="p-2 align-top text-center">
                                    {index + 1}
                                </td>
                                <td className="p-2 align-top font-semibold">
                                    {item.name}
                                </td>
                                <td className="p-2 align-top italic text-gray-600">
                                    {item.processing}
                                </td>
                                <td className="p-2 align-top text-right">
                                    {formatIDR(item.price)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 4. TOTALS & SUMMARY */}
                <div className="flex justify-end mb-10">
                    <div className="w-1/2 space-y-2">
                        <div className="flex justify-between border-b pb-1">
                            <span>Subtotal</span>
                            <span>{formatIDR(data.subTotal)}</span>
                        </div>
                        {data.has_discount === "yes" && (
                            <div className="flex justify-between text-red-600 italic">
                                <span>Discount</span>
                                <span>
                                    {data.discount === "yes" && (
                                        <p>
                                            Diskon: -
                                            {formatIDR(data.discount_amount)}
                                        </p>
                                    )}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-b pb-1">
                            <span>{data.tax_type || "Tax"}</span>
                            <span>
                                ({data.tax_type || "-"}):{" "}
                                {formatIDR(data.tax_amount)}
                            </span>
                        </div>
                        <div className="flex justify-between text-lg font-black bg-gray-50 p-1">
                            <span>TOTAL</span>
                            <span>{formatIDR(data.total)}</span>
                        </div>
                    </div>
                </div>

                {/* 5. NOTES & VALIDITY */}
                <div className="mt-4 mb-10 italic text-[11px] text-gray-500">
                    {data.valid_until && (
                        <p>
                            • This quotation is valid until {data.valid_until}
                        </p>
                    )}
                    <p>
                        • Prices include applicable taxes unless stated
                        otherwise.
                    </p>
                </div>

                {/* 6. SIGNATURE SECTION (Push to Bottom) */}
                <div className="mt-auto flex justify-end text-center">
                    <div className="w-48">
                        <p className="mb-20 font-bold uppercase tracking-tighter">
                            Best Regards,
                        </p>
                        <p className="font-bold border-b border-black">
                            {data.company_name || "---"}
                        </p>
                        <p className="text-[10px] uppercase">
                            Authorized Signature
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const calculateAndSyncTotals = useCallback(
        (
            currentServices,
            currentTaxRate,
            currentTaxName,
            currentDiscount,
            builderUpdate
        ) => {
            const subTotal = (currentServices || []).reduce(
                (acc, curr) => acc + Number(curr.price || 0),
                0
            );
            const ppn = currentTaxName ? subTotal * currentTaxRate : 0;
            const total = subTotal + ppn - Number(currentDiscount || 0);

            // Update Builder State
            builderUpdate("sub_total", subTotal);
            builderUpdate("tax_amount", ppn);
            builderUpdate("total", total);
        },
        []
    );

    const handleBack = () => {
        router.get("/quotation");
    };

    return (
        <>
            {/* --- MODAL ADD SERVICE --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-[400px] border border-gray-200">
                        <h3 className="font-black text-gray-800 mb-4 uppercase tracking-tight text-sm">
                            Add New Service
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400">
                                    Service Name
                                </label>
                                <input
                                    className="w-full border-gray-300 rounded-lg p-2 text-sm"
                                    placeholder="Sertifikasi Alat"
                                    value={newItem.name}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400">
                                        Processing
                                    </label>
                                    <input
                                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                                        placeholder="7 Days"
                                        value={newItem.processing}
                                        onChange={(e) =>
                                            setNewItem({
                                                ...newItem,
                                                processing: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400">
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                                        placeholder="0"
                                        value={newItem.price}
                                        onChange={(e) =>
                                            setNewItem({
                                                ...newItem,
                                                price: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-400"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={() => {
                                    if (!newItem.name || !newItem.price) {
                                        return alert("Lengkapi data!");
                                    }

                                    const itemToAdd = {
                                        id: Date.now(),
                                        name: newItem.name,
                                        processing: newItem.processing || "-",
                                        price: parseFloat(newItem.price),
                                    };

                                    builderAddItem(itemToAdd);

                                    setShowModal(false);
                                    setNewItem({
                                        name: "",
                                        processing: "",
                                        price: "",
                                    });
                                }}
                                className="bg-[#2d6a4f] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg"
                            >
                                ADD ITEM
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DOCUMENT BUILDER --- */}
            <DocumentBuilder
                title="Quotation Builder"
                data={data}
                setData={setData}
                onSave={handleSave}
                onBack={handleBack}
                renderEditor={({ updateField: builderUpdate }) => {
                    const nameIsLocked = !data.client_type;

                    const handleSelectionChange = (id) => {
                        const isClient = data.client_type === "Client";
                        const source = isClient ? companies : leads;

                        const selected = source.find(
                            (item) => String(item.id) === String(id)
                        );

                        if (selected) {
                            const dataSource = isClient
                                ? selected.lead
                                : selected;

                            const updateData = {
                                // Gunakan ID asli dari record yang dipilih agar dropdown tersinkron
                                company_id: selected.id,
                                lead_id: isClient
                                    ? selected.lead_id
                                    : selected.id,
                                company_name: isClient
                                    ? selected.lead?.company_name ||
                                      selected.client_code
                                    : selected.company_name,
                                address: dataSource?.address || "",
                                // Reset contact setiap kali ganti company
                                contact_person_id: "",
                                contact_person: "",
                                email: "",
                                phone: "",
                                position: "",
                            };

                            // Update UI Builder dan Local State
                            Object.entries(updateData).forEach(
                                ([field, value]) => builderUpdate(field, value)
                            );
                            setData((prev) => ({ ...prev, ...updateData }));
                        }
                    };
                    const currentOptions =
                        data.client_type === "Client"
                            ? companies || []
                            : leads || [];

                    const getContactList = (org) => {
                        if (!org) return [];

                        // Prefer explicit contacts arrays from company objects
                        const contactsArr =
                            org.contacts || org.contact_persons || org.contactPersons;

                        if (Array.isArray(contactsArr) && contactsArr.length > 0) {
                            return contactsArr.map((c) => ({
                                id: c.id ?? c.contact_id ?? c.lead_id ?? c.email ?? "",
                                name: c.name ?? c.contact_person ?? c.full_name ?? (c.lead && c.lead.contact_person) ?? "",
                                email: c.email ?? (c.lead && c.lead.email) ?? "",
                                phone: c.phone ?? (c.lead && c.lead.phone) ?? c.mobile ?? "",
                                position: c.position ?? c.job_title ?? "",
                                raw: c,
                            }));
                        }

                        // Fallback: treat the org itself (Lead) as a single contact
                        return [
                            {
                                id: org.id,
                                name: org.contact_person ?? org.name ?? org.company_name ?? "",
                                email: org.email ?? "",
                                phone: org.phone ?? "",
                                position: org.position ?? "",
                                raw: org,
                            },
                        ];
                    };

                    const handleContactChange = (contactId) => {
                        const isClient = data.client_type === "Client";
                        const source = isClient ? companies : leads;

                        const selectedOrg = source.find(
                            (c) => String(c.id) === String(data.company_id)
                        );

                        if (!selectedOrg) return;

                        const list = getContactList(selectedOrg);
                        const selectedContact = list.find(
                            (p) => String(p.id) === String(contactId)
                        );

                        if (!selectedContact) return;

                        const finalData = {
                            contact_person_id: selectedContact.id,
                            contact_person: selectedContact.name || "",
                            email: selectedContact.email || "",
                            phone: selectedContact.phone || "",
                            position: selectedContact.position || "",
                        };

                        Object.entries(finalData).forEach(([f, v]) => {
                            if (typeof builderUpdate === "function") builderUpdate(f, v);
                        });

                        setData((prev) => ({ ...prev, ...finalData }));
                    };

                    // Auto-select a contact when company_id is present but contact_person_id is not
                    useEffect(() => {
                        if (!data.company_id) return;
                        if (data.contact_person_id) return;

                        const isClient = data.client_type === "Client";
                        const source = isClient ? companies : leads;
                        const selectedOrg = source.find(
                            (c) => String(c.id) === String(data.company_id)
                        );
                        if (!selectedOrg) return;

                        const list = getContactList(selectedOrg);
                        if (!list || list.length === 0) return;

                        const first = list[0];
                        const id = first.id;

                        const finalData = {
                            contact_person_id: String(id),
                            contact_person: first.name || "",
                            email: first.email || "",
                            phone: first.phone || "",
                            position: first.position || "",
                        };

                        Object.entries(finalData).forEach(([f, v]) => {
                            if (typeof builderUpdate === "function") builderUpdate(f, v);
                        });

                        setData((prev) => ({ ...prev, ...finalData }));
                    }, [data.company_id, data.client_type]);

                    // Sync date and valid_until into builder so inputs show existing values
                    useEffect(() => {
                        if (typeof builderUpdate !== "function") return;
                        if (data.date) builderUpdate("date", data.date);
                        if (data.valid_until) builderUpdate("valid_until", data.valid_until);
                    }, [data.date, data.valid_until]);

                    const handleDiscountChange = (value) => {
                        builderUpdate("discount", value);
                        setData("discount", value);
                        if (value === "no") {
                            builderUpdate("discount_amount", 0);
                            setData("discount_amount", 0);
                            // calculateAndSyncTotals(
                            //     data.services,
                            //     data.tax,
                            //     data.tax_type,
                            //     0
                            // );
                        }
                    };

                    const handleDiscountAmountChange = (val) => {
                        const amount = Number(val) || 0;
                        builderUpdate("discount_amount", amount);
                        setData("discount_amount", amount);
                        // calculateAndSyncTotals(
                        //     data.services,
                        //     data.tax,
                        //     data.tax_type,
                        //     amount
                        // );
                    };

                    // const handleTaxTypeChange = (valueString) => {
                    //     let taxName = null;
                    //     let taxRate = 0;

                    //     if (valueString && valueString !== "|0") {
                    //         const [name, rate] = valueString.split("|");
                    //         taxName = name;
                    //         taxRate = Number(rate);
                    //     }
                    //     builderUpdate("tax_type", taxName);
                    //     builderUpdate("tax", taxRate);

                    //     setData((prev) => ({
                    //         ...prev,
                    //         tax_type: taxName,
                    //         tax: taxRate,
                    //     }));

                    //     // calculateAndSyncTotals(
                    //     //     data.services,
                    //     //     taxRate,
                    //     //     taxName,
                    //     //     data.discount_amount
                    //     // );
                    // };

                    const handleTaxTypeChange = (valueString) => {
                        let taxName = null;
                        let taxRate = 0;

                        // Jika valueString adalah "|0" atau tidak valid, biarkan default (null dan 0)
                        if (
                            valueString &&
                            valueString.includes("|") &&
                            valueString !== "|0"
                        ) {
                            const parts = valueString.split("|");
                            taxName = parts[0];
                            taxRate = parseFloat(parts[1]) || 0;
                        }

                        // Hitung nilai tax_amount dari sub_total saat ini
                        const currentSubTotal = Number(data.sub_total || 0);
                        const calculatedTaxAmount = currentSubTotal * taxRate;

                        // Update Builder (untuk Preview)
                        builderUpdate("tax_type", taxName);
                        builderUpdate("tax", taxRate);
                        builderUpdate("tax_amount", calculatedTaxAmount);

                        // Update State Utama (Inertia useForm)
                        setData((prev) => ({
                            ...prev,
                            tax_type: taxName,
                            tax: taxRate,
                            tax_amount: calculatedTaxAmount,
                        }));
                    };
                    return (
                        <div className="space-y-5">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full border-gray-300 rounded text-sm"
                                    value={data.date || ""}
                                    onChange={(e) => {
                                        builderUpdate("date", e.target.value);
                                        setData("date", e.target.value);
                                    }}
                                />
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                {["Client", "Lead"].map((type) => {
                                    const isActive = data.client_type === type;

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const newType = type;

                                                // Update builder jika Anda menggunakan plugin builder
                                                if (
                                                    typeof builderUpdate ===
                                                    "function"
                                                ) {
                                                    builderUpdate(
                                                        "client_type",
                                                        newType
                                                    );
                                                }

                                                // Reset data terkait saat pindah tipe agar tidak terjadi salah ID
                                                setData((prev) => ({
                                                    ...prev,
                                                    client_type: newType,
                                                    company_id: null,
                                                    company_name: null,
                                                    contact_person: "",
                                                    email: "",
                                                    phone: "",
                                                    contact_person_id: null,
                                                }));
                                            }}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                                isActive
                                                    ? "bg-[#065f46] text-white shadow-md"
                                                    : "text-gray-400 hover:text-gray-600"
                                            }`}
                                        >
                                            {type.toUpperCase()}
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                className={
                                    nameIsLocked
                                        ? "opacity-40 pointer-events-none"
                                        : ""
                                }
                            >
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Select {data.client_type}
                                </label>
                                <select
                                    className="w-full border-gray-300 rounded text-sm"
                                    value={data.company_id || ""}
                                    onChange={(e) =>
                                        handleSelectionChange(e.target.value)
                                    }
                                >
                                    <option value="">
                                        -- Choose {data.client_type} --
                                    </option>
                                    {currentOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {data.client_type === "Client"
                                                ? item.lead?.company_name ||
                                                  item.client_code
                                                : item.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div
                                className={`space-y-1 ${
                                    !data.company_id ? "opacity-40" : ""
                                }`}
                            >
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Select Contact Person
                                </label>
                                <select
                                    className="w-full border-gray-300 rounded text-sm"
                                    value={String(data.contact_person_id || "")}
                                    onChange={(e) =>
                                        handleContactChange(e.target.value)
                                    }
                                    disabled={!data.company_id}
                                >
                                    <option value="">-- Choose Person --</option>
                                    {(() => {
                                        const isClient = data.client_type === "Client";
                                        const source = isClient ? companies : leads;

                                        const selectedOrg = source.find(
                                            (c) => String(c.id) === String(data.company_id)
                                        );

                                        if (!selectedOrg) return null;

                                        const list = getContactList(selectedOrg);

                                        if (!list || list.length === 0) return null;

                                        return list.map((ct) => {
                                            const labelName = ct.name || ct.contact_person || "No Name";
                                            const positionDisplay = ct.position ? ` (${ct.position})` : "";
                                            return (
                                                <option key={ct.id} value={ct.id}>
                                                    {labelName}
                                                    {positionDisplay}
                                                </option>
                                            );
                                        });
                                    })()}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col justify-start">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Subject
                                    </label>
                                    <textarea
                                        rows="3"
                                        className="w-full border-gray-300 rounded text-sm font-bold"
                                        value={data.subject || ""}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            builderUpdate("subject", newValue);
                                            setData("subject", newValue);
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col justify-start">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Discount
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={data.discount || "no"}
                                        onChange={(e) =>
                                            handleDiscountChange(e.target.value)
                                        }
                                    >
                                        <option value="">
                                            -- Choose Option --
                                        </option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                                {data.discount === "yes" && (
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                                            Discount Amount
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full border-gray-300 rounded text-sm font-bold"
                                            value={data.discount_amount || ""}
                                            onChange={(e) =>
                                                handleDiscountAmountChange(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Tax
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={(() => {
                                            const t = Number(data.tax || 0);
                                            if (isFinite(t)) {
                                                if (Math.abs(t - 0.11) < 0.001) return "PPN 11%|0.11";
                                                if (Math.abs(t - 0.12) < 0.001) return "PPN 12%|0.12";
                                            }
                                            return "|0";
                                        })()}
                                        onChange={(e) =>
                                            handleTaxTypeChange(e.target.value)
                                        }
                                    >
                                        <option value="|0">-- No Tax --</option>
                                        <option value="PPN 11%|0.11">
                                            PPN 11%
                                        </option>
                                        <option value="PPN 12%|0.12">
                                            PPN 12%
                                        </option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-start">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Payment Terms
                                    </label>
                                    <textarea
                                        rows="3"
                                        className="w-full border-gray-300 rounded text-sm font-bold"
                                        value={data.payment_terms || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            builderUpdate("payment_terms", val);
                                            setData("payment_terms", val);
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col justify-start">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Note
                                    </label>
                                    <textarea
                                        rows="3"
                                        className="w-full border-gray-300 rounded text-sm font-bold"
                                        value={data.note || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            builderUpdate("note", val);
                                            setData("note", val);
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col justify-start">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Valid Until
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={data.valid_until}
                                        onChange={(e) => {
                                            builderUpdate(
                                                "valid_until",
                                                e.target.value
                                            );
                                            setData(
                                                "valid_until",
                                                e.target.value
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }}
                renderPreview={({
                    data,
                    addItem,
                    removeItem,
                    updateField: builderUpdate,
                }) => {
                    if (!builderAddItem) setBuilderAddItem(() => addItem);

                    // useEffect(() => {
                    //     const calculatedSubTotal = data.services.reduce(
                    //         (acc, curr) => acc + parseFloat(curr.price || 0),
                    //         0
                    //     );

                    //     const taxRate = parseFloat(data.tax) || 0;
                    //     const discountAmount = parseFloat(data.discount_amount) || 0;

                    //     const calculatedTaxAmount =
                    //         calculatedSubTotal * taxRate;

                    //     const calculatedTotal =
                    //         (calculatedSubTotal +
                    //         calculatedTaxAmount) -
                    //         discountAmount

                    //     const finalTotal = Math.round(calculatedTotal);

                    //     if (
                    //         Math.abs(data.total - calculatedTotal) > 0.01 ||
                    //         Math.abs(data.sub_total - calculatedSubTotal) > 0.01
                    //     ) {
                    //         setData((prev) => ({
                    //             ...prev,
                    //             sub_total: calculatedSubTotal,
                    //             tax_amount: calculatedTaxAmount,
                    //             total: calculatedTotal,
                    //         }));
                    //     }
                    // }, [data.services, data.tax, data.discount_amount]);

                    const calculatedSubTotal = data.services.reduce(
                        (acc, curr) => acc + parseFloat(curr.price || 0),
                        0
                    );

                    const rawTax = parseFloat(data.tax);
                    const taxRate =
                        isNaN(rawTax) || !isFinite(rawTax) ? 0 : rawTax;

                    const discountAmount =
                        data.discount === "yes"
                            ? parseFloat(data.discount_amount) || 0
                            : 0;

                    const calculatedTaxAmount = calculatedSubTotal * taxRate;
                    const calculatedTotal =
                        calculatedSubTotal +
                        calculatedTaxAmount -
                        discountAmount;

                    useEffect(() => {
                        const isDifferent =
                            Math.abs(
                                (data.sub_total || 0) - calculatedSubTotal
                            ) > 1 ||
                            Math.abs((data.total || 0) - calculatedTotal) > 1;

                        if (isDifferent) {
                            setData((prev) => ({
                                ...prev,
                                sub_total: calculatedSubTotal,
                                tax_amount: calculatedTaxAmount,
                                total: calculatedTotal,
                            }));
                        }
                    }, [
                        calculatedSubTotal,
                        calculatedTaxAmount,
                        calculatedTotal,
                    ]);

                    // useEffect(() => {
                    //     if (data.contact_person_id) {
                    //         handleContactChange(data.contact_person_id);
                    //     }
                    // }, [data.contact_person_id]);
                    return (
                        <div className="p-2 text-[12px]">
                            {/* Preview Header */}
                            <div className="flex justify-between pb-4 mb-6">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                                        Number
                                    </p>
                                    <p className="font-bold">
                                        {data.number || "Q-2024-XXXX"}
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                                        Date
                                    </p>
                                    <p className="font-bold">
                                        {data.date || "Date Not Set"}
                                    </p>
                                </div>
                            </div>

                            {/* Info Client */}
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="border border-black p-5 rounded-sm">
                                    <div className="grid gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                To:
                                            </p>
                                            <p className="font-bold text-emerald-800">
                                                {data.contact_person || "---"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                Email:
                                            </p>
                                            <p className="text-black">
                                                {data.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                Handphone:
                                            </p>
                                            <p className="text-black">
                                                {data.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border border-black p-5 rounded-sm">
                                    <div className="grid gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                Company:
                                            </p>
                                            <p className="font-black">
                                                {data.company_name || "---"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                Address:
                                            </p>
                                            <p className="text-black leading-tight">
                                                {data.address ||
                                                    "No address provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="text-left">
                                    <p className="text-[15px] font-bold text-black">
                                        Subject
                                    </p>
                                    <p className="text-[13px] text-gray-600 font-medium">
                                        {data.subject}
                                    </p>
                                </div>
                            </div>

                            {/* Table */}
                            <p className="text-[15px] font-bold text-black mb-2">
                                Quotation Detail
                            </p>
                            <table className="w-full border-collapse border border-black">
                                <thead className="bg-gray-50 uppercase text-[10px] font-black border-b border-black">
                                    <tr>
                                        <th className="p-2 text-center w-8 border border-black">
                                            No
                                        </th>
                                        <th className="p-2 text-left border border-black">
                                            Description
                                        </th>
                                        <th className="p-2 text-center w-24 border border-black">
                                            Processing
                                        </th>
                                        <th className="p-2 text-right w-32">
                                            Amount
                                        </th>
                                        <th
                                            data-html2canvas-ignore="true"
                                            className="print:hidden p-2 w-10"
                                        ></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.services.map((s, i) => (
                                        <tr
                                            key={s.id || i}
                                            className="border-b border-gray-100 relative group"
                                        >
                                            <td className="p-2 text-center font-bold text-gray-400 border border-black">
                                                {/* Untuk nomor urut tetap pakai index dari map jika perlu */}
                                                {data.services.indexOf(s) + 1}
                                            </td>
                                            <td className="p-2 font-bold uppercase border border-black">
                                                {s.name}
                                            </td>
                                            <td className="p-2 text-center border border-black">
                                                {s.processing}
                                            </td>
                                            <td className="p-2 text-right font-black border-b border-black">
                                                {formatIDR(s.price)}
                                            </td>
                                            <td className="print:hidden p-2 text-center border-b border-black">
                                                <button
                                                    type="button"
                                                    data-html2canvas-ignore="true"
                                                    onClick={() => {
                                                        console.log(
                                                            "ID Item ini adalah:",
                                                            s.id
                                                        );
                                                        removeItem(s.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Add Button */}
                            <div
                                data-html2canvas-ignore="true"
                                className="mt-4 flex justify-start print:hidden"
                            >
                                <button
                                    data-html2canvas-ignore="true"
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 bg-[#065f46] text-white px-4 py-2 rounded-sm text-[10px] font-bold tracking-widest hover:scale-105 transition-all shadow-lg"
                                >
                                    ADD SERVICE
                                </button>
                            </div>

                            <div className="mt-10 flex justify-between">
                                <div className="w-1/2">
                                    <div className="h-[6rem] mb-5">
                                        <p className="text-[15px] font-black font-bold mb-1">
                                            Payment Terms
                                        </p>
                                        <p className="text-red-600 text-[11px] font-medium leading-tight whitespace-pre-wrap">
                                            {data.payment_terms ||
                                                "50% initial payment upon service confirmation. Remaining 50% to be settled upon completion of the Business Entity Certificate (SBU) process."}
                                        </p>
                                    </div>
                                    <div className="h-[3rem] mb-20">
                                        <p className="text-[15px] font-black font-bold mb-1">
                                            Note
                                        </p>
                                        <p className="text-red-600 text-[11px] font-medium leading-tight whitespace-pre-wrap">
                                            {data.note ||
                                                "The processing time excludes Saturdays, Sundays, and public holidays."}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-black font-bold mb-1">
                                            Valid Until
                                        </p>
                                        <p className="text-red-600 text-[11px] font-medium leading-tight">
                                            {`This quotation is valid until (${data.valid_until})`}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-1/3 space-y-1 font-bold">
                                    <div className="flex justify-between">
                                        <span>Discount</span>
                                        <span>
                                            {data.discount === "yes"
                                                ? formatIDR(discountAmount)
                                                : formatIDR(0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>
                                            {formatIDR(calculatedSubTotal)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-b border-black pb-1">
                                        <span>{data.tax_type || "Tax"}</span>
                                        <span>
                                            {formatIDR(calculatedTaxAmount)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm font-black pt-1">
                                        <span>TOTAL</span>
                                        <span>
                                            {formatIDR(calculatedTotal)}
                                        </span>
                                    </div>
                                    <p className="text-[17px] uppercase font-black pt-[0.9rem] pb-[5.2rem]">
                                        {data.company_name || "---"}
                                    </p>
                                    <div className="text-left">
                                        <p className="text-[15px] uppercase font-black pt-[0.9rem]">
                                            {data.contact_person || "---"}
                                        </p>
                                        <p className="text-[15px] text-gray-400">
                                            {data.position || "---"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
                renderPDFPreview={quotationPDFPreview}
            />
        </>
    );
}
