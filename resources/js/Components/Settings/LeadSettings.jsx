import React, { useState, useEffect } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import SimpleModal from "@/components/ui/SimpleModal";

export default function LeadSettings() {
    const { config, statuses } = usePage().props;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState(null);

    const { data, setData, post, put, delete: destroy, processing: actionProcessing, reset, errors } = useForm({
        name: "",
        note: "",
        color: "",
        color_name: "",
    });

    const openAddModal = () => {
        setEditingStatus(null);
        reset();
        setIsModalOpen(true);
    };

    // Buka Modal untuk Edit
    const openEditModal = (status) => {
        setEditingStatus(status);
        setData({
            name: status.name,
            note: status.note || "",
            color: status.color,
            color_name: status.color_name,
        });
        setIsModalOpen(true);
    };

    // Handle Simpan (Add atau Update)
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingStatus) {
            put(`/setting/lead-status/update/${editingStatus.id}`, {
                onSuccess: () => {
                    toast.success("Status updated successfully");
                    setIsModalOpen(false);
                }
            });
        } else {
            post("/setting/lead-status/store", {
                onSuccess: () => {
                    toast.success("Status added successfully");
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this status?")) {
            destroy(`/setting/lead-status/destroy/${id}`, {
                onSuccess: () => toast.success("Status deleted successfully"),
                onError: () => toast.error("Failed to delete status")
            });
        }
    };

    const handleAddStatus = (e) => {
        e.preventDefault();
        post("/setting/lead-status/store", {
            onSuccess: () => {
                toast.success("Status added successfully");
                setIsAddModalOpen(false);
                reset();
            },
            onError: () => toast.error("Failed to add status")
        });
    };

    const toBool = (val) => val === true || val === 1 || val === "1" || val === "true";

    const [localSettings, setLocalSettings] = useState({
        lead_user_base_visibility: false,
        lead_default_filter_by_login: false,
    });

    useEffect(() => {
        if (config) {
            setLocalSettings({
                lead_user_base_visibility: toBool(config.lead_user_base_visibility),
                lead_default_filter_by_login: toBool(config.lead_default_filter_by_login),
            });
        }
    }, [config]);

    const { processing } = useForm();

    const handleToggle = (field, currentValue) => {
        const newValue = !currentValue;
        setLocalSettings(prev => ({ ...prev, [field]: newValue }));

        router.post("/setting/general/store", { [field]: newValue }, {
            preserveScroll: true,
            onSuccess: () => toast.success("Settings updated"),
            onError: () => {
                setLocalSettings(prev => ({ ...prev, [field]: currentValue }));
                toast.error("Failed to update");
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* --- SECTION 1: LEAD STATUS TABLE --- */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-red-700">3. Lead Setting</h2>
                    <Button onClick={() => setIsModalOpen(true)}
                        className="bg-teal-800 hover:bg-teal-900 text-white shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Status
                    </Button>
                </div>
                <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white text-center w-16 font-bold">No</TableHead>
                                <TableHead className="text-white font-bold">Status</TableHead>
                                <TableHead className="text-white font-bold">Note</TableHead>
                                <TableHead className="text-white font-bold">Color</TableHead>
                                <TableHead className="text-white font-bold">Created By</TableHead>
                                <TableHead className="text-white text-center w-24 font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {statuses?.length > 0 ? (
                                statuses.map((status, index) => (
                                    <TableRow key={status.id} className="border-b">
                                        <TableCell className="text-center">{index + 1}</TableCell>
                                        <TableCell className="font-bold">{status.name}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{status.note}</TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                                                {status.color_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {status.creator?.name || "System"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center gap-2">
                                                <Edit 
                                                    className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition-transform" 
                                                    onClick={() => openEditModal(status)}
                                                />
                                                <Trash2 
                                                    className="w-4 h-4 text-red-600 cursor-pointer hover:scale-110 transition-transform" 
                                                    onClick={() => handleDelete(status.id)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-gray-400 italic">No status data available.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <SimpleModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingStatus ? "Edit Lead Status" : "Create New Lead Status"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status Name</label>
                        <input 
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                            value={data.name}
                            onChange={e => setData("name", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Note</label>
                        <textarea 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                            rows="2"
                            value={data.note}
                            onChange={e => setData("note", e.target.value)}
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Select Color</label>
                        <select 
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                            value={data.color_name}
                            onChange={e => {
                                const selectedName = e.target.value;
                                const colorMap = { "Orange": "#F97316", "Blue": "#3B82F6", "Green": "#22C55E", "Gray": "#6B7280" };
                                setData(prev => ({ ...prev, color_name: selectedName, color: colorMap[selectedName] || "" }));
                            }}
                        >
                            <option value="">-- Choose Color --</option>
                            <option value="Orange">Orange</option>
                            <option value="Blue">Blue</option>
                            <option value="Green">Green</option>
                            <option value="Gray">Gray</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-teal-900 text-white" disabled={actionProcessing}>
                            {actionProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </SimpleModal>

            {/* --- SECTION 2: LEAD RESTRICTIONS (WITH DESCRIPTION & NOTE) --- */}
            <div className="space-y-4 border-t pt-6">
                <h3 className="font-bold text-gray-700">Lead Restrictions</h3>
                <div className="border border-teal-900 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white font-bold w-48 text-center border-r border-teal-800">Field</TableHead>
                                <TableHead className="text-white font-bold w-32 text-center border-r border-teal-800">Setting</TableHead>
                                <TableHead className="text-white font-bold text-center border-r border-teal-800">Description</TableHead>
                                <TableHead className="text-white font-bold w-64 text-center">Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Row 1: Visibility */}
                            <TableRow className="border-b">
                                <TableCell className="font-medium px-4 text-center border-r">User-Base Visibility</TableCell>
                                <TableCell className="text-center py-6 border-r">
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch 
                                            key={`vis-${localSettings.lead_user_base_visibility}`}
                                            checked={localSettings.lead_user_base_visibility}
                                            onCheckedChange={() => handleToggle("lead_user_base_visibility", localSettings.lead_user_base_visibility)}
                                            disabled={processing}
                                        />
                                        <span className={`text-[10px] font-black uppercase ${localSettings.lead_user_base_visibility ? "text-green-600" : "text-red-600"}`}>
                                            {localSettings.lead_user_base_visibility ? "ON" : "OFF"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 text-sm border-r">
                                    Restrict users to see only Leads they <span className="font-bold text-red-700">created</span> or are <span className="font-bold text-red-700">assigned to</span>.
                                </TableCell>
                                <TableCell className="px-4 text-sm bg-gray-50/50">
                                    <div className="space-y-1">
                                        <p><span className="font-bold text-red-700 uppercase text-[10px]">ON</span> = User sees only their Leads</p>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <p><span className="font-bold text-red-700 uppercase text-[10px]">OFF</span> = User sees all accessible Leads</p>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Row 2: Filter */}
                            <TableRow>
                                <TableCell className="font-medium px-4 text-center border-r">Default Filter by Login</TableCell>
                                <TableCell className="text-center py-6 border-r">
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch 
                                            key={`fil-${localSettings.lead_default_filter_by_login}`}
                                            checked={localSettings.lead_default_filter_by_login}
                                            onCheckedChange={() => handleToggle("lead_default_filter_by_login", localSettings.lead_default_filter_by_login)}
                                            disabled={processing}
                                        />
                                        <span className={`text-[10px] font-black uppercase ${localSettings.lead_default_filter_by_login ? "text-green-600" : "text-red-600"}`}>
                                            {localSettings.lead_default_filter_by_login ? "ON" : "OFF"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 text-sm border-r">
                                    Automatically filter Lead table to show only data related to the logged-in user.
                                </TableCell>
                                <TableCell className="px-4 text-sm bg-gray-50/50 italic text-gray-600">
                                    If <span className="font-bold text-red-700 uppercase text-[10px]">OFF</span>, table shows all visible Leads initially; user can still filter manually.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* SYNC LOADING INDICATOR */}
            {processing && (
                <div className="fixed bottom-6 right-6 bg-teal-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce z-50">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-300" />
                    <span className="font-bold text-sm tracking-widest uppercase">Syncing...</span>
                </div>
            )}
        </div>
    );
}