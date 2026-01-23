import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import DateTime from "@/Components/DateTime";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import {
    Settings,
    User,
    Bell,
    Globe,
    ChevronDown,
    Check,
    Send,
} from "lucide-react";
import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { FiEdit2 } from "react-icons/fi";
import toast from "react-hot-toast";

export default function HeaderLayout({ header, children, }) {
    const { url, props } = usePage();
    const user = props.auth.user;
    const templates = props.templates_email_notif || [];
    const { t, i18n } = useTranslation();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [note, setNote] = useState("");
    const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
    const [isHamburgerNotifOpen, setIsHamburgerNotifOpen] = useState(false);
    const [isHamburgerLangOpen, setIsHamburgerLangOpen] = useState(false);
    const hamburgerRef = useRef(null);
    const [localNotifications, setLocalNotifications] = useState(
        props.auth.notifications || []
    );
    const [unreadCount, setUnreadCount] = useState(
        props.auth.unreadNotificationsCount || 0
    );
    const auth_permissions_setting = props.auth_permissions_setting;
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedQuotationId, setSelectedQuotationId] = useState(null);
    const [selectedDocType, setSelectedDocType] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [processing, setProcessing] = useState(false);

    // const notifications = props.auth.notifications || [];
    // const unreadCount = props.auth.unreadNotificationsCount || 0;

    const canReadSetting = auth_permissions_setting?.can_read === 1;
    const canUpdateSetting = auth_permissions_setting?.can_update === 1;
    const canCreateSetting = auth_permissions_setting?.can_create === 1;
    const canDeleteSetting = auth_permissions_setting?.can_delete === 1;

    useEffect(() => {
        setLocalNotifications(props.auth.notifications || []);
        setUnreadCount(props.auth.unreadNotificationsCount || 0);
    }, [props.auth.notifications, props.auth.unreadNotificationsCount]);

    const app_config = props?.app_config;
    const isPowerUser = ['Admin', 'Manager'].includes(user?.role_name);
    const canChangeLanguage = app_config?.allow_language_change || isPowerUser;
    // const allowChange = app_config?.allow_language_change ?? false;

    const appLogo = app_config?.logo_path
        ? `/storage/${app_config.logo_path}`
        : null;

    const languages = [
        { code: "id", name: "Indonesia", flag: "🇮🇩" },
        { code: "en", name: "English", flag: "🇺🇸" },
    ];

    // const headerMenus = [
    //     { name: t('header.setting'), icon: Settings, path: "/setting/general" },
    //     { name: t('header.notifications'), icon: Bell, path: "/notifications" },
    // ];

    const menus = [
        { name: t("menus.dashboard"), path: "/dashboard" },
        { name: t("menus.clients"), path: "/companies" },
        { name: t("menus.lead"), path: "/lead" },
        { name: t("menus.proposal"), path: "/proposal" },
        { name: t("menus.quotation"), path: "/quotation" },
        { name: t("menus.invoice"), path: "/invoice" },
        { name: t("menus.payment"), path: "/payment" },
        { name: t("menus.project"), path: "/projects" },
        { name: t("menus.email"), path: "/email" },
        { name: t("menus.user"), path: "/user" },
    ];

    const handleReviseClick = (id) => {
        setSelectedDocId(id);
        setShowReviseModal(true);
    };

    const submitRevision = () => {
        const targetNotif = localNotifications.find(
            (n) => n.data.id === selectedDocId
        );
        const type = targetNotif?.data?.type;

        router.post(
            route(`${type}.notification-status`, { id: selectedDocId }),
            {
                status: "revised",
                revision_note: note, // Kirim note revisi ke backend
            },
            {
                onBefore: () => {
                    // Opsional: Kasih loading biar user gak klik berkali-kali
                    Swal.fire({
                        title: "Memproses...",
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });
                },
                onSuccess: () => {
                    setShowReviseModal(false);
                    setNote("");

                    // Tanda Sukses (Toast Style)
                    Swal.fire({
                        icon: "success",
                        title: "Berhasil!",
                        text: "Permintaan revisi telah dikirim ke Staff.",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                },
                onError: (errors) => {
                    Swal.close(); // Tutup loading kalau error

                    console.error("Error Detail:", errors);
                    const errorMessage = Object.values(errors).join("\n");

                    Swal.fire({
                        icon: "error",
                        title: "Gagal Simpan",
                        text: errorMessage,
                    });
                },
            }
        );
    };

    const handleApproveClick = (id, type) => {
        Swal.fire({
            title: `Approve ${type.toUpperCase()}?`,
            text: "Status akan diubah menjadi Approved.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#059669", // Green
            confirmButtonText: "Yes, Approve!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route(`${type}.notification-status`, { id: id }),
                    {
                        status: "approved",
                    },
                    {
                        onSuccess: () => {
                            Swal.fire({
                                icon: "success",
                                title: "Approved!",
                                toast: true,
                                position: "top-end",
                                showConfirmButton: false,
                                timer: 3000,
                            });
                        },
                    }
                );
            }
        });
    };

    const markNotificationsAsRead = () => {
        if (unreadCount > 0) {
            router.post(
                "/notifications/mark-all-read",
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            );
        }
    };

    const getPreviewHref = (data, type) => {
        if (!data) return "#";
        if (data.url) return data.url;

        const pdfPath =
            data.pdf_path ||
            data.pdfPath ||
            data.pdf_url ||
            data.pdfUrl ||
            data.path;
        if (pdfPath) return `/storage/${String(pdfPath).replace(/^\//, "")}`;

        if (data.id) return `/${type}/preview/${data.id}`;

        return "#";
    };

    const handlePreviewClick = (data) => {
        const href = getPreviewHref(data);
        if (!href || href === "#") {
            Swal.fire({
                icon: "error",
                title: "File tidak tersedia",
                toast: true,
                position: "top-end",
                timer: 2500,
                showConfirmButton: false,
            });
            return;
        }
        window.open(href, "_blank", "noopener,noreferrer");
    };

    useEffect(() => {
        if (user) {
            window.Echo.private(`App.Models.User.${user.id}`).notification(
                (notification) => {
                    // console.log("Notif baru diterima:", notification);

                    // Trigger Inertia untuk ambil data terbaru dari HandleInertiaRequests
                    router.reload({
                        only: ["auth"],
                        preserveScroll: true,
                        onSuccess: (page) => {
                            // Paksa update state setelah reload berhasil
                            setLocalNotifications(
                                page.props.auth.notifications
                            );
                            setUnreadCount(
                                page.props.auth.unreadNotificationsCount
                            );
                        },
                    });
                }
            );
        }

        return () => window.Echo.leave(`App.Models.User.${user.id}`);
    }, [user.id]);

    // Close hamburger on click outside or Escape
    useEffect(() => {
        if (!isHamburgerOpen) return;

        function onKey(e) {
            if (e.key === "Escape") setIsHamburgerOpen(false);
        }

        function onClick(e) {
            if (
                hamburgerRef.current &&
                !hamburgerRef.current.contains(e.target)
            ) {
                setIsHamburgerOpen(false);
            }
        }

        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);

        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [isHamburgerOpen]);

    const confirmSendEmail = () => {
        if (!selectedTemplateId) {
            toast.error("Please select a template first!");
            return;
        }

        setProcessing(true);

        router.post(route("markAsSent", selectedQuotationId), {
            template_id: selectedTemplateId,
            type: selectedDocType,
        }, {
            onBefore: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setEmailModalOpen(false);
                setSelectedTemplateId("");
                setSelectedDocType("");
                toast.success("Email sent successfully!");
            },
            onError: (errors) => {
                console.error(errors);
                toast.error("Failed to send email.");
            }
        });
    };

    return (
        <>
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

            {showReviseModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className="bg-red-50 p-4 border-b border-red-100">
                            <h3 className="text-red-800 font-bold flex items-center gap-2">
                                <Settings size={18} /> Revision Request
                            </h3>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Feedback for Staff
                            </label>
                            <textarea
                                className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-red-500 focus:border-red-500 min-h-[120px] transition-all"
                                placeholder="Contoh: Tolong revisi diskon di item nomor 2..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowReviseModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRevision}
                                    disabled={!note.trim()}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                                >
                                    Send Revision
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* HEADER */}
            <header className="h-20 bg-white p-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="border-r-2 border-gray-100 w-32 md:w-40">
                        <Link
                            href="/dashboard"
                            className="h-14 flex items-center pr-2 md:pr-4"
                        >
                            {appLogo ? (
                                <img
                                    src={appLogo}
                                    alt="Logo"
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <h1 className="text-xl font-black text-teal-800 ml-2">
                                    MY APP
                                </h1>
                            )}
                        </Link>
                    </div>
                    <div className="hidden sm:block">
                        <DateTime />
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 md:gap-2">
                    {(canReadSetting || canCreateSetting || canUpdateSetting || canDeleteSetting) && (
                        <Link
                            href="/setting/general"
                            className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-xl transition-all group"
                        >
                            <Settings
                                size={22}
                                className="text-gray-500 group-hover:text-teal-600 transition-colors"
                            />
                            <span className="text-[10px] font-medium text-gray-500">
                                {t("header.setting")}
                            </span>
                        </Link>
                    )}

                    <Dropdown>
                        <Dropdown.Trigger>
                            <div className="relative flex flex-col items-center p-2 hover:bg-gray-50 rounded-xl transition-all group cursor-pointer">
                                <Bell
                                    size={22}
                                    className="text-gray-500 group-hover:text-teal-600 transition-colors"
                                />
                                <span className="text-[10px] font-medium text-gray-500">
                                    {t("header.notifications")}
                                </span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-2.5 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-white"></span>
                                    </span>
                                )}
                            </div>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" width="80">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <span className="font-bold text-sm">
                                    {t("header.notification_dropdown.title")}
                                </span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markNotificationsAsRead}
                                        className="text-teal-600 text-xs font-semibold hover:underline"
                                    >
                                        {t("header.notification_dropdown.mark_all_as_read")}
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                {localNotifications.length > 0 ? (
                                    localNotifications.map((n) => {
                                        const docType = n.data.type;
                                        const docId = n.data.id;
                                        const status = n.data.status;
                                        const clientName = n.data.contact_person;
                                        const clientEmail = n.data.email;

                                        return (
                                            <div
                                                key={n.id}
                                                className={`px-4 py-3 hover:bg-gray-50 transition-colors border-b ${
                                                    !n.read_at
                                                        ? "bg-blue-50/50"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase mb-1 inline-block">
                                                            {docType}
                                                        </span>
                                                        <p className="text-sm text-gray-800 font-medium">
                                                            {n.data.message}
                                                        </p>
                                                        {n.data?.meta && (
                                                            <div className="text-xs text-gray-500 mt-1 italic">
                                                                "{n.data.meta}"
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-2 text-right">
                                                        <span
                                                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                                status ===
                                                                "approved"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : status ===
                                                                      "revised"
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    {/* AKSI UNTUK MANAGER (APPROVE/REVISE) */}
                                                    {user.role_name ===
                                                        "Manager" &&
                                                        (status === "draft" || status === "Unpaid") && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleApproveClick(
                                                                            docId,
                                                                            docType
                                                                        )
                                                                    }
                                                                    className="px-3 py-1.5 text-[10px] font-bold rounded-md bg-teal-600 text-white hover:bg-teal-700 transition"
                                                                >
                                                                    {t("header.notification_dropdown.btn_approve")}
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleReviseClick(
                                                                            docId
                                                                        )
                                                                    }
                                                                    className="px-3 py-1.5 text-[10px] font-bold rounded-md bg-red-500 text-white hover:bg-red-600 transition"
                                                                >
                                                                    {t("header.notification_dropdown.btn_revise")}                                                                    
                                                                </button>
                                                            </>
                                                        )}

                                                    {/* AKSI UNTUK STAFF (EDIT KALAU REVISED / SEND KALAU APPROVED) */}
                                                    {user.role_name !==
                                                        "Manager" && (
                                                        <>
                                                            {status === "approved" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // console.log("Data Notif:", n.data);
                                                                        const userData = {
                                                                            name: n.data.contact_person || "No Name", 
                                                                            email: n.data.email || "No Email"
                                                                        };

                                                                        setSelectedUser(userData); 
                                                                        setSelectedQuotationId(n.data.id); 
                                                                        setSelectedDocType(docType);
                                                                        setEmailModalOpen(true);
                                                                    }}
                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-md hover:bg-orange-600 transition"
                                                                >
                                                                    <Send size={10} />
                                                                    {t("header.notification_dropdown.btn_send") || "SEND TO CLIENT"}
                                                                </button>
                                                            )}

                                                            {status ===
                                                                "revised" && (
                                                                <Link
                                                                    href={route(
                                                                        `${docType}.edit`,
                                                                        docId
                                                                    )}
                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition"
                                                                >
                                                                    <FiEdit2
                                                                        size={
                                                                            10
                                                                        }
                                                                    />{" "}
                                                                    EDIT{" "}
                                                                    {docType.toUpperCase()}
                                                                </Link>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* TOMBOL PREVIEW (ONLY QUOTATION AND INVOICE) */}
                                                    {docType !== "proposal" && (
                                                        <button
                                                            onClick={() =>
                                                                handlePreviewClick(
                                                                    n.data
                                                                )
                                                            }
                                                            className="px-3 py-1.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                                        >
                                                            {t("header.notification_dropdown.btn_preview")}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-6 text-center text-gray-400 text-sm italic">
                                        {t("header.notification_dropdown.no_notification") ||
                                            "No notifications"}
                                    </div>
                                )}
                            </div>
                        </Dropdown.Content>
                    </Dropdown>

                    {canChangeLanguage && (
                        <div className="relative">
                            <button
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-xl transition-all group"
                            >
                                <Globe
                                    size={22}
                                    className="text-gray-500 group-hover:text-teal-600 transition-colors"
                                />
                                <div className="flex items-center gap-0.5">
                                    <span className="text-[10px] font-bold uppercase text-gray-500">
                                        {i18n.language}
                                    </span>
                                    <ChevronDown
                                        size={10}
                                        className={`text-gray-400 transition-transform ${
                                            isLangOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </div>
                            </button>
                            {isLangOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsLangOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    i18n.changeLanguage(
                                                        lang.code
                                                    );
                                                    setIsLangOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-teal-50 transition-colors"
                                            >
                                                <span className="text-sm font-medium">
                                                    {lang.flag} {lang.name}
                                                </span>
                                                {i18n.language ===
                                                    lang.code && (
                                                    <Check
                                                        size={14}
                                                        className="text-teal-600"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <Dropdown>
                        <Dropdown.Trigger>
                            <div className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-xl transition-all group cursor-pointer border-l border-gray-100 ml-1 pl-3">
                                <div className="bg-blue-100 p-1 rounded-full text-teal-700 mb-1">
                                    <User size={18} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-700 truncate max-w-[60px]">
                                    {user?.name}
                                </span>
                            </div>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" width="48">
                            <Link
                                href="/profile"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Profile
                            </Link>
                            <Link
                                method="post"
                                href={route("logout")}
                                as="button"
                                onSuccess={() => (window.location.href = "/")}
                                className="block w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50"
                            >
                                Logout
                            </Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>

                {/* Hamburger for small screens */}
                <div className="sm:hidden relative">
                    <button
                        onClick={() => setIsHamburgerOpen((prev) => !prev)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        aria-expanded={isHamburgerOpen}
                        aria-label="Open menu"
                    >
                        <svg
                            className="w-6 h-6 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>

                    {isHamburgerOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsHamburgerOpen(false)}
                                aria-hidden="true"
                            ></div>
                            <div
                                ref={hamburgerRef}
                                className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 transform transition ease-out duration-150 origin-top-right"
                            >
                                <div className="px-3 py-2">
                                    <Link
                                        href="/setting/general"
                                        onClick={() =>
                                            setIsHamburgerOpen(false)
                                        }
                                        className="block px-2 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                                    >
                                        {t("header.setting") || "Setting"}
                                    </Link>

                                    <div className="mt-2">
                                        <button
                                            onClick={() =>
                                                setIsHamburgerNotifOpen(
                                                    (v) => !v
                                                )
                                            }
                                            className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-50"
                                        >
                                            <span className="text-sm font-medium text-gray-700">
                                                {t("header.notifications")}
                                            </span>
                                            {unreadCount > 0 && (
                                                <span className="text-xs text-red-600 font-bold">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </button>

                                        {isHamburgerNotifOpen && (
                                            <div className="max-h-48 overflow-y-auto mt-2 border rounded-md">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className="px-2 py-2 border-b last:border-b-0"
                                                        >
                                                            <p className="text-xs font-semibold text-gray-700">
                                                                {n.data.message}
                                                            </p>
                                                            {user.role_name ===
                                                                "Manager" &&
                                                                n.data
                                                                    .status ===
                                                                    "draft" && (
                                                                    <div className="mt-2 flex gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                handleApproveClick(
                                                                                    n
                                                                                        .data
                                                                                        .id
                                                                                );
                                                                                setIsHamburgerOpen(
                                                                                    false
                                                                                );
                                                                            }}
                                                                            className="flex-1 bg-teal-600 text-white text-xs py-1 rounded-md"
                                                                        >
                                                                            APPROVE
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                handleReviseClick(
                                                                                    n
                                                                                        .data
                                                                                        .id
                                                                                );
                                                                                setIsHamburgerOpen(
                                                                                    false
                                                                                );
                                                                            }}
                                                                            className="flex-1 bg-red-500 text-white text-xs py-1 rounded-md"
                                                                        >
                                                                            REVISE
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            {user.role_name !==
                                                                "Manager" &&
                                                                n.data
                                                                    .status ===
                                                                    "approved" && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedUser(n.data);
                                                                            setSelectedQuotationId(n.data.id);
                                                                            setEmailModalOpen(true); 
                                                                            setIsHamburgerOpen(false); 
                                                                        }}
                                                                        className="mt-2 inline-flex items-center gap-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md hover:bg-orange-600 transition-colors"
                                                                    >
                                                                        <Send size={12} />
                                                                        {t("header.send_to_client") || "Send"}
                                                                    </button>
                                                                )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-center text-gray-400 text-xs">
                                                        No notifications
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {canChangeLanguage && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() =>
                                                    setIsHamburgerLangOpen(
                                                        (v) => !v
                                                    )
                                                }
                                                className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-50"
                                            >
                                                <span className="text-sm font-medium text-gray-700">
                                                    Language
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {isHamburgerLangOpen
                                                        ? "-"
                                                        : "+"}
                                                </span>
                                            </button>
                                            {isHamburgerLangOpen && (
                                                <div className="mt-2 flex gap-2 flex-wrap">
                                                    {languages.map((lang) => (
                                                        <button
                                                            key={lang.code}
                                                            onClick={() => {
                                                                i18n.changeLanguage(
                                                                    lang.code
                                                                );
                                                                setIsHamburgerOpen(
                                                                    false
                                                                );
                                                            }}
                                                            className="px-2 py-1 rounded-md text-sm hover:bg-gray-50"
                                                        >
                                                            {lang.flag}{" "}
                                                            {lang.code.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 border-t pt-3">
                                        <Link
                                            href="/profile"
                                            onClick={() =>
                                                setIsHamburgerOpen(false)
                                            }
                                            className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            method="post"
                                            href={route("logout")}
                                            as="button"
                                            data={{
                                                _token: document.head.querySelector('meta[name="csrf-token"]')?.content,
                                            }}
                                            onClick={() =>
                                                setIsHamburgerOpen(false)
                                            }
                                            className="block w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Logout
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* NAVBAR */}
            {/* Ditambahkan overflow-x-auto agar menu yang banyak bisa di-swipe di HP */}
            <nav className="min-h-[4rem] bg-teal-800 flex items-center px-2 sm:px-4 py-3 md:px-8 shadow-inner overflow-x-auto">
                <ul className="flex flex-nowrap md:flex-wrap items-center justify-center md:justify-start gap-y-3 gap-x-3 md:gap-x-4 w-max md:w-full">
                    {menus.map((item) => (
                        <li
                            key={item.path}
                            className="flex-shrink-0 md:flex-shrink"
                        >
                            <Link
                                href={item.path}
                                className={`inline-block min-w-[9rem] md:min-w-0 text-center px-3 py-2 rounded-lg font-bold text-[10px] md:text-xs lg:text-sm uppercase tracking-wider transition-all hover:shadow-sm ${
                                    url.startsWith(item.path)
                                        ? "bg-white text-teal-800 shadow-md scale-105"
                                        : "text-teal-50 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="h-4 bg-[#c8e1b5] shadow-sm"></div>

            <main className="p-2">{children}</main>
        </>
    );
}
