import React from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";

const templates = [
    { name: "Modern", img: "/images/templates/modern.jpg" },
    { name: "Classic", img: "/images/templates/classic.jpg" },
    { name: "Minimalist", img: "/images/templates/minimalist.jpg" },
    { name: "Elegant", img: "/images/templates/elegant.jpg" },
    { name: "Creative", img: "/images/templates/creative.jpg" },
    { name: "Professional", img: "/images/templates/professional.jpg" },
    { name: "Innovative", img: "/images/templates/innovative.jpg" },
    { name: "Corporate", img: "/images/templates/corporate.jpg" },
];

export default function AddProposal() {
    return (
        <>
            <HeaderLayout
                title="Add Proposal"
                subtitle="Choose a template for creating the proposal"
            />
            <div className="p-8">
                <h2 className="text-2xl font-bold text-center mb-8 border-2 border-green-700 py-4 w-3/4 mx-auto">
                    "Choose a template for creating the proposal"
                </h2>
                <div className="grid grid-cols-4 gap-8 w-5/6 mx-auto">
                    {templates.map((tpl) => (
                        <div
                            key={tpl.name}
                            className="border-2 border-green-700 rounded-md overflow-hidden flex flex-col items-center hover:shadow-lg transition cursor-pointer"
                        >
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                <img
                                    src={tpl.img}
                                    alt={tpl.name}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="py-3 text-center font-medium">
                                {tpl.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
