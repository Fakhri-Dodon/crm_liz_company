import React, { useState, useEffect } from "react";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";
import { Button } from "@/Components/ui/Button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/Table";
import { BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { router, usePage } from "@inertiajs/react";

export default function EmailSettings({ config }) {
    const [formData, setFormData] = useState(config || {});
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { emailLogs = [] } = usePage().props;

    useEffect(() => {
        if (config) setFormData(config);
    }, [config]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveTestEmail = () => {
        router.post("/setting/email/save", formData, {
            onSuccess: () => toast.success("Settings saved to database"),
            onError: () => toast.error("Failed to save settings"),
        });
    };

    const handleTestEmail = () => {
      router.post("/setting/email/test", formData, {
          onBefore: () => toast.loading("Connecting to SMTP..."),
          onSuccess: () => {
              toast.success("Success! Check your inbox");
              handleSaveTestEmail();
              setFormData(config || {}); 
          },
          onError: (err) => {
              console.error(err);
              toast.error("Connection Failed");
          },
          onFinish: () => toast.dismiss(),
      });
    };

    const handleShowLogDetail = (log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const handleLogDelete = (id) => {
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

    return (
        <div className="space-y-12 pt-10 pb-20">
            <div>
                <h2 className="text-xl font-bold text-red-700 mb-6">
                    Email Settings
                </h2>

                <h3 className="font-bold mb-4">General Setting</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                    <div className="space-y-1">
                        <Label htmlFor="systemEmail" className="text-sm">
                            System Email Address*
                        </Label>
                        <Input
                            id="systemEmail"
                            value={formData.system_email || ""}
                            onChange={(e) =>
                                handleChange("system_email", e.target.value)
                            }
                            className="border-teal-900"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="replyTo" className="text-sm">
                            Reply-To Email (optional)
                        </Label>
                        <Input
                            id="replyTo"
                            value={formData.reply_to_email || ""}
                            onChange={(e) =>
                                handleChange("reply_to_email", e.target.value)
                            }
                            className="border-teal-900"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="fromName" className="text-sm">
                            Default From Name*
                        </Label>
                        <Input
                            id="fromName"
                            value={formData.default_from_name || ""}
                            onChange={(e) =>
                                handleChange(
                                    "default_from_name",
                                    e.target.value
                                )
                            }
                            className="border-teal-900"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="delivery" className="text-sm">
                            Email Delivery
                        </Label>
                        <div className="border border-teal-900 rounded-md px-3 py-2 text-red-600 font-bold">
                            SMTP
                        </div>
                    </div>
                </div>

                <h3 className="font-bold mb-4">SMTP Setting</h3>
                <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="smtpHost" className="text-sm">
                                SMTP Host
                            </Label>
                            <Input
                                id="smtpHost"
                                value={formData.smtp_host || ""}
                                onChange={(e) =>
                                    handleChange("smtp_host", e.target.value)
                                }
                                className="border-teal-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="smtpPort" className="text-sm">
                                SMTP Port
                            </Label>
                            <Input
                                id="smtpPort"
                                value={formData.smtp_port || ""}
                                onChange={(e) =>
                                    handleChange("smtp_port", e.target.value)
                                }
                                className="border-teal-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="smtpUser" className="text-sm">
                                User Name
                            </Label>
                            <Input
                                id="smtpUser"
                                value={formData.smtp_user || ""}
                                onChange={(e) =>
                                    handleChange("smtp_user", e.target.value)
                                }
                                className="border-teal-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="smtpPassword" className="text-sm">
                                Password
                            </Label>
                            <Input
                                id="smtpPassword"
                                type="password"
                                value={formData.smtp_password || ""}
                                onChange={(e) =>
                                    handleChange(
                                        "smtp_password",
                                        e.target.value
                                    )
                                }
                                className="border-teal-900"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mb-8">
                    <Button
                        onClick={handleTestEmail}
                        className="bg-teal-900 hover:bg-teal-800 text-white px-8"
                    >
                        Test Email
                    </Button>
                </div>

                <h3 className="font-bold mb-4">Email Visibility by User</h3>
                <div className="border border-teal-900 rounded-t-lg overflow-hidden mb-10">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white font-bold w-16 text-center">
                                    No
                                </TableHead>
                                <TableHead className="text-white font-bold w-48 border-r border-teal-800">
                                    Field
                                </TableHead>
                                <TableHead className="text-white font-bold w-48 text-center border-r border-teal-800">
                                    Value
                                </TableHead>
                                <TableHead className="text-white font-bold text-center">
                                    Description
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="border-b border-gray-300">
                                <TableCell className="text-center">1</TableCell>
                                <TableCell className="font-bold border-r border-gray-300">
                                    Draft Visibility
                                </TableCell>
                                <TableCell className="text-center border-r border-gray-300">
                                    Fixed (System)
                                </TableCell>
                                <TableCell className="text-red-700">
                                    Only displays draft emails created by the
                                    logged-in user.
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-b border-gray-300">
                                <TableCell className="text-center">2</TableCell>
                                <TableCell className="font-bold border-r border-gray-300">
                                    Sent Visibility
                                </TableCell>
                                <TableCell className="text-center border-r border-gray-300">
                                    Fixed (System)
                                </TableCell>
                                <TableCell className="text-red-700">
                                    Shows only the emails sent by the logged-in
                                    user.
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-b border-gray-300">
                                <TableCell className="text-center">3</TableCell>
                                <TableCell className="font-bold border-r border-gray-300">
                                    Inbox Visibility
                                </TableCell>
                                <TableCell className="text-center border-r border-gray-300">
                                    Fixed (System)
                                </TableCell>
                                <TableCell className="text-red-700">
                                    Displays only the received or replied emails
                                    related to the logged-in user.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <h3 className="font-bold mb-4">Email Log</h3>
                <div className="border border-teal-900 rounded-t-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-teal-900">
                            <TableRow className="hover:bg-teal-900 border-none">
                                <TableHead className="text-white font-bold w-32 text-center border-r border-teal-800">
                                    Date
                                </TableHead>
                                <TableHead className="text-white font-bold w-64 text-center border-r border-teal-800">
                                    To
                                </TableHead>
                                <TableHead className="text-white font-bold text-center border-r border-teal-800">
                                    Subject
                                </TableHead>
                                <TableHead className="text-white font-bold w-32 text-center">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.isArray(emailLogs) &&
                            emailLogs.length > 0 ? (
                                emailLogs.map((log, index) => (
                                    <TableRow
                                        key={log.id || index}
                                        className="border-b border-gray-300"
                                    >
                                        <TableCell className="text-center border-r border-gray-300 p-4">
                                            {log.sent_date
                                                ? log.sent_date.split(" ")[0]
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="border-r border-gray-300 p-4 text-left">
                                            {log.to}
                                        </TableCell>
                                        <TableCell className="border-r border-gray-300 p-4 text-left">
                                            {log.subject}
                                        </TableCell>
                                        <TableCell className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    onClick={() =>
                                                        handleShowLogDetail(log)
                                                    }
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        handleLogDelete(log.id)
                                                    }
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center p-8 text-gray-500 italic"
                                    >
                                        No email logs found. (Total data:{" "}
                                        {emailLogs?.length || 0})
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Modal Detail Log */}
                {isModalOpen && selectedLog && (
                    <div
                        className="fixed inset-0 z-50 overflow-y-auto"
                        aria-labelledby="modal-title"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            {/* Background Overlay */}
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                onClick={() => setIsModalOpen(false)}
                            ></div>

                            <span
                                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                                aria-hidden="true"
                            >
                                &#8203;
                            </span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                                        <h3
                                            className="text-lg leading-6 font-medium text-gray-900"
                                            id="modal-title"
                                        >
                                            Detail Riwayat Email
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setIsModalOpen(false)
                                            }
                                            className="text-gray-400 hover:text-gray-600 text-2xl"
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div className="font-semibold text-gray-600">
                                                Tujuan (To)
                                            </div>
                                            <div className="col-span-2 text-gray-800">
                                                : {selectedLog.to}
                                            </div>

                                            <div className="font-semibold text-gray-600">
                                                Subjek
                                            </div>
                                            <div className="col-span-2 text-gray-800">
                                                : {selectedLog.subject}
                                            </div>

                                            <div className="font-semibold text-gray-600">
                                                Waktu
                                            </div>
                                            <div className="col-span-2 text-gray-800">
                                                :{" "}
                                                {selectedLog.sent_date ||
                                                    selectedLog.created_at}
                                            </div>

                                            <div className="font-semibold text-gray-600">
                                                Status
                                            </div>
                                            <div className="col-span-2">
                                                :{" "}
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        selectedLog.status ===
                                                        "success"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {selectedLog.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-semibold text-gray-600 mb-2">
                                                Isi Pesan / Error Log:
                                            </label>
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-80 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {selectedLog.body}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
