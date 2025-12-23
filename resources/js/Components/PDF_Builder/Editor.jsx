import React from 'react';

const BuilderLayout = ({ editor, preview, actions, title }) => {
    return (
        <div className="flex h-screen bg-[#e0e0e0] overflow-hidden font-sans">
            {/* PANEL KIRI: EDITOR */}
            <div className="w-[380px] bg-[#c8e1b5] border-r-4 border-teal-800 overflow-y-auto p-5 shadow-lg h-full">
                <h2 className="text-gray-600 font-bold text-lg mb-4 italic uppercase tracking-tighter">
                    {title}
                </h2>
                {editor}
            </div>

            {/* PANEL KANAN: HEADER & PREVIEW */}
            <div className="flex-1 flex flex-col h-full">
                <div className="p-4 bg-white border-b flex justify-between items-center px-8 shadow-sm z-10">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-sm">Draft Mode</span>
                    <div className="flex gap-3">{actions}</div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 bg-gray-300">
                    {preview}
                </div>
            </div>
        </div>
    );
};

export default BuilderLayout;