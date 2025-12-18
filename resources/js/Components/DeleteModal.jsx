import React from 'react';
import { X, AlertTriangle } from 'lucide-react'; // TAMBAHKAN AlertTriangle atau icon yang sesuai

const DeleteModal = ({ 
    show, 
    onClose, 
    onConfirm, 
    title = "Delete Confirmation", 
    message = "Are you sure you want to delete this item? This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel"
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6">
                        <div className="flex items-start mb-6">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Buttons */}
                    <div className="flex justify-end gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;