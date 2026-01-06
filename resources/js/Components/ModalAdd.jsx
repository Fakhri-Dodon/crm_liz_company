import React, { useEffect } from 'react';
import { X, FileText } from 'lucide-react'; // Pastikan lucide-react terinstall

const ModalAdd = ({ isOpen, onClose, title, subtitle, children, footer, icon: Icon = FileText }) => {
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 transition-all duration-300">
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#005954]/10 rounded-lg">
                                <Icon className="w-6 h-6 text-[#005954]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {title || 'Input Data'}
                                </h3>
                                {subtitle && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer ? (
                        <div className="p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3">
                            {footer}
                        </div>
                    ) : (
                        // Default Footer jika tidak ada prop footer yang dikirim
                        <div className="p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalAdd;