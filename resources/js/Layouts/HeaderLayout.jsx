import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import DateTime from "@/Components/DateTime";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Settings, User, Bell, Globe, ChevronDown, Check, Menu, X } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function HeaderLayout({ header, children }) {
    const { url, props } = usePage();
    const user = props.auth.user;
    const { t, i18n } = useTranslation();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const app_config = props?.app_config;
    const allowChange = app_config?.allow_language_change ?? false;

    const appLogo = app_config?.logo_path ? `/storage/${app_config.logo_path}` : null;

    const languages = [
        { code: "id", name: "Indonesia", flag: "🇮🇩" },
        { code: "en", name: "English", flag: "🇺🇸" },
    ];

    const headerMenus = [
        { name: t('header.setting'), icon: Settings, path: "/setting/general" },
        { name: t('header.notifications'), icon: Bell, path: "/notifications" },
    ];

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

    return (
        <>
            {/* HEADER */}
            <header className="h-20 bg-white p-3 flex items-center justify-between shadow-sm">
                {/* Logo & DateTime */}
                <div className="flex items-center gap-3">
                    <div className="border-r-2 border-gray-200 pr-3 md:pr-4 md:w-40">
                        <Link href="/dashboard" className="h-16 flex items-center">
                            {appLogo ? (
                                <img 
                                    src={appLogo} 
                                    alt="App Logo" 
                                    className="h-12 md:h-14 w-auto object-contain" 
                                />
                            ) : (
                                <h1 className="text-lg md:text-xl font-bold">My</h1>
                            )}
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <DateTime />
                    </div>

                    {/* Mobile DateTime */}
                    <div className="md:hidden pb-3 border-b">
                        <DateTime />
                    </div>
                </div>

                {/* Desktop Menu */}
                <div className="hidden lg:flex gap-3">
                    {headerMenus.map((menu) => (
                        <Link key={menu.name} href={menu.path}>
                            <div className="flex flex-col items-center gap-1 p-4 hover:bg-gray-100 rounded-lg transition">
                                <menu.icon size={28} />
                                <span className="text-sm">{menu.name}</span>
                            </div>
                        </Link>
                    ))}
                    {allowChange && (
                        <div className="relative group">
                            <button
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex flex-col items-center gap-1 p-4 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Globe size={28} />
                                <div className="flex items-center gap-1">
                                    <span className="text-sm uppercase font-medium">
                                        {i18n.language}
                                    </span>
                                    <ChevronDown
                                        size={12}
                                        className={`transition-transform ${
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

                                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in duration-150">
                                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                                            Select Language
                                        </div>
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    i18n.changeLanguage(lang.code);
                                                    setIsLangOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="text-sm font-medium">
                                                    <span className="mr-2">{lang.flag}</span>
                                                    {lang.name}
                                                </span>
                                                {i18n.language === lang.code && (
                                                    <Check size={16} className="text-teal-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    {/* Profile Dropdown */}
                    <Dropdown>
                        <Dropdown.Trigger>
                            <div className="flex flex-col items-center gap-1 p-4 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                                <User size={28} />
                                <span className="text-sm">{user?.name || "Profile"}</span>
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
                                onFinish={() => (window.location.href = "/")}
                                className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                                Logout
                            </Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-b shadow-lg">
                    <div className="p-4 space-y-2">
                        {/* Mobile DateTime */}
                       

                        {/* Header Menus */}
                        {headerMenus.map((menu) => (
                            <Link
                                key={menu.name}
                                href={menu.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition">
                                    <menu.icon size={20} />
                                    <span className="text-sm font-medium">{menu.name}</span>
                                </div>
                            </Link>
                        ))}

                        {/* Language Selector */}
                        {allowChange && (
                            <div className="border-t pt-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                                    Language
                                </div>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            i18n.changeLanguage(lang.code);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <span className="text-sm font-medium">
                                            <span className="mr-2">{lang.flag}</span>
                                            {lang.name}
                                        </span>
                                        {i18n.language === lang.code && (
                                            <Check size={16} className="text-teal-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Profile Links */}
                        <div className="border-t pt-2">
                            <Link
                                href="/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition"
                            >
                                <User size={20} />
                                <span className="text-sm font-medium">Profile ({user?.name})</span>
                            </Link>
                            <Link
                                method="post"
                                href={route("logout")}
                                as="button"
                                onFinish={() => (window.location.href = "/")}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition text-left text-red-600"
                            >
                                <span className="text-sm font-medium">Logout</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* NAVBAR - Desktop */}
            <nav className="hidden lg:flex h-20 bg-teal-800 items-center px-6">
                <ul className="flex gap-6 xl:gap-12">
                    {menus.map((item) => (
                        <li key={item.path} className="whitespace-nowrap">
                            <Link
                                href={item.path}
                                className={`font-medium ${
                                    url === item.path
                                        ? "text-white border-b-2 border-white pb-1"
                                        : "text-white hover:text-gray-300"
                                }`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* NAVBAR - Mobile/Tablet */}
            <nav className="lg:hidden bg-teal-800 px-4 py-3 overflow-x-auto">
                <ul className="flex gap-4 min-w-max">
                    {menus.map((item) => (
                        <li key={item.path} className="whitespace-nowrap">
                            <Link
                                href={item.path}
                                className={`text-sm font-medium px-3 py-2 rounded-lg block ${
                                    url === item.path
                                        ? "bg-teal-700 text-white"
                                        : "text-white hover:bg-teal-700"
                                }`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="h-4 bg-[#c8e1b5] shadow-sm"></div>

            <main className="">{children}</main>
        </>
    );
}