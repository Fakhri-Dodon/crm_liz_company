import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, ShieldAlert, Info, CheckCircle } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, company, onDelete, isBulk = false, selectedCount = 0 }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteType, setDeleteType] = useState('soft'); // 'soft' or 'permanent'
    const [confirmText, setConfirmText] = useState('');

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (deleteType === 'permanent' && confirmText !== 'DELETE') {
            alert('Please type "DELETE" in uppercase to confirm permanent deletion.');
            return;
        }

        setIsDeleting(true);
        try {
            await onDelete(deleteType);
            onClose();
            resetForm();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const resetForm = () => {
        setDeleteType('soft');
        setConfirmText('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const getTitle = () => {
        if (isBulk) {
            return `Delete ${selectedCount} Client${selectedCount > 1 ? 's' : ''}`;
        }
        return `Delete Client`;
    };

    const getMessage = () => {
        if (isBulk) {
            return `You are about to delete ${selectedCount} client${selectedCount > 1 ? 's' : ''}. This action cannot be undone.`;
        }
        return `You are about to delete the client "${company?.name}". This action cannot be undone.`;
    };

    const getConfirmationText = () => {
        if (isBulk) {
            return `Are you sure you want to delete ${selectedCount} selected client${selectedCount > 1 ? 's' : ''}?`;
        }
        return `Are you sure you want to delete "${company?.name}"?`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
                            <p className="text-sm text-gray-600 mt-1">Warning: This action is irreversible</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        disabled={isDeleting}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-red-800 font-medium">{getMessage()}</p>
                                {!isBulk && company?.client_code && (
                                    <p className="text-sm text-red-700 mt-1">
                                        Client Code: <span className="font-mono">{company.client_code}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Delete Type Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Delete Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition ${
                                deleteType === 'soft' 
                                    ? 'border-teal-500 bg-teal-50' 
                                    : 'border-gray-300 hover:bg-gray-50'
                            }`}>
                                <input
                                    type="radio"
                                    name="deleteType"
                                    value="soft"
                                    checked={deleteType === 'soft'}
                                    onChange={(e) => setDeleteType(e.target.value)}
                                    className="sr-only"
                                />
                                <Trash2 className={`w-6 h-6 mb-2 ${
                                    deleteType === 'soft' ? 'text-teal-600' : 'text-gray-400'
                                }`} />
                                <span className={`text-sm font-medium ${
                                    deleteType === 'soft' ? 'text-teal-700' : 'text-gray-700'
                                }`}>
                                    Soft Delete
                                </span>
                                <span className="text-xs text-gray-500 mt-1 text-center">
                                    Can be restored later
                                </span>
                            </label>

                            <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition ${
                                deleteType === 'permanent' 
                                    ? 'border-red-500 bg-red-50' 
                                    : 'border-gray-300 hover:bg-gray-50'
                            }`}>
                                <input
                                    type="radio"
                                    name="deleteType"
                                    value="permanent"
                                    checked={deleteType === 'permanent'}
                                    onChange={(e) => setDeleteType(e.target.value)}
                                    className="sr-only"
                                />
                                <AlertTriangle className={`w-6 h-6 mb-2 ${
                                    deleteType === 'permanent' ? 'text-red-600' : 'text-gray-400'
                                }`} />
                                <span className={`text-sm font-medium ${
                                    deleteType === 'permanent' ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                    Permanent Delete
                                </span>
                                <span className="text-xs text-gray-500 mt-1 text-center">
                                    Cannot be undone
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Confirmation for Permanent Delete */}
                    {deleteType === 'permanent' && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Info className="w-4 h-4 text-red-500" />
                                <span className="font-medium">Type "DELETE" to confirm:</span>
                            </div>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-center"
                            />
                            <p className="text-xs text-gray-500">
                                This will permanently remove all data associated with {
                                    isBulk ? `the ${selectedCount} selected clients` : 'this client'
                                }
                            </p>
                        </div>
                    )}

                    {/* Confirmation Message */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                            {getConfirmationText()}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t flex justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting || (deleteType === 'permanent' && confirmText !== 'DELETE')}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                {deleteType === 'soft' ? 'Move to Trash' : 'Delete Permanently'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;