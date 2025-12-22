import React from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import { Link } from "@inertiajs/react";

export default function ProposalsIndex() {
    // Dummy data
    const proposals = [
        {
            id: 1,
            number: "PRO-00001",
            date: "24-10-2024",
            title: "Proposal Penawaran Sertifikasi Badan Usaha Jasa Konstruksi",
            company: "PT. Sumber Teknik Indonesia",
            contact: { name: "Maria Huseain", email: "mariahusein@gmail.com" },
            createdBy: "Vika Lusiana",
            status: "Sent",
        },
        {
            id: 2,
            number: "PRO-00002",
            date: "21-11-2024",
            title: "Proposal Penawaran Sertifikasi Badan Usaha Jasa Konstruksi",
            company: "PT. Rekayasan Teknik Industri",
            contact: {
                name: "Ahmad Subagio",
                email: "subagio@st-indonesia.com",
            },
            createdBy: "Indra Wijaya",
            status: "Draft",
        },
        {
            id: 3,
            number: "PRO-00003",
            date: "21-11-2024",
            title: "Proposal Penawaran Sertifikasi Badan Usaha Jasa Konstruksi",
            company: "PT. Surya Kencana Teknologi",
            contact: {
                name: "Ahmad Subagio",
                email: "subagio@st-indonesia.com",
            },
            createdBy: "Sherly Tan",
            status: "Sent",
        },
        {
            id: 5,
            number: "PRO-00004",
            date: "21-11-2024",
            title: "Proposal Penawaran Sertifikasi Badan Usaha Jasa Konstruksi",
            company: "PT. Persada Mitra Konstruksi",
            contact: {
                name: "Ahmad Subagio",
                email: "subagio@st-indonesia.com",
            },
            createdBy: "Sherly Tan",
            status: "Sent",
        },
        {
            id: 6,
            number: "PRO-00005",
            date: "21-11-2024",
            title: "Proposal Penawaran Sertifikasi Badan Usaha Jasa Konstruksi",
            company: "PT. Wijaya Bangun Sarana",
            contact: {
                name: "Ahmad Subagio",
                email: "subagio@st-indonesia.com",
            },
            createdBy: "Indra Wijaya",
            status: "Draft",
        },
    ];
    const summary = [
        {
            label: "Sent",
            value: 12,
            color: "border-blue-500 text-blue-700",
            desc: "Total Proposal",
        },
        {
            label: "Opened",
            value: 10,
            color: "border-green-500 text-green-700",
            desc: "Total Proposal",
        },
        {
            label: "Rejected",
            value: 41,
            color: "border-red-500 text-red-700",
            desc: "Total Proposal",
        },
        {
            label: "Failed",
            value: 8,
            color: "border-orange-400 text-orange-600",
            desc: "Total Proposal",
        },
    ];
    return (
        <>
            <HeaderLayout
                title="Proposals Management"
                subtitle="Manage all company proposals"
            />
            <div className="p-8">
                <div className="flex gap-8 mb-8">
                    {summary.map((s, i) => (
                        <div
                            key={s.label}
                            className={`flex-1 border-2 rounded-lg p-6 text-center ${s.color}`}
                        >
                            <div className="text-xl font-bold mb-1">
                                {s.label}
                            </div>
                            <div className="text-2xl font-bold mb-1">
                                {s.value}
                            </div>
                            <div className="text-gray-500 text-sm">
                                {s.desc}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mb-4">
                    <Link href="/proposal/add">
                        <button className="bg-teal-800 hover:bg-teal-900 text-white px-6 py-2 rounded-md font-semibold">
                            Add Proposal
                        </button>
                    </Link>
                </div>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-green-100">
                            <th className="border px-3 py-2">ID</th>
                            <th className="border px-3 py-2">No & Date</th>
                            <th className="border px-3 py-2">Title</th>
                            <th className="border px-3 py-2">Companye Name</th>
                            <th className="border px-3 py-2">
                                Contact & Email
                            </th>
                            <th className="border px-3 py-2">Created By</th>
                            <th className="border px-3 py-2">Status</th>
                            <th className="border px-3 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proposals.map((p) => (
                            <tr key={p.id}>
                                <td className="border px-3 py-2 text-center">
                                    {p.id}
                                </td>
                                <td className="border px-3 py-2">
                                    <span className="font-bold text-blue-700 cursor-pointer hover:underline">
                                        {p.number}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                        {p.date}
                                    </div>
                                </td>
                                <td className="border px-3 py-2">{p.title}</td>
                                <td className="border px-3 py-2">
                                    {p.company}
                                </td>
                                <td className="border px-3 py-2">
                                    <span className="font-bold">
                                        {p.contact.name}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                        {p.contact.email}
                                    </div>
                                </td>
                                <td className="border px-3 py-2 text-blue-700 cursor-pointer hover:underline">
                                    {p.createdBy}
                                </td>
                                <td className="border px-3 py-2">
                                    <span
                                        className={`inline-block px-4 py-1 rounded border font-bold text-xs ${
                                            p.status === "Sent"
                                                ? "border-blue-400 text-blue-700"
                                                : "border-gray-400 text-gray-700"
                                        }`}
                                    >
                                        {p.status}
                                    </span>
                                </td>
                                <td className="border px-3 py-2 text-center">
                                    <button className="mr-2" title="Edit">
                                        <svg
                                            width="20"
                                            height="20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-2a2 2 0 012-2h2"></path>
                                        </svg>
                                    </button>
                                    <button title="Delete">
                                        <svg
                                            width="20"
                                            height="20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center mt-4">
                    <div></div>
                    <div className="space-x-2">
                        <button className="px-2 py-1 rounded border border-gray-300">
                            1
                        </button>
                        <button className="px-2 py-1 rounded border border-gray-300">
                            2
                        </button>
                        <button className="px-2 py-1 rounded border border-gray-300">
                            3
                        </button>
                        <button className="px-2 py-1 rounded border border-gray-300">
                            4
                        </button>
                    </div>
                    <button className="bg-teal-800 hover:bg-teal-900 text-white px-6 py-2 rounded-md font-semibold">
                        Next
                    </button>
                </div>
            </div>
        </>
    );
}
