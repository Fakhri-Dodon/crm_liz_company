import React, { useState, useEffect } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import DocumentBuilder from "@/Components/PDF_Builder/Builder";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import html2pdf from 'html2pdf.js';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from "react-i18next";

export default function Create({ nextNumber, leads = [], companies = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        processing: "",
        price: "",
    });
    const { t } = useTranslation();    
    const { auth, app_config } = usePage().props;

    const builderAddItem = (newItem) => {
        const itemWithId = {
            ...newItem,
            id: Date.now() + Math.random(),
            price: Number(newItem.price) || 0
        };

        setData('services', [...data.services, itemWithId]);
    };

    const generateFormatNumber = (num) => {
        const val =
            typeof num === "object" && num !== null ? num.nextNumber : num;
        const sequence = String(val || 1).padStart(4, "0");

        return `${sequence}`;
    };

    const {
        data,
        setData,
        post,
        processing: formLoading,
    } = useForm({
        document_type: "QUOTATION",
        client_type: null,
        date: "",
        number: generateFormatNumber(nextNumber),

        prepared_by_name: auth.user.name,
        prepared_by_role: auth.user.role_name,
        my_company_name: app_config.company_name,

        company_id: null,
        company_name: null,
        address: "",
        contact_person: "",
        position: "",
        email: "",
        phone: "",
        subject: "",
        payment_terms: "",
        note: "",
        valid_until: "",
        services: [],
        discount: "no",
        discount_amount: 0,
        tax_type: null,
        tax: 0,
        sub_total: 0,
        tax_amount: 0,
        total: 0,
    });

    useEffect(() => {
        const subTotal = data.services.reduce(
            (acc, curr) => acc + Number(curr.price || 0),
            0
        );

        const taxRate = Number(data.tax || 0);
        const ppn = data.tax_type ? subTotal * taxRate : 0;
        const discount = Number(data.discount_amount || 0);
        const total = subTotal + ppn - discount;

        if (
            data.sub_total !== subTotal ||
            data.total !== total ||
            data.tax_amount !== ppn
        ) {
            setData((prevData) => ({
                ...prevData,
                sub_total: subTotal,
                tax_amount: ppn,
                total: total,
            }));
        }
    }, [data.services, data.tax, data.tax_type, data.discount_amount]);

    const handleSave = async () => {
        if (data.services.length === 0) {
            alert("Peringatan: Anda harus menambahkan setidaknya satu jasa/layanan sebelum menyimpan.");
            return;
        }

        if (!data.company_id) {
            alert("Pilih client");
            return;
        }

        try {
            const element = document.getElementById('quotation-pdf');
            const opt = {
                margin: 0,
                filename: `${data.number}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

            const formData = new FormData();
            
            Object.keys(data).forEach(key => {
                if (key === 'services') {
                    const servicesData = Array.isArray(data.services) ? data.services : [];
                    formData.append('services', JSON.stringify(servicesData));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });

            formData.append('pdf_file', pdfBlob, `${data.number}.pdf`);

            router.post("/quotation/store", formData, {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Berhasil disimpan!', {
                        style: {
                        border: '1px solid #4ade80',
                        padding: '16px',
                        color: '#166534',
                        },
                        iconTheme: {
                        primary: '#4ade80',
                        secondary: '#FFFAEE',
                        },
                    });
                },
                onError: (err) => {
                    console.error("Penyebab Gagal Simpan", err);
                    for (let pair of formData.entries()) {
                        console.log(pair[0]+ ': ' + pair[1]); 
                    }
                },
            });

        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleBack = () => {
        router.get("/quotation");
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

    const { props } = usePage();
    const logoUrl = props.app_config?.doc_logo_path 
                    ? `/storage/${props.app_config.doc_logo_path}` 
                    : null;

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
                                    
                                    builderAddItem(newItem); 

                                    setShowModal(false);
                                    setNewItem({ name: "", processing: "", price: "" });
                                }}
                                className="bg-[#2d6a4f] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg"
                            >
                                ADD ITEM
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Toaster position="top-right" />

            {/* --- DOCUMENT BUILDER --- */}
            <DocumentBuilder
                title={t("quotations.builder.title")}
                data={data}
                setData={setData}
                onSave={handleSave}
                onBack={handleBack}
                renderEditor={({ updateField: builderUpdate }) => {
                    const nameIsLocked = !data.client_type;
                    const calculateAndSyncTotals = (
                        currentServices,
                        currentTaxRate,
                        currentTaxName,
                        currentDiscount
                    ) => {
                        const subTotal = (currentServices || []).reduce(
                            (acc, curr) => acc + Number(curr.price || 0),
                            0
                        );

                        const ppn = currentTaxName
                            ? subTotal * currentTaxRate
                            : 0;

                        const total =
                            subTotal + ppn - Number(currentDiscount || 0);

                        builderUpdate("sub_total", subTotal);
                        builderUpdate("tax_amount", ppn);
                        builderUpdate("total", total);
                        setData((prev) => ({
                            ...prev,
                            sub_total: subTotal,
                            tax_amount: ppn,
                            total: total,
                            services: currentServices,
                            discount_amount: Number(currentDiscount || 0),
                        }));
                    };

                    // const handleSelectionChange = (id) => {
                    //     const isClient = data.client_type === "Client";
                    //     const source = isClient ? companies : leads;
                        
                    //     const selected = source.find(
                    //         (item) => String(item.id) === String(id)
                    //     );

                    //     if (selected) {
                    //         const dataSource = isClient ? selected.lead : selected;
                    //         const correctLeadId = isClient ? selected.lead_id : selected.id;
                    //         const correctCompanyId = isClient ? selected.id : null;

                    //         const updateData = {
                    //             company_id: correctCompanyId,
                    //             lead_id: correctLeadId,
                    //             company_name: isClient 
                    //                 ? (selected.lead?.company_name || selected.client_code) 
                    //                 : selected.company_name,
                    //             address: dataSource?.address || "",
                    //             contact_person_id: "",
                    //             contact_person: "",
                    //             email: "",
                    //             phone: "",
                    //             position: "",
                    //         };
                    //         Object.entries(updateData).forEach(([field, value]) => builderUpdate(field, value));
                    //         setData((prev) => ({ ...prev, ...updateData }));
                    //     }
                    // };
                    // const currentOptions =
                    //     data.client_type === "Client"
                    //         ? companies || []
                    //         : leads || [];

                    // // const handleContactChange = (contactName) => {
                    // //     updateField("contact_person", contactName);
                    // //     const sourceDB =
                    // //         data.client_type === "LEAD" ? leadsDB : clientsDB;
                    // //     const currentCompany = sourceDB.find(
                    // //         (c) => c.name === data.company_name
                    // //     );

                    // //     const selectedContact = currentCompany?.contacts.find(
                    // //         (ct) => ct.name === contactName
                    // //     );

                    // //     if (selectedContact) {
                    // //         updateField("email", selectedContact.email);
                    // //         updateField("phone", selectedContact.phone);
                    // //         updateField("position", selectedContact.position);
                    // //     } else {
                    // //         updateField("email", "");
                    // //         updateField("phone", "");
                    // //         updateField("position", "");
                    // //     }
                    // // };

                    // const handleContactChange = (contactId) => {
                    //     const isClient = data.client_type === "Client";
                    //     const source = isClient ? companies : leads;
                    //     const selectedOrg = source.find(
                    //         (c) => String(c.id) === String(data.company_id)
                    //     );

                    //     if (selectedOrg) {
                    //         const personRow = isClient
                    //             ? selectedOrg.contact_persons?.find(
                    //                 (p) => String(p.id) === String(contactId)
                    //             )
                    //             : String(selectedOrg.id) === String(contactId)
                    //             ? selectedOrg
                    //             : null;

                    //         if (personRow) {
                    //             const dataSource = isClient 
                    //                 ? personRow.lead 
                    //                 : selectedOrg;

                    //             const finalData = {
                    //                 contact_person_id: contactId,
                    //                 contact_person: dataSource?.contact_person || "",
                    //                 email: dataSource?.email || "",
                    //                 phone: dataSource?.phone || "",
                    //                 position: isClient 
                    //                     ? personRow.position || "" 
                    //                     : "",
                    //             };
                    //             Object.entries(finalData).forEach(([f, v]) =>
                    //                 builderUpdate(f, v)
                    //             );

                    //             setData((prev) => ({ ...prev, ...finalData }));
                    //         }
                    //     }
                    // };

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

                    const handleContactChange = (contactId) => {
                        const isClient = data.client_type === "Client";
                        const source = isClient ? companies : leads;

                        const selectedOrg = source.find(
                            (c) => String(c.id) === String(data.company_id)
                        );

                        if (selectedOrg) {
                            let personRow = null;

                            if (isClient) {
                                personRow = selectedOrg.contact_persons?.find(
                                    (p) => String(p.id) === String(contactId)
                                );
                            } else {
                                personRow = selectedOrg;
                            }

                            if (personRow) {
                                const finalData = {
                                    contact_person_id: contactId,
                                    contact_person: isClient 
                                        ? (personRow.lead?.contact_person || selectedOrg.lead?.contact_person || "---") 
                                        : (selectedOrg.contact_person || ""),
                                    
                                    email: isClient 
                                        ? (personRow.lead?.email || selectedOrg.lead?.email || "") 
                                        : (personRow.email || ""),
                                    
                                    phone: isClient 
                                        ? (personRow.lead?.phone || selectedOrg.lead?.phone || "") 
                                        : (personRow.phone || ""),

                                    position: isClient 
                                        ? (personRow.position || "") 
                                        : (selectedOrg.job_title || selectedOrg.position || ""),
                                };

                                console.log("Data yang dikirim ke builder:", finalData);

                                Object.entries(finalData).forEach(([f, v]) => {
                                    if (typeof builderUpdate === 'function') {
                                        builderUpdate(f, v);
                                    }
                                });
                                
                                setData((prev) => ({ ...prev, ...finalData }));
                            }
                        }
                    };

                    const handleDiscountChange = (value) => {
                        builderUpdate("discount", value);
                        setData("discount", value);
                        if (value === "no") {
                            builderUpdate("discount_amount", 0);
                            setData("discount_amount", 0);
                            calculateAndSyncTotals(
                                data.services,
                                data.tax,
                                data.tax_type,
                                0
                            );
                        }
                    };

                    const handleDiscountAmountChange = (val) => {
                        const amount = Number(val) || 0;
                        builderUpdate("discount_amount", amount);
                        setData("discount_amount", amount);
                        calculateAndSyncTotals(
                            data.services,
                            data.tax,
                            data.tax_type,
                            amount
                        );
                    };

                    const handleTaxTypeChange = (valueString) => {
                        let taxName = null;
                        let taxRate = 0;

                        if (valueString && valueString !== "|0") {
                            const [name, rate] = valueString.split("|");
                            taxName = name;
                            taxRate = Number(rate);
                        }
                        builderUpdate("tax_type", taxName);
                        builderUpdate("tax", taxRate);

                        setData((prev) => ({
                            ...prev,
                            tax_type: taxName,
                            tax: taxRate,
                        }));

                        calculateAndSyncTotals(
                            data.services,
                            taxRate,
                            taxName,
                            data.discount_amount
                        );
                    };

                    const handleTaxChange = (taxName, taxRate) => {
                        builderUpdate("tax_type", taxName);
                        builderUpdate("tax", taxRate);
                        calculateAndSyncTotals(
                            data.services,
                            taxRate,
                            taxName,
                            data.discount_amount
                        );
                    };

                    const refreshTotals = (newData) => {
                        const subTotal = (newData.services || []).reduce(
                            (acc, curr) => acc + Number(curr.price || 0),
                            0
                        );

                        const taxRate = Number(newData.tax || 0);
                        const ppn = newData.tax_type ? subTotal * taxRate : 0;
                        const discount = Number(newData.discount_amount || 0);
                        const total = subTotal + ppn - discount;

                        builderUpdate("sub_total", subTotal);
                        builderUpdate("tax_amount", ppn);
                        builderUpdate("total", total);
                    };

                    return (
                        <div className="space-y-5">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t("quotations.builder.date")}<span className="text-red-600">*</span>
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
                                                builderUpdate(
                                                    "client_type",
                                                    newType
                                                );
                                                setData("client_type", newType);
                                                setData((prev) => ({
                                                    ...prev,
                                                    client_type: newType,
                                                    company_id: null,
                                                    company_name: null,
                                                    contact_person_id: null,
                                                }));

                                                console.log(
                                                    "State updated to:",
                                                    newType
                                                );
                                            }}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                                isActive
                                                    ? "bg-[#065f46] text-white shadow-md"
                                                    : "text-gray-400"
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
                                    {t("quotations.builder.select_company")}<span className="text-red-600">*</span> 
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
                                    !data.company_name ? "opacity-40" : ""
                                }`}
                            >
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    {t("quotations.builder.select_contact")}<span className="text-red-600">*</span> 
                                </label>
                                <select
                                    className="w-full border-gray-300 rounded text-sm"
                                    value={data.contact_person_id || ""}
                                    onChange={(e) =>
                                        handleContactChange(e.target.value)
                                    }
                                >
                                    <option value="">
                                        -- Choose Person --
                                    </option>
                                    {(() => {
                                        const isClient =
                                            data.client_type === "Client";
                                        const source = isClient
                                            ? companies
                                            : leads;
                                        const selectedOrg = source.find(
                                            (c) =>
                                                String(c.id) ===
                                                String(data.company_id)
                                        );

                                        if (!selectedOrg) return null;

                                        let contacts =
                                            selectedOrg.contact_persons || [];
                                        if (
                                            contacts.length === 0 &&
                                            !isClient
                                        ) {
                                            contacts = [{ id: selectedOrg.id }];
                                        }

                                        return contacts.map((ct) => {
                                            const labelName = isClient
                                                ? selectedOrg.lead
                                                      ?.contact_person ||
                                                  "No Name"
                                                : selectedOrg.contact_person ||
                                                  "No Name";

                                            // Tentukan apakah perlu menampilkan posisi
                                            // Hanya muncul jika tipe Client DAN field position ada
                                            const positionDisplay =
                                                isClient && ct.position
                                                    ? ` (${ct.position})`
                                                    : "";

                                            return (
                                                <option
                                                    key={ct.id}
                                                    value={ct.id}
                                                >
                                                    {labelName}
                                                    {positionDisplay}
                                                </option>
                                            );
                                        });
                                    })()}
                                </select>
                                {/* <select
                                    disabled={!data.company_name}
                                    className="w-full border-gray-300 rounded text-sm"
                                    value={data.contact_person}
                                    onChange={(e) =>
                                        handleContactChange(e.target.value)
                                    }
                                >
                                    <option>-- Choose Person --</option>
                                    {(data.client_type === "LEAD"
                                        ? leadsDB
                                        : clientsDB
                                    )
                                        .find(
                                            (c) => c.name === data.company_name
                                        )
                                        ?.contacts.map((ct) => (
                                            <option key={ct.id} value={ct.name}>
                                                {ct.name}
                                            </option>
                                        ))}
                                </select> */}
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col justify-start">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        {t("quotations.builder.subject")}<span className="text-red-600">*</span> 
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
                                        {t("quotations.builder.discount")}
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
                                            {(t("quotations.builder.discount_amount"))}
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
                                        {t("quotations.builder.tax")}<span className="text-red-600">*</span> 
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={`${data.tax_type || ""}|${
                                            data.tax || 0
                                        }`}
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
                                        {t("quotations.builder.payment_terms")}<span className="text-red-600">*</span> 
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
                                        {t("quotations.builder.note")}<span className="text-red-600">*</span> 
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
                                        {t("quotations.builder.valid_until")}<span className="text-red-600">*</span> 
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
                                            )
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }}
                renderPreview={({ data, addItem, removeItem, updateField }) => {                
                    if (!builderAddItem) setBuilderAddItem(() => addItem);

                   useEffect(() => {
                        const calculatedSubTotal = data.services.reduce(
                            (acc, curr) => acc + Number(curr.price || 0), 0
                        );

                        const taxRate = Number(data.tax) || 0;
                        const calculatedTaxAmount = calculatedSubTotal * taxRate;
                        const calculatedTotal = calculatedSubTotal + calculatedTaxAmount - Number(data.discount_amount || 0);

                        if (data.sub_total !== calculatedSubTotal || data.total !== calculatedTotal) {
                            setData(prev => ({
                                ...prev,
                                sub_total: calculatedSubTotal,
                                tax_amount: calculatedTaxAmount,
                                total: calculatedTotal
                            }));
                        }
                    }, [data.services, data.tax, data.discount_amount]);

                    // useEffect(() => {
                    //     const calculatedSubTotal = (data.services || []).reduce(
                    //         (acc, curr) => acc + Number(curr.price || 0),
                    //         0
                    //     );

                    //     const taxRate = Number(data.tax) || 0;

                    //     const calculatedTaxAmount =
                    //         calculatedSubTotal * taxRate;

                    //     const calculatedTotal =
                    //         calculatedSubTotal +
                    //         calculatedTaxAmount -
                    //         Number(data.discount_amount || 0);

                    //     if (data.sub_total !== calculatedSubTotal) {
                    //         updateField("sub_total", calculatedSubTotal);
                    //         setData("sub_total", calculatedSubTotal);
                    //     }

                    //     if (data.tax_amount !== calculatedTaxAmount) {
                    //         updateField("tax_amount", calculatedTaxAmount);
                    //         setData("tax_amount", calculatedTaxAmount);
                    //     }

                    //     if (data.total !== calculatedTotal) {
                    //         updateField("total", calculatedTotal);
                    //         setData("total", calculatedTotal);
                    //     }
                    // }, [data.services, data.tax, data.discount_amount]);

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
                                                {data.email || "---"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                Handphone:
                                            </p>
                                            <p className="text-black">
                                                {data.phone || "---"}
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
                                                {data.address || "---"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="text-left">
                                    <p className="text-[15px] font-bold text-black">
                                        Subject
                                    </p>
                                    <p className="text-[13px] text-gray-600 font-medium break-words">
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
                                                        console.log("ID Item ini adalah:", s.id); 
                                                        removeItem(s.id)
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
                                            {data.payment_terms}
                                        </p>
                                    </div>
                                    <div className="h-[3rem] mb-20">
                                        <p className="text-[15px] font-black font-bold mb-1">
                                            Note
                                        </p>
                                        <p className="text-red-600 text-[11px] font-medium leading-tight whitespace-pre-wrap">
                                            {data.note}
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
                                                ? formatIDR(
                                                      data.discount_amount
                                                  )
                                                : formatIDR(0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>
                                            {formatIDR(data.sub_total || 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-b border-black pb-1">
                                        <span>{data.tax_type || "Tax"}</span>
                                        <span>
                                            {formatIDR(data.tax_amount || 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm font-black pt-1">
                                        <span>TOTAL</span>
                                        <span>
                                            {formatIDR(data.total || 0)}
                                        </span>
                                    </div>
                                    <p className="text-[17px] uppercase font-black pt-[0.9rem] pb-[5.2rem]">
                                        {data.my_company_name || "---"}
                                    </p>
                                    <div className="text-left">
                                        <p className="text-[15px] uppercase font-black pt-[0.9rem]">
                                            {data.prepared_by_name || "---"}
                                        </p>
                                        <p className="text-[15px] text-gray-400">
                                            {data.prepared_by_role || "---"}
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
