import HeaderLayout from "@/Layouts/HeaderLayout";
import { useEffect, useState, useTransition } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import TableLayout from "@/Layouts/TableLayout";
import ModalAdd from "@/Components/ModalAdd";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function UsersIndex({ users, roles, templates }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState("welcome");
    const [selectedTemplateId, setSelectedTemplateId] = useState("");

    const { t } = useTranslation();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        position: "",
        email: "",
        phone: "",
        password: "",
        role_id: "",
    });

    const columns = [
        {
            key: "name",
            label: t('users.table.name') || "Name",
        },
        {
            key: "position",
            label: t('users.table.position') || "Position",
        },
        {
            key: "role",
            label: t('users.table.role') || "Role",
        },
        {
            key: "email",
            label: t('users.table.email') || "Email",
        },
        {
            key: "phone",
            label: t('users.table.phone') || "Phone",
        },
        {
            key: "last_seen",
            label: t('users.table.last_seen') || "Last Seen",
        },
    ];

    const tableData = users.map((user) => ({
        id: user.id,
        name: user.name,
        position: user.position,
        role: user.role?.name,
        role_id: user.role_id,
        email: user.email,
        phone: user.phone,
        last_seen: user.last_seen_formatted,
    }));

    const handleAdd = () => {
        setEditId(null);
        reset();
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editId) {
            router.patch(`/user/update/${editId}`, data, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditId(null);
                    reset();
                },
            });
        } else {
            post("/user/store", {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (user) => {
        setEditId(user.id);
        setData({
            name: user.name,
            position: user.position,
            email: user.email,
            phone: user.phone,
            role_id: user.role_id,
            password: "",
        });

        setIsModalOpen(true);
    };

    const handleDelete = (target) => {
        const id = typeof target === "object" ? target.id : target;

        console.log("Menghapus ID:", id);

        if (!id) {
            toast.error("Error: ID tidak ditemukan!");
            return;
        }

        if (confirm("Are you sure you want to delete this user?")) {
            const toastId = toast.loading("Menghapus user...");

            router.delete(`/user/destroy/${id}`, {
                onSuccess: () => {
                    toast.success("User deleted successfully", { id: toastId });
                },
                onError: (err) => {
                    console.error("Terjadi kesalahan:", err);
                    toast.error("Terjadi kesalahan saat menghapus user.", { id: toastId });
                },
            });
        }
    };

    const handleSendEmail = (user) => {
        if (!user.email) {
            toast.error("User ini tidak memiliki alamat email.");
            return;
        }
        // if (templates && templates.length > 0) {
        //     setSelectedTemplateId(templates[0].id);
        // }
        setSelectedUser(user);
        setEmailModalOpen(true);
    };

    const confirmSendEmail = () => {
        if (!selectedUser || !selectedTemplateId) return;

        setEmailModalOpen(false);

        console.log("Mengirim Template ID:", selectedTemplateId);

        router.post(
            `/user/send-email/${selectedUser.id}`,
            { template: selectedTemplateId },
            {
                onStart: () => {
                    setIsSendingEmail(true);
                    toast.loading("Sedang mengirim email...", {
                        id: "send-email-toast",
                    });
                },
                onFinish: () => {
                    setIsSendingEmail(false);
                    toast.dismiss("send-email-toast");
                },
                onSuccess: () => {
                    toast.success(
                        `Email berhasil dikirim ke ${selectedUser.name}!`
                    );
                    setSelectedUser(null);
                },
                onError: (errors) => {
                    toast.error("Terjadi kesalahan saat mengirim email.");
                    console.error(errors);
                },
                preserveScroll: true,
            }
        );
    };

    return (
        <>
            <ModalAdd
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? t('users.modals.edit_title') || "Edit User" : t('users.modals.add_title') || "Add User"}
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2"
                        >
                            {t('users.modals.btn_cancel') || "Cancel"}
                        </button>
                        <PrimaryButton
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                            <span>{editId ? t('users.modals.btn_update') || "Update" : t('users.modals.btn_add') || "Add"}</span>
                        </PrimaryButton>
                    </>
                }
            >
                {/* Isi Form Input Di Sini (Children) */}
                    <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('users.modals.label_name') || "Name*"}
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('users.modals.label_position') || "Position*"}
                            </label>
                            <input
                                value={data.position}
                                onChange={(e) =>
                                    setData("position", e.target.value)
                                }
                                type="text"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('users.modals.label_email') || "Email*"}
                            </label>
                            <input
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                type="text"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('users.modals.label_phone') || "Phone*"}
                            </label>
                            <input
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                type="text"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('users.modals.label_role') || "Role*"}
                            </label>
                            <select
                                value={data.role_id}
                                onChange={(e) =>
                                    setData("role_id", e.target.value)
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">{t('users.modals.choose_role') || "-- Choose Role --"}</option>

                                {roles && roles.length > 0 ? (
                                    roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>{t('users.modals.no_roles') || "No roles available"}</option>
                                )}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('users.modals.label_password') || "Password*"}
                            </label>
                            <input
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                type="password"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            </ModalAdd>

            {isSendingEmail && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

                        <div className="text-center">
                            <p className="font-bold text-gray-800 text-lg">
                                {t('users.email_overlay.sending') || "Sending Email..."}
                            </p>
                            <p className="text-sm text-gray-500">
                                {t('users.email_overlay.wait') || "Please wait while we process your request."}
                            </p>
                        </div>

                        <button
                            onClick={() => setIsSendingEmail(false)}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            {t('users.email_overlay.hide') || "Cancel"}
                        </button>
                    </div>
                </div>
            )}

            {emailModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
                                <svg
                                    className="h-8 w-8 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-black text-gray-800">
                                    {t('users.email_modal.title') || "Send Email Template"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {t('users.email_modal.subtitle') || "Send message to"}{" "}
                                    <span className="font-bold text-gray-700">
                                        {selectedUser?.name}
                                    </span>
                                </p>
                            </div>

                            {/* DROPDOWN PILIHAN TEMPLATE */}
                            <div className="space-y-2 text-left mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('users.email_modal.label_template') || "Choose Email Template"}</label>
                                <select 
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl p-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                                    >
                                    <option value="" disabled>{t('users.email_modal.choose_template') || "-- Choose Template --"}</option>
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} - {t.subject}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 px-4 py-2 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-blue-700 text-[11px] font-bold truncate uppercase">
                                    {selectedUser?.email}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row p-4 gap-3 bg-gray-50">
                            <button
                                onClick={() => setEmailModalOpen(false)}
                                className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200"
                            >
                                {t('users.email_modal.btn_cancel') || "Cancel"}
                            </button>
                            <button
                                onClick={confirmSendEmail}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                {t('users.email_modal.btn_send') || "Send Email"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <HeaderLayout title={t('users.title')} />

            <div className="px-4 sm:px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-800">
                        {t('users.title')}
                    </h1>

                    {/* ADD BUTTON */}
                    <PrimaryButton
                        onClick={handleAdd}
                        className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                        <span>{t('users.button_add')}</span>
                    </PrimaryButton>
                </div>

                <div className="py-8">
                    <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
                        <div className="min-w-[720px]">
                            <TableLayout
                                data={tableData}
                                columns={columns}
                                onSendEmail={(user) => handleSendEmail(user)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                showAction={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
