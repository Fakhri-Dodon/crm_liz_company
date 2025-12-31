import { useState } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import ModalAdd from "@/Components/ModalAdd";
import TableLayout from "@/Layouts/TableLayout";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function EmailIndex() {
    const { templates } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const { t } = useTranslation();

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        subject: "",
        content: "",
    });

    // Menangani pembukaan modal (Tambah atau Edit)
    const handleOpenModal = (template = null) => {
        if (template) {
            setEditId(template.id);
            setData({
                name: template.name,
                subject: template.subject,
                content: template.content,
            });
        } else {
            setEditId(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editId) {
            // Logic Update
            put(route("email.update", editId), {
                onSuccess: () => {
                    toast.success("Template berhasil diperbarui!");
                    setIsModalOpen(false);
                },
            });
        } else {
            // Logic Store
            post(route("email.store"), {
                onSuccess: () => {
                    toast.success("Template berhasil ditambahkan!");
                    reset();
                    setIsModalOpen(false);
                },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus template ini?")) {
            router.delete(route("email.destroy", id), {
                onSuccess: () => toast.success("Template berhasil dihapus"),
                onError: () => toast.error("Gagal menghapus template"),
            });
        }
    };

    const columns = [
        { key: "name", label: t('emails.table.name') || "Name" },
        { key: "subject", label: t('emails.table.subject') || "Subject" },
    ];

    return (
        <HeaderLayout title="Email Management">
            <div className="px-4 sm:px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-800">
                        {t('emails.title') || 'Email Templates'}
                    </h1>

                    <PrimaryButton onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>{t('emails.button_add') || 'Add New Template'}</span>
                    </PrimaryButton>
                </div>

                <TableLayout
                    data={templates}
                    columns={columns}
                    onEdit={(item) => handleOpenModal(item)}
                    onDelete={(item) => handleDelete(item.id)}
                    showAction={true}
                />
            </div>

            <ModalAdd
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Edit Template Email" : "Tambah Template Email"}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Internal</label>
                        <input
                            type="text"
                            className="w-full border-gray-200 rounded-xl focus:ring-blue-500 bg-gray-50 text-sm"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Misal: Welcome User"
                        />
                        {errors.name && <p className="text-red-500 text-[10px] mt-1 italic">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject Email</label>
                        <input
                            type="text"
                            className="w-full border-gray-200 rounded-xl focus:ring-blue-500 bg-gray-50 text-sm"
                            value={data.subject}
                            onChange={(e) => setData("subject", e.target.value)}
                            placeholder="Subject yang dilihat penerima"
                        />
                        {errors.subject && <p className="text-red-500 text-[10px] mt-1 italic">{errors.subject}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Konten Email (HTML)</label>
                        <textarea
                            rows="6"
                            className="w-full border-gray-200 rounded-xl focus:ring-blue-500 bg-gray-50 text-sm font-mono"
                            value={data.content}
                            onChange={(e) => setData("content", e.target.value)}
                            placeholder="Gunakan {name} untuk placeholder nama"
                        />
                        {errors.content && <p className="text-red-500 text-[10px] mt-1 italic">{errors.content}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Batal
                        </button>
                        <PrimaryButton disabled={processing}>
                            {processing ? "Memproses..." : editId ? "Update Template" : "Simpan Template"}
                        </PrimaryButton>
                    </div>
                </form>
            </ModalAdd>
        </HeaderLayout>
    );
}