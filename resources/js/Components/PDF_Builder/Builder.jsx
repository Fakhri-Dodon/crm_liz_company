import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import PDFPreview from '@/Components/PDF_Builder/Preview';
import { quotationPDFPreview } from '@/Components/PDF_Builder/PDFGenerator';
import { useTranslation } from "react-i18next";

export default function Builder({ title, data, setData, renderEditor, renderPreview, onSave, onBack }) {
    const updateField = (name, value) => setData(prev => ({ ...prev, [name]: value }));
    
    const updateItem = (id, field, value) => {
        setData(prev => ({
            ...prev,
            services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const { t } = useTranslation();

    const addItem = (payload) => {
        const newItem = {
            id: crypto.randomUUID(),
            name: payload?.name || '',
            processing: payload?.processing || '',
            price: Number(payload?.price) || 0
        };

        console.log("Menambah item baru:", newItem);

        setData('services', [...data.services, newItem]);
    };

    const removeItem = (id) => {
        if (id === undefined) {
            console.error("Gagal menghapus: ID tidak ditemukan (undefined)");
            return;
        }

        const filteredServices = data.services.filter(s => s.id !== id);
        setData('services', filteredServices);
    };

    const { props } = usePage();
    const logoUrl = props.app_config?.doc_logo_path 
                    ? `/storage/${props.app_config.doc_logo_path}` 
                    : null;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
            <Head title={title} />
            
            {/* Sidebar Editor */}
            <div className="w-[360px] bg-[#fdfdfd] border-r-4 border-[#2d6a4f] overflow-y-auto p-5 shadow-xl">
                <h2 className="text-gray-500 font-black text-lg mb-6 italic uppercase tracking-tighter">{title}</h2>
                {renderEditor({ data, updateField, updateItem, addItem, removeItem })}
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-4 bg-white border-b flex justify-between items-center px-10 shadow-sm">
                    <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">{t("quotations.builder.draft")}</span>
                    <div className="flex gap-3">
                        {onBack && (
                            <button 
                                className="border-2 border-[#c8e1b5] text-[#7a9466] px-5 py-2 rounded-lg font-bold text-xs uppercase transition-all hover:bg-[#c8e1b5] hover:text-white active:scale-95"
                                onClick={() => onBack(data)}
                            >
                                {t("quotations.builder.btn_back")}
                            </button>
                        )}


                        <button 
                            className="bg-[#065f46] hover:bg-[#047857] text-white px-6 py-2 rounded font-bold text-xs uppercase shadow-md transition-all"
                            onClick={() => quotationPDFPreview(data)}
                        >
                            {t("quotations.builder.btn_preview")}
                        </button>
                        <button onClick={() => onSave(data)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-xs uppercase shadow-md transition-all">
                            {t("quotations.builder.btn_save")}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <PDFPreview title={data.document_type} logoUrl={logoUrl}>
                        {renderPreview({ 
                            data, 
                            updateField, 
                            updateItem, 
                            addItem, 
                            removeItem,
                            logoUrl,
                        })},
                    </PDFPreview>
                    <div className="text-center bg-gray-100"></div>
                </div>
            </div>
        </div>
    );
}