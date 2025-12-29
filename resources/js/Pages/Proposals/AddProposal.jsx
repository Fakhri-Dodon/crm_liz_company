import { React, useState } from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import { Link, useForm, router } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import ModalAdd from "@/Components/ModalAdd";

const templates = [
    { id: 1, name: "Modern", img: "/images/templates/modern.jpg" },
    { id: 2, name: "Classic", img: "/images/templates/classic.jpg" },
    { id: 3, name: "Minimalist", img: "/images/templates/minimalist.jpg" },
    { id: 4, name: "Elegant", img: "/images/templates/elegant.jpg" },
    { id: 5, name: "Creative", img: "/images/templates/creative.jpg" },
    { id: 6, name: "Professional", img: "/images/templates/professional.jpg" },
    { id: 7, name: "Innovative", img: "/images/templates/innovative.jpg" },
    { id: 8, name: "Corporate", img: "/images/templates/corporate.jpg" },
];

export default function AddProposal() {
    
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        id: "",
        name: "",
    });

    const handleAdd = (tpl) => {
        setData({
            id: tpl.id,
            name: tpl.name,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        router.get(`/proposal/create`, data);
    };

    return (
        <>
            <ModalAdd
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Use Template"
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2"
                        >
                            Cancle
                        </button>
                        <PrimaryButton
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <span>Use</span>
                        </PrimaryButton>
                    </>
                }
            >
                {/* Isi Form Input Di Sini (Children) */}
                <div className="space-y-4">
                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Proposal Name*
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            </ModalAdd>

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
                            <a 
                                href={`/proposal/${tpl.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                    <img
                                        src={tpl.img}
                                        alt={tpl.name}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </a>
                            <div className="py-3 text-center font-medium">
                                <button onClick={() => handleAdd(tpl) } className="bg-teal-800 hover:bg-teal-900 text-white px-6 py-2 rounded-md font-semibold">
                                    Use Template
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
