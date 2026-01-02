import React, { useState } from "react";
import { Button } from "@/Components/ui/Button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/Table";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";

// --- Komponen Editor (Pop-up) ---
const PermissionEditor = ({ permission, onSave, onCancel }) => {
    const [perms, setPerms] = useState({
        can_create: permission.can_create || 0,
        can_read: permission.can_read || 0,
        can_update: permission.can_update || 0,
        can_delete: permission.can_delete || 0,
    });

    const config = [
        { key: "can_create", char: "C", label: "Create" },
        { key: "can_read", char: "R", label: "Read" },
        { key: "can_update", char: "U", label: "Update" },
        { key: "can_delete", char: "D", label: "Delete" },
    ];

    return (
        <div className="bg-white border border-gray-300 shadow-2xl rounded-md p-4 w-56 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-2 pb-2 border-b">
                <span className="text-[10px] font-black uppercase text-teal-600 tracking-tighter">
                    {permission.id ? "Edit Permission" : "Setup New Permission"}
                </span>
            </div>
            <div className="space-y-2 mb-4">
                {config.map((item) => (
                    <label
                        key={item.key}
                        className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-50 rounded"
                    >
                        <input
                            type="checkbox"
                            checked={perms[item.key] === 1}
                            onChange={() =>
                                setPerms((prev) => ({
                                    ...prev,
                                    [item.key]: prev[item.key] === 1 ? 0 : 1,
                                }))
                            }
                            className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm font-bold text-gray-700">
                            {item.label}
                        </span>
                    </label>
                ))}
            </div>
            <div className="flex justify-end gap-2 border-t pt-2">
                <Button size="sm" variant="outline" onClick={onCancel}>
                    Batal
                </Button>
                <Button
                    size="sm"
                    onClick={() => onSave({ ...permission, ...perms })}
                    className="bg-teal-700 hover:bg-teal-800 text-white"
                >
                    {permission.id ? "Update" : "Create"}
                </Button>
            </div>
        </div>
    );
};

// --- Komponen Utama ---
export default function UserRoleSettings() {
    const { props } = usePage();
    const rawPermissions = props.rawPermissions || [];
    const menus = props.menus || [];
    const roles = props.roles || [];

    // Kita gunakan satu state object untuk mengontrol pop-up
    const [activeEditor, setActiveEditor] = useState(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");

    const handleCreateRole = (e) => {
        e.preventDefault();

        if (!newRoleName.trim()) {
            toast.error("Nama role tidak boleh kosong");
            return;
        }

        router.post(
            "/setting/user-roles/role-store",
            {
                name: newRoleName,
                description: newRoleDesc,
            },
            {
                onSuccess: () => {
                    setIsRoleModalOpen(false);
                    setNewRoleName("");
                    setNewRoleDesc(""); // Reset deskripsi
                    toast.success("Role berhasil ditambahkan");
                },
                onError: () => toast.error("Gagal menambahkan role"),
            }
        );
    };

    const handleSave = (updatedData) => {
        if (updatedData.id) {
            // UPDATE
            router.put(`/setting/user-roles/${updatedData.id}`, updatedData, {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveEditor(null);
                    toast.success("Izin berhasil diperbarui");
                },
            });
        } else {
            // CREATE
            router.post(`/setting/user-roles/store`, updatedData, {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveEditor(null);
                    toast.success("Izin baru berhasil dibuat");
                },
                onError: (errors) => {
                    console.error(errors);
                    toast.error("Gagal membuat izin baru");
                },
            });
        }
    };

    const renderCRUD = (perm) => {
        // Kondisi Jika data TIDAK ADA di database
        if (!perm || !perm.id) {
            return (
                <div className="flex justify-center italic text-gray-300 text-[10px]">
                    No Access (Click to Create)
                </div>
            );
        }

        const activePerms = [
            perm.can_create,
            perm.can_read,
            perm.can_update,
            perm.can_delete,
        ];
        const activeCount = activePerms.filter((v) => v === 1).length;

        if (activeCount === 4) {
            return (
                <div className="flex justify-center">
                    <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200 uppercase tracking-tighter shadow-sm">
                        Full Access
                    </span>
                </div>
            );
        }

        if (activeCount === 0) {
            return (
                <div className="flex justify-center">
                    <span className="text-[10px] font-bold text-red-400 bg-gray-50 px-2 py-1 rounded border border-gray-200 uppercase tracking-tighter opacity-70">
                        No Access
                    </span>
                </div>
            );
        }

        const items = [
            {
                k: "can_create",
                c: "C",
                color: "text-green-600 bg-green-50 border-green-200",
            },
            {
                k: "can_read",
                c: "R",
                color: "text-orange-600 bg-orange-50 border-orange-200",
            },
            {
                k: "can_update",
                c: "U",
                color: "text-blue-600 bg-blue-50 border-blue-200",
            },
            {
                k: "can_delete",
                c: "D",
                color: "text-red-600 bg-red-50 border-red-200",
            },
        ];

        return (
            <div className="flex gap-1 justify-center">
                {items.map((i) => (
                    <span
                        key={i.c}
                        className={`w-6 h-6 flex items-center justify-center border text-[10px] font-bold rounded shadow-sm transition-all ${
                            perm[i.k] === 1
                                ? i.color
                                : "text-gray-200 bg-gray-50/50 border-gray-100"
                        }`}
                    >
                        {i.c}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 relative">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-xl font-bold text-red-700 mb-6 uppercase tracking-wider">
                    Role Permissions Mapping
                </h1>

                <Button
                    onClick={() => {
                        setIsRoleModalOpen(true);
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
                >
                    <span className="text-lg">+</span>
                    Add Role
                </Button>
            </div>

            <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
                <div className="min-w-[720px]">
                    <div className="border border-gray-300 rounded-lg bg-white overflow-hidden shadow-md">
                        <Table>
                            <TableHeader>                        
                                <TableRow className="bg-gray-900 hover:bg-gray-900">
                                    <TableHead className="w-56 font-bold border-r border-gray-700 text-white uppercase text-xs tracking-wider">
                                        Menu / Module
                                    </TableHead>
                                    {roles.map((role) => (
                                        <TableHead
                                            key={role.id}
                                            className="text-center font-bold uppercase text-xs text-white tracking-wider border-r border-gray-800 last:border-r-0"
                                        >
                                            {role.name}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {menus.map((menu) => (
                                    <TableRow
                                        key={menu.id}
                                        className="hover:bg-gray-50/80 transition-colors h-14"
                                    >
                                        <TableCell className="font-bold border-r bg-gray-50/50 text-gray-700 text-xs uppercase">
                                            {menu.name}
                                        </TableCell>
                                        {roles.map((role) => {
                                            // Mencari data permission di array
                                            const perm = rawPermissions.find(
                                                (p) =>
                                                    p.menu_id === menu.id &&
                                                    p.role_id === role.id
                                            );

                                            return (
                                                <TableCell
                                                    key={role.id}
                                                    className="p-0 text-center relative border-r last:border-r-0"
                                                >
                                                    <div
                                                        onClick={(e) => {
                                                            const rect =
                                                                e.currentTarget.getBoundingClientRect();
                                                            setActiveEditor( perm
                                                                    ? perm
                                                                    : {
                                                                          role_id:
                                                                              role.id,
                                                                          menu_id:
                                                                              menu.id,
                                                                      },
                                                            );
                                                        }}
                                                        className={`h-14 w-full flex items-center justify-center cursor-pointer transition-all hover:bg-teal-50/30 active:scale-95`}
                                                    >
                                                        {renderCRUD(perm)}
                                                    </div>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Pop-up Editor Overlay */}
            {activeEditor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="fixed inset-0"
                        onClick={() => setActiveEditor(null)}
                    />
                    <div
                        className="relative z-10 w-full flex justify-center p-4"
                    >
                        <PermissionEditor
                            permission={activeEditor}
                            onCancel={() => setActiveEditor(null)}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            )}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-black uppercase tracking-tight text-gray-800">
                                Create New Role
                            </h2>
                            <button
                                onClick={() => setIsRoleModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateRole} className="space-y-4">
                            {/* Input Nama Role */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                    Role Name{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) =>
                                        setNewRoleName(e.target.value)
                                    }
                                    placeholder="e.g. SUPERVISOR"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Input Deskripsi (Opsional) */}
                            <div>
                                <div className="flex justify-between">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Description
                                    </label>
                                    <span className="text-[10px] text-gray-400 italic">
                                        Optional
                                    </span>
                                </div>
                                <textarea
                                    value={newRoleDesc}
                                    onChange={(e) =>
                                        setNewRoleDesc(e.target.value)
                                    }
                                    placeholder="Describe the responsibilities of this role..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsRoleModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-teal-700 hover:bg-teal-800 text-white"
                                >
                                    Save Role
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
