import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import DateTime from "@/Components/DateTime";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Settings, User, Bell, Globe } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function HeaderLayout({ header, children }) {
    const { url, props } = usePage();
    const user = props.auth.user;

    const headerMenus = [
        { name: "Setting", icon: Settings, path: "/setting/general" },
        { name: "Language", icon: Globe, path: "/language" },
        { name: "Notifications", icon: Bell, path: "/notifications" },
    ];

    const menus = [
        { name: "DASHBOARD", path: "/dashboard" },
        { name: "CLIENTS", path: "/companies" },
        { name: "LEAD", path: "/lead" },
        { name: "PROPOSAL", path: "/proposal" },
        { name: "QUOTATION", path: "/quotation" },
        { name: "INVOICE", path: "/invoice" },
        { name: "PAYMENT", path: "/payment" },
        { name: "PROJECT", path: "/projects" },
        { name: "EMAIL", path: "/email" },
        { name: "USER", path: "/user" },
    ];

    return (
        <>
            {/* HEADER */}
            <header className="h-20 bg-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="border-r-2 border-gray w-40">
                        <h1 className="text-xl font-bold p-5">My</h1>
                    </div>
                    <DateTime />
                </div>

                <div className="flex gap-3">
                    {headerMenus.map((menu) => (
                        <Link key={menu.name} href={menu.path}>
                            <div className="flex flex-col items-center gap-1 p-4 hover:bg-gray-100 rounded-lg transition">
                                <menu.icon size={28} />
                                <span className="text-sm">{menu.name}</span>
                            </div>
                        </Link>
                    ))}
                    {/* Profile Dropdown */}
                    <Dropdown>
                        <Dropdown.Trigger>
                            <div className="flex flex-col items-center gap-1 p-4 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                                <User size={28} />
                                <span className="text-sm">
                                    {user?.name || "Profile"}
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
                                onFinish={() => window.location.href = '/'}
                                className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                                Logout
                            </Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </header>

            {/* NAVBAR */}
            <nav className="h-20 bg-teal-800 flex items-center px-6">
                <ul className="flex gap-12">
                    {menus.map((item) => (
                        <li key={item.path}>
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

            <div className="h-4 bg-[#c8e1b5] shadow-sm"></div>

            <main>{children}</main>
        </>
    );
}
