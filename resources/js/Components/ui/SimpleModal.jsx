import React from "react";
import { X } from "lucide-react";

export default function SimpleModal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b bg-teal-50">
                    <h3 className="font-bold text-teal-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}