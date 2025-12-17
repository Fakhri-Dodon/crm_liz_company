import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen">
            {/* Left side - green */}
            <div className="w-1/2 bg-teal-800 hidden md:block"></div>

            {/* Right side - form */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-green-50">
                <div className="w-full max-w-md p-8 flex flex-col items-center">
                    <Link href="/">
                        <ApplicationLogo className="h-28 w-28 mb-8" />
                    </Link>
                    <div className="w-full">{children}</div>
                </div>
            </div>
        </div>
    );
}
