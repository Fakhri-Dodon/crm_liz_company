import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/Card";
import { Image as ImageIcon } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function GeneralSettings({ config, onUpdate }) {
    const [logoType, setLogoType] = useState(null);
    const [formData, setFormData] = useState(config || {});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (config) setFormData(config);
    }, [config]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (formData.id) {
                await base44.entities.AppConfig.update(formData.id, formData);
            } else {
                await base44.entities.AppConfig.create(formData);
            }
            toast.success("Settings saved successfully");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-red-700 mb-6">
                    General Settings
                </h2>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name*</Label>
                        <Input
                            id="companyName"
                            value={formData.company_name || ""}
                            onChange={(e) =>
                                handleChange("company_name", e.target.value)
                            }
                            className="max-w-4xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address*</Label>
                        <Input
                            id="address"
                            value={formData.address || ""}
                            onChange={(e) =>
                                handleChange("address", e.target.value)
                            }
                            className="max-w-4xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        <div className="bg-green-50/50 p-4 rounded-lg space-y-3">
                            <Label className="font-semibold">
                                Default Language
                            </Label>
                            <Select
                                value={formData.default_language || "English"}
                                onValueChange={(val) =>
                                    handleChange("default_language", val)
                                }
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">
                                        English
                                    </SelectItem>
                                    <SelectItem value="Indonesia">
                                        Indonesia
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                English / Indonesia
                            </p>
                        </div>

                        <div className="bg-green-50/50 p-4 rounded-lg space-y-3">
                            <Label className="font-semibold">
                                Allow User To Change Language
                            </Label>
                            <Select
                                value={
                                    formData.allow_language_change
                                        ? "Yes"
                                        : "No"
                                }
                                onValueChange={(val) =>
                                    handleChange(
                                        "allow_language_change",
                                        val === "Yes"
                                    )
                                }
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Yes / No</p>
                        </div>
                    </div>

                    <div className="bg-green-50/50 p-6 rounded-lg max-w-4xl">
                        <Label className="font-bold mb-4 block">Logo</Label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="font-semibold text-sm">
                                    Topbar - Logo
                                </p>
                                <div className="border-2 border-gray-300 bg-white h-48 flex items-center justify-center relative group">
                                    {formData.logo_url ? (
                                        <img
                                            src={formData.logo_url}
                                            alt="Logo"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <ImageIcon className="w-16 h-16 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-white w-full">
                                        Change
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="font-semibold text-sm">
                                    Proposal - Quotation - Invoice
                                </p>
                                <div className="border-2 border-gray-300 bg-white h-48 flex items-center justify-center">
                                    {formData.doc_logo_url ? (
                                        <img
                                            src={formData.doc_logo_url}
                                            alt="Doc Logo"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <ImageIcon className="w-16 h-16 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-white w-full">
                                        Change
                                    </Button>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white w-full"
                                >
                                    {loading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // function LogoUploadModal({ open, onClose, onSave }) {
    //     const [file, setFile] = useState(null);
    //     const [preview, setPreview] = useState(null);

    //     const handleFileChange = (e) => {
    //         const selected = e.target.files[0];
    //         if (!selected) return;

    //         setFile(selected);
    //         setPreview(URL.createObjectURL(selected));
    //     };

    //     if (!open) return null;

    //     return (
    //         <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    //             <div className="bg-white w-full max-w-md rounded-lg p-6 space-y-4">
    //                 <h3 className="text-lg font-bold">Upload Logo</h3>

    //                 <Input
    //                     type="file"
    //                     accept="image/*"
    //                     onChange={handleFileChange}
    //                 />

    //                 {preview && (
    //                     <div className="border rounded-md p-4 flex justify-center">
    //                         <img
    //                             src={preview}
    //                             className="max-h-40 object-contain"
    //                         />
    //                     </div>
    //                 )}

    //                 <div className="flex justify-end gap-3 pt-4">
    //                     <Button variant="outline" onClick={onClose}>
    //                         Cancel
    //                     </Button>
    //                     <Button
    //                         disabled={!file}
    //                         onClick={() => onSave(file)}
    //                         className="bg-cyan-500 hover:bg-cyan-600 text-white"
    //                     >
    //                         Save
    //                     </Button>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    // const handleUploadLogo = async (file) => {
    //     const formDataUpload = new FormData();
    //     formDataUpload.append("logo", file);
    //     formDataUpload.append("type", logoType); // topbar | document

    //     try {
    //         setLoading(true);

    //         await api.appConfig.uploadLogo(formDataUpload);

    //         toast.success("Logo updated");
    //         setLogoType(null);
    //         if (onUpdate) onUpdate();
    //     } catch (e) {
    //         toast.error("Failed to upload logo");
    //     } finally {
    //         setLoading(false);
    //     }
    // };
}
