import { useState, useEffect } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import ModalAdd from "@/Components/ModalAdd";
import TableLayout from "@/Layouts/TableLayout";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/Table";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";
import { Button } from "@/Components/ui/Button";
import { BookOpen, Trash2 } from "lucide-react";

export default function EmailIndex({ auth_permissions }) {
    const { templates } = usePage().props;
    const { emailLogs = [] } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
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

    const handleShowLogDetail = (log) => {
        if (!log) return; // Guard clause
        setSelectedLog(log);
        setIsHistoryModalOpen(true);
    };

    const handleLogDelete = (id) => {
        if (!id) return;
        if (confirm("Apakah Anda yakin ingin menghapus log ini?")) {
            router.delete(`/setting/email/destroy-log/${id}`, {
                onSuccess: () => {
                    toast.success("Log deleted successfully!");
                },
                onError: (errors) => {
                    console.error(errors);
                },
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

                <h1 className="text-xl font-bold text-gray-800 pt-10">
                    {t("emails.title_history") || "Email Templates"}
                </h1>

                {/* Table Email History */}
                <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            {/* ================= HEADER ================= */}
                            <thead>
                                <tr className="bg-[#c8e1b5] border-b border-blue-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                                        {t("emails.table.date")}                                
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                                        {t("emails.table.to")}                                    
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                                        {t("emails.table.subject")}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                                        {t('users.table.actions') || 'Actions'}
                                    </th>
                                </tr>
                            </thead>

                            {/* ================= BODY ================= */}
                            <tbody className="divide-y divide-gray-100">
                                {Array.isArray(emailLogs) && emailLogs.length > 0 ? (
                                    emailLogs.map((log, index) => {
                                        // Guard clause untuk data null
                                        if (!log) return null;
                                        
                                        return (
                                            <tr
                                                key={log?.id || index}
                                                className="hover:bg-blue-50 transition-colors duration-150 group"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {log?.sent_date
                                                        ? log.sent_date.split(" ")[0]
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {log?.to || "-"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {log?.subject || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {/* Tombol View Detail (Style disamakan dengan tombol Edit) */}
                                                        <button
                                                            onClick={() => handleShowLogDetail(log)}
                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group-hover:border-blue-300"
                                                            title="View Detail"
                                                        >
                                                            <BookOpen className="w-4 h-4" />
                                                        </button>

                                                        {/* Tombol Delete (Style disamakan dengan tombol Delete) */}
                                                        <button
                                                            onClick={() => log?.id && handleLogDelete(log.id)}
                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 group-hover:border-red-300"
                                                            title="Delete Log"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    /* Empty State Style */
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="h-12 w-12 text-gray-300 mb-4">
                                                    <svg
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1}
                                                            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.801 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                                                        />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 font-medium">
                                                    No email history found
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    Sent emails will appear here
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer / Pagination for Logs (Optional - Tampilkan total data) */}
                    {emailLogs && emailLogs.length > 0 && (
                        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    Total logs: <span className="font-medium">{emailLogs.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ModalAdd
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? t("emails.modals.edit_title") : t("emails.modals.add_title")}
                subtitle={t("emails.modals.subtitle")}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1"
                        >
                            {t("emails.modals.btn_cancel")}
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
                                {editId ? t("emails.modals.btn_update") : t("emails.modals.btn_add")}
                            </span>
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Nama Internal */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                            {t("emails.modals.internal_name")}
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-gray-50/50 transition-all text-sm"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder={t("emails.modals.placeholder_name")}
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
                            {t("emails.modals.subject")}
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-gray-50/50 transition-all text-sm"
                            value={data.subject}
                            onChange={(e) => setData("subject", e.target.value)}
                            placeholder={t("emails.modals.placeholder_subject")}
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
                                {t("emails.modals.content_email")} (HTML)
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                                {t("emails.modals.placeholder_content")}: {"{name}"}
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

            {/* Modal for History Email */}
            <ModalAdd
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title={t("emails.modal_histories.title")}
                subtitle={t("emails.modal_histories.subtitle")}
                icon={BookOpen} // Menggunakan ikon BookOpen
                footer={null}
            >
                {/* Pastikan selectedLog ada sebelum render isinya untuk mencegah error null */}
                {selectedLog && (
                    <div className="space-y-6">
                        {/* Informasi Utama */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    {t("emails.modal_histories.recipient")}
                                </span>
                                <span className="text-gray-900 font-medium break-all">
                                    {selectedLog?.to || "-"}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    {t("emails.modal_histories.sent_at")}
                                </span>
                                <span className="text-gray-900 font-medium">
                                    {selectedLog?.sent_date || selectedLog?.created_at || "-"}
                                </span>
                            </div>
                        </div>

                        {/* Subject & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    {t("emails.modal_histories.subject")}
                                </span>
                                <span className="text-gray-900 font-medium">
                                    {selectedLog?.subject || "-"}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    {t("emails.modal_histories.status")}
                                </span>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        selectedLog?.status === "success"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {selectedLog?.status || "-"}
                                </span>
                            </div>
                        </div>

                        {/* Body / Error Log */}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                                {t("emails.modal_histories.body_log")}
                            </span>
                            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 max-h-60 overflow-y-auto text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                                {selectedLog?.body || t("emails.modal_histories.no_content")}
                            </div>
                        </div>
                    </div>
                )}
            </ModalAdd>
        </HeaderLayout>
    );
}
