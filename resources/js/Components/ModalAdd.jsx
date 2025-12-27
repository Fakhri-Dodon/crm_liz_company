import React, { useEffect } from 'react';

const ModalAdd = ({ isOpen, onClose, title, children, footer }) => {
    // Menutup modal dengan tombol Escape
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
            {/* Overlay / Background Gelap */}
            <div 
                className="fixed inset-0 bg-black opacity-50 transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Konten Modal */}
            <div className="relative w-full max-w-lg mx-auto my-6 z-50">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-xl outline-none focus:outline-none">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {title || 'Input Data'}
                        </h3>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-gray-500 float-right text-2xl leading-none font-semibold outline-none focus:outline-none hover:text-red-500"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>

                    {/* Body (Input Data dikirim ke sini) */}
                    <div className="relative p-6 flex-auto">
                        {children}
                    </div>

                    {/* Footer (Opsional) */}
                    {footer && (
                        <div className="flex items-center justify-end p-4 border-t border-solid border-gray-200 rounded-b gap-2">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalAdd;