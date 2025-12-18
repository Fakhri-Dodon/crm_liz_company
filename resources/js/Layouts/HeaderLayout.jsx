import DateTime from "@/components/DateTime";
import { Settings, User, Bell, Globe } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

export default function HeaderLayout({ children }) {
    const { url, props } = usePage();
    const { auth } = props;
    
    // Safe access user dengan fallback
    const userName = auth?.user?.name || 'Admin User';
    const userEmail = auth?.user?.email || 'admin@lizcompany.com';
    const userAvatar = auth?.user?.avatar || userName.charAt(0).toUpperCase();

    const headerMenus = [
        { name: "Setting", icon: Settings, path: "/setting" },
        { name: "Language", icon: Globe, path: "/language" },
        { name: "Notifications", icon: Bell, path: "/notifications" },
        { name: "Profile", icon: User, path: "/profile" },
    ];

    const menus = [
        { name: "DASHBOARD", path: "/dashboard" },
        { name: "CLIENTS", path: "/clients" },
        { name: "LEAD", path: "/lead" },
        { name: "PROPOSAL", path: "/proposal" },
        { name: "QUOTATION", path: "/quotation" },
        { name: "INVOICE", path: "/invoice" },
        { name: "PAYMENT", path: "/payment" },
        { name: "PROJECT", path: "/project" },
        { name: "EMAIL", path: "/email" },
        { name: "USER", path: "/user" },
    ];

    return (
        <>
            {/* HEADER */}
            <header className="h-22 bg-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="border-r-4 border-black w-40">
                        <h1 className="text-xl font-bold p-5">My</h1>
                    </div>
                    <DateTime />
                </div>

                <div className="flex gap-3 items-center">
                    {headerMenus.map((menu) => (
                        <Link key={menu.name} href={menu.path}>
                            <div className="flex flex-col items-center gap-1 p-4
                                            hover:bg-gray-100 rounded-lg transition">
                                <menu.icon size={28} />
                                <span className="text-sm">{menu.name}</span>
                            </div>
                        </Link>
                    ))}
                    
                    {/* User info dengan fallback */}
                    <div className="flex items-center gap-2 ml-4">
                        <div className="text-right">
                            <div className="font-medium text-gray-900">
                                {userName}
                            </div>
                            <div className="text-sm text-gray-500">
                                {userEmail}
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                                {userAvatar}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* NAVBAR */}
            <nav className="h-20 bg-green-900 border-b flex items-center px-6">
                <ul className="flex gap-12">
                    {menus.map((item) => (
                        <li key={item.path}>
                            <Link
                                href={item.path}
                                className={`font-medium ${
                                    url === item.path
                                        ? "text-white border-b-2 border-blue-400 pb-1"
                                        : "text-white hover:text-blue-300"
                                }`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="h-7 bg-lime-100"></div>

            <main>{children}</main>
        </>
    );
}