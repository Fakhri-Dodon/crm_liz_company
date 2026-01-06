import { useState } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import ModalAdd from "@/Components/ModalAdd";
import TableLayout from "@/Layouts/TableLayout";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function EmailIndex({ auth_permissions }) {
    const { templates } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const { t } = useTranslation();

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        subject: "",
        content: "",
    });

    const canRead = auth_permissions.can_read === 1;
    const canCreate = auth_permissions.can_create === 1;
    const canUpdate = auth_permissions.can_update === 1;
    const canDelete = auth_permissions.can_delete === 1;

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
        { key: "name", label: t("emails.table.name") || "Name" },
        { key: "subject", label: t("emails.table.subject") || "Subject" },
    ];

    return (
        <HeaderLayout title="Email Management">
            <div className="px-4 sm:px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t("emails.title") || "Email Templates"}
                    </h1>

                    {canCreate && (
                        <PrimaryButton
                            onClick={() => handleOpenModal()}
                            className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-[#004d47] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span>
                                {t("emails.button_add") || "Add New Template"}
                            </span>
                        </PrimaryButton>
                    )}
                </div>

                <TableLayout
                    data={templates}
                    columns={columns}
                    onEdit={canUpdate ? (item) => handleOpenModal(item) : null}
                    onDelete={
                        canDelete ? (item) => handleDelete(item.id) : null
                    }
                    showAction={canUpdate || canDelete}
                />
            </div>

            <ModalAdd
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? "Edit Template Email" : "Tambah Template Email"}
                subtitle="Kelola konten email otomatis dengan tag dinamis seperti {name}"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-6 py-3 bg-[#005954] text-white rounded-xl hover:bg-[#004d47] transition-colors font-medium flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            )}
                            <span>
                                {editId ? "Update Template" : "Simpan Template"}
                            </span>
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Nama Internal */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Nama Internal
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-gray-50/50 transition-all text-sm"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Misal: Welcome User"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1.5 italic flex items-center gap-1">
                                <span className="not-italic">⚠️</span>{" "}
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Subject Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            Subject Email
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-gray-50/50 transition-all text-sm"
                            value={data.subject}
                            onChange={(e) => setData("subject", e.target.value)}
                            placeholder="Subject yang dilihat penerima"
                        />
                        {errors.subject && (
                            <p className="text-red-500 text-xs mt-1.5 italic flex items-center gap-1">
                                <span className="not-italic">⚠️</span>{" "}
                                {errors.subject}
                            </p>
                        )}
                    </div>

                    {/* Konten Email */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Konten Email (HTML)
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                                Placeholder: {"{name}"}
                            </span>
                        </div>
                        <textarea
                            rows="8"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-gray-50/50 transition-all text-sm font-mono leading-relaxed"
                            value={data.content}
                            onChange={(e) => setData("content", e.target.value)}
                            placeholder="<html>...</html>"
                        />
                        {errors.content && (
                            <p className="text-red-500 text-xs mt-1.5 italic flex items-center gap-1">
                                <span className="not-italic">⚠️</span>{" "}
                                {errors.content}
                            </p>
                        )}
                    </div>
                </div>
            </ModalAdd>
        </HeaderLayout>
    );
}
