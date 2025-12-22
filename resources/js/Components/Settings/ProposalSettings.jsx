import React from "react";

export default function ProposalSettings() {
    // Untuk test: tampilkan tabel statis
    return (
        <div className="p-12">
            <h2 className="text-2xl font-bold mb-6">
                Proposal Numbering Setting
            </h2>
            <div className="flex justify-end mb-4">
                <button className="bg-teal-800 hover:bg-teal-900 text-white px-8 py-3 rounded-md font-semibold text-lg">
                    Edit
                </button>
            </div>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-teal-800 text-white">
                        <th className="py-3 px-4 text-left">No</th>
                        <th className="py-3 px-4 text-left">Field</th>
                        <th className="py-3 px-4 text-left">Value</th>
                        <th className="py-3 px-4 text-left">Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b">
                        <td className="py-3 px-4">1</td>
                        <td className="py-3 px-4 font-bold">Prefix</td>
                        <td className="py-3 px-4 font-bold">PRO-</td>
                        <td className="py-3 px-4">
                            Fixed text added at the beginning of the proposal
                            number.
                        </td>
                    </tr>
                    <tr className="border-b">
                        <td className="py-3 px-4">2</td>
                        <td className="py-3 px-4 font-bold">Padding</td>
                        <td className="py-3 px-4 font-bold">5</td>
                        <td className="py-3 px-4">
                            Sets the length of the numeric part. Extra zeros are
                            added to maintain consistent length
                        </td>
                    </tr>
                    <tr>
                        <td className="py-3 px-4">3</td>
                        <td className="py-3 px-4 font-bold">Next Number</td>
                        <td className="py-3 px-4 font-bold">1</td>
                        <td className="py-3 px-4">
                            Fixed text added at the beginning of the proposal
                            number.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
