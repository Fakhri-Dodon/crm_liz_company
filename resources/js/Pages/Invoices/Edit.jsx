import React, { useState, useEffect } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import DocumentBuilder from "@/Components/PDF_Builder/Builder";
import { Edit as EditIcon, Trash2, Loader2, Plus } from "lucide-react";
import html2pdf from 'html2pdf.js';
import { Toaster, toast } from 'react-hot-toast';

export default function Edit({ leads = [], companies = [], quotations = [], invoice }) {
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
            price: Number(newItem.price) || 0
        };

        console.log("Menambahkan item dengan ID:", itemWithId.id);

        setData('services', [...data.services, itemWithId]);
    };

    const {
        data,
        setData,
        put,
        processing: formLoading,
    } = useForm({
        document_type: "INVOICE",
        client_type: invoice.is_client ? "Client" : "Lead",
        date: invoice.date || "",
        number: invoice.invoice_number || "",
        company_id: invoice.company_id || null,
        company_name: invoice.company_name || "",
        address: invoice.address || "",
        contact_person: invoice.contact_person || "",
        position: invoice.position || "",
        email: invoice.email || "",
        phone: invoice.phone || "",
        quotation_id: invoice.quotation_id || "",
        payment_type: invoice.payment_type || "",
        payment_percentage: invoice.payment_percentage || 0,
        payment_terms: invoice.payment_terms || "",
        note: invoice.note || "",
        services: invoice.invoice_items || [],
        ppn: invoice.ppn || 0,
        pph: invoice.pph || 0,
        down_payment: invoice.down_payment || 0,
        sub_total: invoice.sub_total || 0,
        tax_amount_ppn: invoice.tax_amount_ppn || 0,
        tax_amount_pph: invoice.tax_amount_pph || 0,
        total: invoice.total || 0,
    });

    useEffect(() => {
        const subTotal = data.services.reduce(
            (acc, curr) => acc + Number(curr.price || 0),
            0
        );

        const ppnRate = Number(data.ppn || 0);
        const pphRate = Number(data.pph || 0);
        const downPaymentPercent = Number(data.payment_percentage || 0);

        const ppnAmount = subTotal * ppnRate;
        const pphAmount = subTotal * pphRate;
        const downPaymentAmount = subTotal * downPaymentPercent;
        
        const total = subTotal + ppnAmount - pphAmount;

        if (
            data.sub_total !== subTotal ||
            data.total !== total ||
            data.tax_amount_ppn !== ppnAmount ||
            data.tax_amount_pph !== pphAmount ||
            data.down_payment !== downPaymentAmount
        ) {
            setData((prevData) => ({
                ...prevData,
                sub_total: subTotal,
                tax_amount_ppn: ppnAmount,
                tax_amount_pph: pphAmount,
                down_payment: downPaymentAmount,
                total: total,
            }));
        }
    }, [data.services, data.ppn, data.pph, data.payment_percentage]);

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
            formData.append('_method', 'PUT');

            router.post(route("invoice.update", invoice.id), formData, {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Berhasil diupdate!', {
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
                    console.error("Penyebab Gagal Update", err);
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
        router.get("/invoice");
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
                                        placeholder="Kualifikasi Kecil, BG001, BG002, BG003"
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
                title="Edit Invoice"
                data={data}
                setData={setData}
                onSave={handleSave}
                onBack={handleBack}
                renderEditor={({ updateField: builderUpdate }) => {
                    const nameIsLocked = !data.client_type;
                    
                    const calculateAndSyncTotals = (
                        currentServices,
                        currentPpn,
                        currentPph,
                        currentPaymentPercentage
                    ) => {
                        const subTotal = (currentServices || []).reduce(
                            (acc, curr) => acc + Number(curr.price || 0),
                            0
                        );

                        const ppnAmount = subTotal * currentPpn;
                        const pphAmount = subTotal * currentPph;
                        const downPayment = subTotal * currentPaymentPercentage;
                        const total = subTotal + ppnAmount - pphAmount;

                        builderUpdate("sub_total", subTotal);
                        builderUpdate("tax_amount_ppn", ppnAmount);
                        builderUpdate("tax_amount_pph", pphAmount);
                        builderUpdate("down_payment", downPayment);
                        builderUpdate("total", total);
                        
                        setData((prev) => ({
                            ...prev,
                            sub_total: subTotal,
                            tax_amount_ppn: ppnAmount,
                            tax_amount_pph: pphAmount,
                            down_payment: downPayment,
                            total: total,
                            services: currentServices,
                        }));
                    };

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
                                company_id: selected.id,
                                lead_id: isClient
                                    ? selected.lead_id
                                    : selected.id,
                                company_name: isClient
                                    ? selected.lead?.company_name ||
                                      selected.client_code
                                    : selected.company_name,
                                address: dataSource?.address || "",
                                contact_person_id: "",
                                contact_person: "",
                                email: "",
                                phone: "",
                                position: "",
                            };

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

                    const handlePpnChange = (valueString) => {
                        let ppnRate = 0;
                        if (valueString && valueString !== "0") {
                            ppnRate = Number(valueString);
                        }
                        builderUpdate("ppn", ppnRate);
                        setData((prev) => ({
                            ...prev,
                            ppn: ppnRate,
                        }));
                        calculateAndSyncTotals(
                            data.services,
                            ppnRate,
                            data.pph,
                            data.payment_percentage
                        );
                    };

                    const handlePphChange = (valueString) => {
                        let pphRate = 0;
                        if (valueString && valueString !== "0") {
                            pphRate = Number(valueString);
                        }
                        builderUpdate("pph", pphRate);
                        setData((prev) => ({
                            ...prev,
                            pph: pphRate,
                        }));
                        calculateAndSyncTotals(
                            data.services,
                            data.ppn,
                            pphRate,
                            data.payment_percentage
                        );
                    };

                    return (
                        <div className="space-y-5">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">
                                    Date<span className="text-red-600">*</span> 
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
                                    Select Company<span className="text-red-600">*</span> 
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
                                    Select Contact Person<span className="text-red-600">*</span> 
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
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Quotation - Accepted
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={data.quotation_id || ""}
                                        onChange={(e) => {
                                            builderUpdate("quotation_id", e.target.value);
                                            setData("quotation_id", e.target.value);
                                        }}
                                    >
                                        <option value="">-- Choose Quotation --</option>
                                        {quotations.map((q) => (
                                            <option key={q.id} value={q.id}>
                                                {q.no} - {q.company_name || q.lead?.company_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Payment Type<span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={data.payment_type || ""}
                                        onChange={(e) => {
                                            builderUpdate("payment_type", e.target.value);
                                            setData("payment_type", e.target.value);
                                        }}
                                    >
                                        <option value="">-- Choose Payment --</option>
                                        <option value="Down Payment">Down Payment</option>
                                        <option value="Full Payment">Full Payment</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Payment Percentage (10% = 0.1)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border-gray-300 rounded text-sm font-bold"
                                        value={data.payment_percentage || ""}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) || 0;
                                            builderUpdate("payment_percentage", val);
                                            setData("payment_percentage", val);
                                            calculateAndSyncTotals(
                                                data.services,
                                                data.ppn,
                                                data.pph,
                                                val
                                            );
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        PPN (11% = 0.11)
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={data.ppn || 0}
                                        onChange={(e) => handlePpnChange(e.target.value)}
                                    >
                                        <option value="0">-- No PPN --</option>
                                        <option value="0.11">PPN 11%</option>
                                        <option value="0.12">PPN 12%</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        PPh (2% = 0.02)
                                    </label>
                                    <select
                                        className="w-full border-gray-300 rounded text-sm"
                                        value={data.pph || 0}
                                        onChange={(e) => handlePphChange(e.target.value)}
                                    >
                                        <option value="0">-- No PPh --</option>
                                        <option value="0.02">PPh 2%</option>
                                        <option value="0.03">PPh 3%</option>
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                                        Payment Terms<span className="text-red-600">*</span> 
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
                                        Note<span className="text-red-600">*</span> 
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

                        const ppnRate = Number(data.ppn) || 0;
                        const pphRate = Number(data.pph) || 0;
                        const downPaymentPercent = Number(data.payment_percentage || 0);

                        const calculatedPpnAmount = calculatedSubTotal * ppnRate;
                        const calculatedPphAmount = calculatedSubTotal * pphRate;
                        const calculatedDownPayment = calculatedSubTotal * downPaymentPercent;
                        const calculatedTotal = calculatedSubTotal + calculatedPpnAmount - calculatedPphAmount;

                        if (
                            data.sub_total !== calculatedSubTotal || 
                            data.total !== calculatedTotal ||
                            data.tax_amount_ppn !== calculatedPpnAmount ||
                            data.tax_amount_pph !== calculatedPphAmount ||
                            data.down_payment !== calculatedDownPayment
                        ) {
                            setData(prev => ({
                                ...prev,
                                sub_total: calculatedSubTotal,
                                tax_amount_ppn: calculatedPpnAmount,
                                tax_amount_pph: calculatedPphAmount,
                                down_payment: calculatedDownPayment,
                                total: calculatedTotal
                            }));
                        }
                    }, [data.services, data.ppn, data.pph, data.payment_percentage]);

                    return (
                        <div className="p-2 text-[12px]">
                            {/* Preview Header */}
                            <div className="flex justify-between pb-4 mb-6">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                                        Number
                                    </p>
                                    <p className="font-bold">
                                        {data.number || "INV-XXXXX"}
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
                            </div>

                            {/* Table */}
                            <p className="text-[15px] font-bold text-black mb-2">
                                Services
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
                                            Qualification
                                        </th>
                                        <th className="p-2 text-right w-32">
                                            Price
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
                                </div>
                                <div className="w-1/3 space-y-1 font-bold">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>
                                            {formatIDR(data.sub_total || 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Down Payment {data.payment_percentage ? `${(data.payment_percentage * 100).toFixed(0)}%` : ''}</span>
                                        <span>
                                            {formatIDR(data.down_payment || 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-red-600">
                                        <span>VAT (PPN) {data.ppn ? `${(data.ppn * 100).toFixed(0)}%` : ''}</span>
                                        <span>
                                            {formatIDR(data.tax_amount_ppn || 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-red-600 border-b border-black pb-1">
                                        <span>VAT (PPh) {data.pph ? `${(data.pph * 100).toFixed(0)}%` : ''}</span>
                                        <span>
                                            {formatIDR(data.tax_amount_pph || 0)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm font-black pt-1">
                                        <span>TOTAL</span>
                                        <span>
                                            {formatIDR(data.total || 0)}
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
            />
        </>
    );
}
