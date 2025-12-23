import React from 'react';

const PDFPreview = ({ children, title, logoUrl }) => {
    return (
        <div className="flex justify-center items-start min-h-full py-10 bg-slate-200 shadow-inner">
            <div id="quotation-pdf" className="bg-white w-[210mm] min-h-[255mm] p-[15mm] shadow-2xl relative text-gray-800 text-[11px] leading-relaxed origin-top scale-[0.85] lg:scale-100 border border-gray-300">
                {/* Header Utama */}
                <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 bg-gray-100 border border-gray-300 flex items-center justify-center font-bold text-[10px]">
                        {logoUrl ? (
                            <img 
                                src={logoUrl} 
                                alt="Company Logo" 
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center font-bold text-[10px] text-gray-400">
                                LOGO
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">{title}</h1>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
};

export default PDFPreview;