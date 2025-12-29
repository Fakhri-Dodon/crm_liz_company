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
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

export default function HeaderLayout({ header, children }) {
    const { url, props } = usePage();
    const user = props.auth.user;
    const { t, i18n } = useTranslation();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [note, setNote] = useState("");
    const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

    const notifications = props.auth.notifications || [];
    const unreadCount = props.auth.unreadNotificationsCount || 0;

    const app_config = props?.app_config;
    const allowChange = app_config?.allow_language_change ?? false;

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
        { name: t('menus.dashboard'), path: "/dashboard" },
        { name: t('menus.clients'), path: "/companies" },
        { name: t('menus.lead'), path: "/lead" },
        { name: t('menus.proposal'), path: "/proposal" },
        { name: t('menus.quotation'), path: "/quotation" },
        { name: t('menus.invoice'), path: "/invoice" },
        { name: t('menus.payment'), path: "/payment" },
        { name: t('menus.project'), path: "/projects" },
        { name: t('menus.email'), path: "/email" },
        { name: t('menus.user'), path: "/user" },
    ];

    const handleReviseClick = (id) => {
        setSelectedDocId(id);
        setShowReviseModal(true);
    };

    const submitRevision = () => {
        router.post(
            `/quotation/status-notify/${selectedDocId}`,
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

    const handleApproveClick = (id) => {
        Swal.fire({
            title: "Approve Quotation?",
            text: "Status akan diubah menjadi Approved.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#059669", // Green
            confirmButtonText: "Yes, Approve!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    `/quotation/status-notify/${id}`,
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
                "/quotation/notifications/mark-all-read",
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        // Titik merah bakal ilang karena unreadCount jadi 0
                    },
                }
            );
        }
    };

    useEffect(() => {
        if (user) {
            window.Echo.private(`App.Models.User.${user.id}`)
                .notification((notification) => {
                    console.log("Notif masuk:", notification.message);
                    
                    router.reload({ 
                        only: ['auth'], 
                        preserveScroll: true,
                        preserveState: true,
                        preserveScroll: true 
                    });
                });
        }

        return () => window.Echo.leave(`App.Models.User.${user.id}`);
    }, [user.id]);

    return (
        <>
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
                    <Link
                        href="/setting/general"
                        className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-xl transition-all group"
                    >
                        <Settings
                            size={22}
                            className="text-gray-500 group-hover:text-teal-600 transition-colors"
                        />
                        <span className="text-[10px] font-medium text-gray-500">
                            Setting
                        </span>
                    </Link>

                    <Dropdown>
                        <Dropdown.Trigger>
                            <div
                                className="relative flex flex-col items-center p-2 hover:bg-gray-50 rounded-xl transition-all group cursor-pointer"
                            >
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
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <span className="font-bold text-sm">
                                    Notifications
                                </span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markNotificationsAsRead}
                                        className="text-teal-600 text-[10px] font-bold hover:underline"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                        >
                                            <p className="text-xs font-semibold text-gray-700">
                                                {n.data.message}
                                            </p>
                                            {user.role_name === "Manager" &&
                                                n.data.status === "draft" && (
                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleApproveClick(
                                                                    n.data.id
                                                                )
                                                            }
                                                            className="flex-1 bg-teal-600 text-white text-[10px] py-1.5 rounded-lg font-bold"
                                                        >
                                                            APPROVE
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleReviseClick(
                                                                    n.data.id
                                                                )
                                                            }
                                                            className="flex-1 bg-red-500 text-white text-[10px] py-1.5 rounded-lg font-bold"
                                                        >
                                                            REVISE
                                                        </button>
                                                    </div>
                                                )}
                                            {user.role_name !== "Manager" &&
                                                n.data.status ===
                                                    "approved" && (
                                                    <Link
                                                        href={route(
                                                            "quotation.markAsSent",
                                                            n.data.id
                                                        )}
                                                        method="post"
                                                        className="mt-2 w-full bg-orange-500 text-white text-[10px] py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                                                    >
                                                        <Send size={12} /> SEND
                                                        TO CLIENT
                                                    </Link>
                                                )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-xs">
                                        No notifications
                                    </div>
                                )}
                            </div>
                        </Dropdown.Content>
                    </Dropdown>

                    {allowChange && (
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
                                <div className="bg-teal-100 p-1 rounded-full text-teal-700 mb-1">
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
                        onClick={() => setIsHamburgerOpen(prev => !prev)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        aria-expanded={isHamburgerOpen}
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {isHamburgerOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2">
                            <div className="px-3 py-2">
                                <Link href="/setting/general" className="block px-2 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">{t('header.setting') || 'Setting'}</Link>
                                <div className="mt-2">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm font-medium text-gray-700">{t('header.notifications')}</span>
                                        {unreadCount > 0 && <span className="text-xs text-red-600 font-bold">{unreadCount}</span>}
                                    </div>
                                    <div className="max-h-48 overflow-y-auto mt-2">
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div key={n.id} className="px-2 py-2 border-b last:border-b-0">
                                                    <p className="text-xs font-semibold text-gray-700">{n.data.message}</p>
                                                    {user.role_name === 'Manager' && n.data.status === 'draft' && (
                                                        <div className="mt-2 flex gap-2">
                                                            <button onClick={() => handleApproveClick(n.data.id)} className="flex-1 bg-teal-600 text-white text-xs py-1 rounded-md">APPROVE</button>
                                                            <button onClick={() => { handleReviseClick(n.data.id); setIsHamburgerOpen(false); }} className="flex-1 bg-red-500 text-white text-xs py-1 rounded-md">REVISE</button>
                                                        </div>
                                                    )}
                                                    {user.role_name !== 'Manager' && n.data.status === 'approved' && (
                                                        <Link href={route('quotation.markAsSent', n.data.id)} method="post" className="mt-2 inline-flex items-center gap-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md">
                                                            <Send size={12} /> {t('header.send_to_client') || 'Send'}
                                                        </Link>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-gray-400 text-xs">No notifications</div>
                                        )}
                                    </div>
                                </div>

                                {allowChange && (
                                    <div className="mt-3">
                                        <div className="text-sm font-medium text-gray-700 mb-1">{t('header.language') || 'Language'}</div>
                                        <div className="flex gap-2">
                                            {languages.map(lang => (
                                                <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setIsHamburgerOpen(false); }} className="px-2 py-1 rounded-md text-sm hover:bg-gray-50">{lang.flag} {lang.code.toUpperCase()}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 border-t pt-3">
                                    <Link href="/profile" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                                    <Link method="post" href={route('logout')} as="button" className="block w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50">Logout</Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* NAVBAR */}
            {/* Ditambahkan overflow-x-auto agar menu yang banyak bisa di-swipe di HP */}
            <nav className="min-h-[4rem] bg-teal-800 flex items-center px-4 py-3 md:px-8 shadow-inner">
                <ul className="flex flex-wrap items-center justify-center md:justify-start gap-y-3 gap-x-2 md:gap-x-4 w-full">
                    {menus.map((item) => (
                        <li key={item.path}>
                            <Link
                                href={item.path}
                                className={`inline-block px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs lg:text-sm uppercase tracking-wider transition-all ${
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