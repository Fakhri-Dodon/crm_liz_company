import React from "react";

export default function DevelopmentPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <svg
                    className="mx-auto mb-4 w-16 h-16 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m4 0h-1v4h-1m-4 0h-1v-4h-1M12 8v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h1 className="text-2xl font-bold mb-2 text-gray-800">Halaman Dalam Tahap Pengembangan</h1>
                <p className="text-gray-600 mb-4">Maaf, halaman ini sedang dalam tahap development.<br />Silakan kembali lagi nanti.</p>
                <a href="/" className="inline-block bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded font-semibold">Kembali ke Beranda</a>
            </div>
        </div>
    );
}
