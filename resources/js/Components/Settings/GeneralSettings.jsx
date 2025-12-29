import React, { useState, useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";
import { Button } from "@/Components/ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/Select";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GeneralSettings({ config, app_config }) {
    const [logoType, setLogoType] = useState(null);

    // ambil dari props 'config' yang dikirim SettingController
    const get = (key) => {
        // prefer config if non-null, otherwise fallback to app_config
        if (config && config[key] !== null && config[key] !== undefined) return config[key];
        if (app_config && app_config[key] !== null && app_config[key] !== undefined) return app_config[key];
        return null;
    };

    const { data, setData, post, processing, errors, transform } = useForm({
        company_name: get('company_name') ?? "",
        address: get('address') ?? "",
        default_language: get('default_language') ?? "Indonesia",
        allow_language_change: get('allow_language_change') == 1 || get('allow_language_change') === true,
    });

    // Ini memastikan jika user pindah menu lalu kembali lagi, data tetap muncul
    useEffect(() => {
        setData({
            company_name: get('company_name') ?? "",
            address: get('address') ?? "",
            default_language: get('default_language') ?? "Indonesia",
            allow_language_change: get('allow_language_change') == 1 || get('allow_language_change') === true,
        });
    }, [config, app_config]);

    const handleSave = () => {
        post("/setting/general/store", {
            preserveScroll: true,
            onSuccess: () => toast.success("Settings updated"),
        });
    };

    const handleUploadLogo = (file) => {
        // const uploadData = new FormData();
        // uploadData.append("logo", file);
        // uploadData.append("type", logoType);

        // router.post("/setting/general/upload-logo", uploadData, {
        //     forceFormData: true,
        //     onSuccess: () => {
        //         toast.success("Logo updated successfully");
        //         setLogoType(null);
        //     },
        // });
        router.post("/setting/general/upload-logo", {
            logo: file,
            type: logoType, // 'topbar' atau 'document'
        }, {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Logo updated successfully");
                setLogoType(null);
            },
            onError: (err) => {
                toast.error("Failed to upload logo");
                console.error(err);
            }
        });
    };

    // compute effective URLs: prefer precomputed full URLs, fallback to storage paths
    const topbarUrl = get('logo_url') ?? (get('logo_path') ? `/storage/${get('logo_path')}` : null);
    const docLogoUrl = get('doc_logo_url') ?? (get('doc_logo_path') ? `/storage/${get('doc_logo_path')}` : null);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-red-700 mb-6">
                    General Settings
                </h2>

                <div className="space-y-6">
                    {/* Input Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name*</Label>
                        <Input
                            id="company_name"
                            value={data.company_name}
                            onChange={(e) =>
                                setData("company_name", e.target.value)
                            }
                            className="max-w-4xl"
                        />
                    </div>

                    {/* Input Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Address*</Label>
                        <Input
                            id="address"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            className="max-w-4xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        {/* Select Language */}
                        <div className="bg-green-50/50 p-4 rounded-lg space-y-3">
                            <Label className="font-semibold">
                                Default Language
                            </Label>
                            <Select
                                value={data.default_language}
                                onValueChange={(val) =>
                                    setData("default_language", val)
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
                        </div>

                        {/* Select Allow Change */}
                        <div className="bg-green-50/50 p-4 rounded-lg space-y-3">
                            <Label className="font-semibold">
                                Allow User To Change Language
                            </Label>
                            <Select
                                value={
                                    data.allow_language_change ? "Yes" : "No"
                                }
                                onValueChange={(val) =>
                                    setData(
                                        "allow_language_change",
                                        val === "Yes"
                                    )
                                }
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Logo Section */}
                    <div className="bg-green-50/50 p-6 rounded-lg max-w-4xl">
                        <Label className="font-bold mb-4 block">Logo Assets</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <LogoBox
                                title="Topbar Logo"
                                url={topbarUrl}
                                onAction={() => setLogoType("topbar")}
                            />
                            <LogoBox
                                title="Document Logo"
                                url={docLogoUrl}
                                onAction={() => setLogoType("document")}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end max-w-4xl">
                    <Button
                        onClick={handleSave}
                        disabled={processing}
                        className="bg-red-700 hover:bg-red-800 text-white px-8"
                    >
                        {processing ? (
                            <Loader2 className="animate-spin mr-2" />
                        ) : (
                            "Save Settings"
                        )}
                    </Button>
                </div>
            </div>

            {logoType && (
                <LogoUploadModal
                    open={!!logoType}
                    onClose={() => setLogoType(null)}
                    onSave={handleUploadLogo}
                    initialPreview={logoType === 'topbar' ? topbarUrl : docLogoUrl}
                />
            )}
        </div>
    );
}

function LogoBox({ title, url, onAction }) {
    return (
        <div className="space-y-4">
            <p className="font-semibold text-sm">{title}</p>
            <div className="border-2 border-dashed border-gray-300 bg-white h-48 flex items-center justify-center rounded-lg overflow-hidden">
                {url ? (
                    <img
                        src={url}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain p-2"
                    />
                ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
            </div>
            <Button 
                onClick={onAction} 
                variant={url ? "outline" : "default"} 
                className={`w-full ${!url ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : ''}`}
            >
                {url ? "Change Logo" : "Upload Logo"}
            </Button>
        </div>
    );
}

function LogoUploadModal({ open, onClose, onSave, initialPreview = null }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(initialPreview);
    const [isObjectURL, setIsObjectURL] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            if (isObjectURL && preview) URL.revokeObjectURL(preview);
            const objUrl = URL.createObjectURL(selected);
            setPreview(objUrl);
            setIsObjectURL(true);
        }
    };

    useEffect(() => {
        return () => {
            if (isObjectURL && preview) URL.revokeObjectURL(preview);
        };
    }, []);

    // keep preview in sync when initialPreview changes (e.g., different logoType)
    useEffect(() => {
        if (!initialPreview) return;
        // if current preview is an object URL, revoke it first
        if (isObjectURL && preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(initialPreview);
        setIsObjectURL(false);
    }, [initialPreview]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
                <h3 className="text-lg font-bold text-gray-800">Upload New Logo</h3>
                
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Select Image File</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                    />
                </div>

                {preview && (
                    <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 space-y-2">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Preview</p>
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-40 object-contain rounded shadow-sm"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!file}
                        onClick={() => onSave(file)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
                    >
                        Confirm & Upload
                    </Button>
                </div>
            </div>
        </div>
    );
}
