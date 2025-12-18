import AuthenticatedLayout from "@/Layouts/HeaderLayout";
import { Head } from "@inertiajs/react";

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Dashboard Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Lead Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-green-700">
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-green-700"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">12</div>
                                <div className="text-gray-600 text-sm">
                                    Lead
                                </div>
                            </div>
                        </div>
                        {/* Company Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-blue-700">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-blue-700"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 21v-4a2 2 0 012-2h3a2 2 0 012 2v4m0 0h4m-4 0v-4a2 2 0 012-2h3a2 2 0 012 2v4m0 0h1a2 2 0 002-2v-7a2 2 0 00-2-2h-1.5M16 3.13a4 4 0 010 7.75"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">8</div>
                                <div className="text-gray-600 text-sm">
                                    Company
                                </div>
                            </div>
                        </div>
                        {/* Proposal Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-purple-700">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-purple-700"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0v2a2 2 0 002 2h2a2 2 0 002-2v-2"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">5</div>
                                <div className="text-gray-600 text-sm">
                                    Proposal
                                </div>
                            </div>
                        </div>
                        {/* Invoice Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-yellow-600">
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-yellow-600"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 14l2-2m0 0l2-2m-2 2v6m6-6a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">3</div>
                                <div className="text-gray-600 text-sm">
                                    Invoice
                                </div>
                            </div>
                        </div>
                        {/* Payment Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-teal-700">
                            <div className="bg-teal-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-teal-700"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">2</div>
                                <div className="text-gray-600 text-sm">
                                    Payment
                                </div>
                            </div>
                        </div>
                        {/* Report Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-gray-700">
                            <div className="bg-gray-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0v2a2 2 0 002 2h2a2 2 0 002-2v-2"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">1</div>
                                <div className="text-gray-600 text-sm">
                                    Report
                                </div>
                            </div>
                        </div>
                        {/* Marketing Dashboard Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-pink-600">
                            <div className="bg-pink-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-pink-600"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13 16h-1v-4h-1m4 0h-1v4h-1m-4 0h-1v-4h-1"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">0</div>
                                <div className="text-gray-600 text-sm">
                                    Marketing Dashboard
                                </div>
                            </div>
                        </div>
                        {/* Finance Dashboard Card */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4 border-l-4 border-indigo-700">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <svg
                                    className="w-7 h-7 text-indigo-700"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold">0</div>
                                <div className="text-gray-600 text-sm">
                                    Finance Dashboard
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
