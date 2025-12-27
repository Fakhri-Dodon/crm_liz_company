import HeaderLayout from "@/Layouts/HeaderLayout";
import { useEffect, useState } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import TableLayout from "@/Layouts/TableLayout";
import ModalAdd from "@/Components/ModalAdd";
import { toast } from "react-hot-toast";

export default function UsersIndex({ users, roles }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

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
            label: "Name",
        },
        {
            key: "position",
            label: "Position",
        },
        {
            key: "role",
            label: "Role",
        },
        {
            key: "email",
            label: "Email",
        },
        {
            key: "phone",
            label: "Phone",
        },
        {
            key: "last_seen",
            label: "Last Seen",
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
            router.put(`/user/update/${editId}`, data, {
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
            alert("Error: ID tidak ditemukan!");
            return;
        }

        if (confirm("Are you sure you want to delete this user?")) {
            router.delete(`/user/destroy/${id}`, {
                onSuccess: () => {
                    alert("User deleted successfully");
                },
                onError: (err) => {
                    console.error("Terjadi kesalahan:", err);
                },
            });
        }
    };

    const handleSendEmail = (user) => {
        if (!user.email) {
            toast.error("User ini tidak memiliki alamat email.");
            return;
        }
        // Simpan data user yang dipilih ke state
        setSelectedUser(user);
        // Buka modal custom
        setEmailModalOpen(true);
    };

    const confirmSendEmail = () => {
        if (!selectedUser) return;

        // Tutup modal konfirmasi dulu agar tidak menumpuk dengan overlay loading
        setEmailModalOpen(false);

        router.post(
            `/user/send-email/${selectedUser.id}`,
            {},
            {
                onStart: () => {
                    setIsSendingEmail(true); // Munculkan overlay loading full screen
                    toast.loading("Sedang mengirim email...", {
                        id: "send-email-toast",
                    });
                },
                onFinish: () => {
                    setIsSendingEmail(false); // Hilangkan overlay loading
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
                title={editId ? "Edit User" : "Add New User"}
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2"
                        >
                            Cancle
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
                            <span>{editId ? "Update" : "Add"}</span>
                        </PrimaryButton>
                    </>
                }
            >
                {/* Isi Form Input Di Sini (Children) */}
                <div className="space-y-4">
                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Full Name*
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
                                Position*
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

                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Email*
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
                                Phone*
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

                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Role*
                            </label>
                            <select
                                value={data.role_id}
                                onChange={(e) =>
                                    setData("role_id", e.target.value)
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">-- Choose Role --</option>

                                {roles && roles.length > 0 ? (
                                    roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No roles available</option>
                                )}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Password*
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
                                Mengirim Email
                            </p>
                            <p className="text-sm text-gray-500">
                                Mohon tunggu sebentar...
                            </p>
                        </div>

                        <button
                            onClick={() => setIsSendingEmail(false)}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            Sembunyikan Overlay
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI CUSTOM */}
            {emailModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 text-center">
                            {/* Ikon Amplop Animasi */}
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 mb-6 animate-bounce">
                                <svg
                                    className="h-10 w-10 text-blue-600"
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

                            <h3 className="text-2xl font-black text-gray-800 mb-2">
                                Kirim Email?
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                Sistem akan mengirimkan email sambutan resmi
                                kepada: <br />
                                <span className="font-bold text-gray-800">
                                    {selectedUser?.name}
                                </span>
                            </p>
                            <div className="mt-4 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 inline-block">
                                <span className="text-blue-700 text-xs font-bold tracking-wider uppercase">
                                    {selectedUser?.email}
                                </span>
                            </div>
                        </div>

                        <div className="flex p-4 gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setEmailModalOpen(false)}
                                className="flex-1 px-4 py-3 text-gray-600 font-bold hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={confirmSendEmail}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                Ya, Kirim!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <HeaderLayout title="Users" />

            <div className="px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-800">
                        Users
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
                        <span>Add User</span>
                    </PrimaryButton>
                </div>

                <div className="py-8">
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
        </>
    );
}
