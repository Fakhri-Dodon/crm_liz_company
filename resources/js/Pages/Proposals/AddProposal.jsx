import React from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import { Link, usePage } from "@inertiajs/react";

export default function AddProposal({proposal_id, templates}) {
    const { flash } = usePage().props;

    return (
        <>

            <HeaderLayout
                title="Add Proposal"
                subtitle="Choose a template for creating the proposal"
            />

            {flash?.message && (
                <div className="mb-4 rounded-lg bg-green-100 text-green-700 px-4 py-3">
                    {flash.message}
                </div>
            )}
            <div className="p-8">
                <a 
                    href={route('proposal.create', { id: 0, id_proposal: proposal_id })} 
                    // target="_blank"
                    rel="noopener noreferrer"
                >
                    <h2 className="text-2xl font-bold text-center mb-8 border-2 border-green-700 py-4 w-3/4 mx-auto">
                        "Choose Blank Template"
                    </h2>
                </a>
                <div className="grid grid-cols-4 gap-8 w-5/6 mx-auto">
                    {templates.map((tpl) => {

                        const thumbnail = tpl?.preview_image
                            ? `/storage/proposal_thumbnails/${tpl.preview_image}`
                            : null;

                        return (

                            <a 
                                href={`/proposal/${tpl.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <div
                                    key={tpl.name}
                                    className="border-2 border-green-700 rounded-md overflow-hidden flex flex-col items-center hover:shadow-lg transition cursor-pointer"
                                >
                                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                        <img
                                            src={thumbnail}
                                            alt={tpl.name}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="py-3 text-center font-medium">
                                        <Link href={`${route('proposal.create', { id: tpl.id, id_proposal: proposal_id  })}`}>
                                            <button className="bg-teal-800 hover:bg-teal-900 text-white px-6 py-2 rounded-md font-semibold">
                                                Use Template
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </a>

                        );
                    })}
                </div>
            </div>
        </>
    );
}
