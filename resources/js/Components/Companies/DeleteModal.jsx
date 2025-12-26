import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, ShieldAlert, Info, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { router } from '@inertiajs/react';

const DeleteModal = ({ isOpen, onClose, company, onDelete, isBulk = false, selectedCount = 0, selectedIds = [] }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteType, setDeleteType] = useState('soft');
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    // Setup axios defaults
    useEffect(() => {
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.withCredentials = true;
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
    }, []);

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (deleteType === 'permanent' && confirmText !== 'DELETE') {
            alert('Please type "DELETE" in uppercase to confirm permanent deletion.');
            return;
        }

        setIsDeleting(true);
        setError('');
        
        try {
            let response;
            
            if (isBulk && selectedIds.length > 0) {
                const deletePromises = selectedIds.map(id => {
                    if (deleteType === 'permanent') {
                        console.warn('Bulk permanent delete not supported');
                        return Promise.resolve({ success: false });
                    } else {
                        return axios.delete(`/companies/${id}`);
                    }
                });
                
                const results = await Promise.all(deletePromises);
                const successCount = results.filter(r => r.data?.success).length;
                
                if (successCount > 0) {
                    response = {
                        data: {
                            success: true,
                            message: `${successCount} client${successCount > 1 ? 's' : ''} moved to trash successfully.`
                        }
                    };
                } else {
                    throw new Error('Failed to delete selected clients');
                }
            } else if (company) {
                if (deleteType === 'permanent') {
                    response = await axios.delete(`/companies/force-delete/${company.id}`);
                } else {
                    response = await axios.delete(`/companies/${company.id}`);
                }
            } else {
                throw new Error('No company selected for deletion');
            }

            if (response.data.success) {
                alert(response.data.message || 'Client deleted successfully!');
                
                if (onDelete) {
                    onDelete(deleteType);
                }
                
                router.reload({
                    only: ['companies', 'statistics'],
                    preserveScroll: true,
                });
                
                onClose();
                resetForm();
            } else {
                setError(response.data.message || 'Failed to delete client');
                alert(response.data.message || 'Failed to delete client');
            }
        } catch (error) {
            console.error('Delete error:', error);
            
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Failed to delete client. Please try again.';
            
            setError(errorMessage);
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const resetForm = () => {
        setDeleteType('soft');
        setConfirmText('');
        setError('');
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
            return `You are about to delete ${selectedCount} client${selectedCount > 1 ? 's' : ''}. This action ${deleteType === 'soft' ? 'can be restored later' : 'cannot be undone'}.`;
        }
        return `You are about to delete the client "${company?.client_code || company?.name}". This action ${deleteType === 'soft' ? 'can be restored later' : 'cannot be undone'}.`;
    };

    const getConfirmationText = () => {
        if (isBulk) {
            return `Are you sure you want to delete ${selectedCount} selected client${selectedCount > 1 ? 's' : ''}?`;
        }
        return `Are you sure you want to delete "${company?.client_code || company?.name}"?`;
    };

    const hasDataToDelete = isBulk ? selectedIds.length > 0 : company;

    if (!hasDataToDelete) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                    <div className="p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Selected</h3>
                        <p className="text-gray-600">Please select a client to delete.</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={handleClose}></div>
            
            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto relative">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{getTitle()}</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    {deleteType === 'permanent' ? '⚠️ This action is irreversible' : '🗑️ Can be restored later'}
                                </p>
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
                    <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-red-800 font-medium">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning Message */}
                        <div className={`border rounded-lg p-4 ${
                            deleteType === 'permanent' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                            <div className="flex items-start gap-3">
                                <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                    deleteType === 'permanent' ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${
                                        deleteType === 'permanent' ? 'text-red-800' : 'text-yellow-800'
                                    }`}>
                                        {getMessage()}
                                    </p>
                                    {!isBulk && company && (
                                        <div className="mt-2 space-y-1">
                                            {company.client_code && (
                                                <p className={`text-sm ${
                                                    deleteType === 'permanent' ? 'text-red-700' : 'text-yellow-700'
                                                }`}>
                                                    <span className="font-semibold">Client Code:</span>{' '}
                                                    <span className="font-mono bg-white px-1 py-0.5 rounded text-xs">
                                                        {company.client_code}
                                                    </span>
                                                </p>
                                            )}
                                            {company.email && (
                                                <p className={`text-xs ${
                                                    deleteType === 'permanent' ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                    <span className="font-semibold">Email:</span> {company.email}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {isBulk && selectedIds.length > 0 && (
                                        <p className={`text-xs mt-2 ${
                                            deleteType === 'permanent' ? 'text-red-600' : 'text-yellow-600'
                                        }`}>
                                            📋 {selectedIds.length} client{selectedIds.length > 1 ? 's' : ''} selected
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg cursor-pointer transition ${
                                    deleteType === 'soft' 
                                        ? 'border-teal-500 bg-teal-50' 
                                        : 'border-gray-300 hover:bg-gray-50'
                                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="radio"
                                        name="deleteType"
                                        value="soft"
                                        checked={deleteType === 'soft'}
                                        onChange={(e) => setDeleteType(e.target.value)}
                                        className="sr-only"
                                        disabled={isDeleting}
                                    />
                                    <div className="flex flex-col items-center text-center">
                                        <Trash2 className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 ${
                                            deleteType === 'soft' ? 'text-teal-600' : 'text-gray-400'
                                        }`} />
                                        <span className={`text-sm font-medium ${
                                            deleteType === 'soft' ? 'text-teal-700' : 'text-gray-700'
                                        }`}>
                                            Soft Delete
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">
                                            Can be restored
                                        </span>
                                    </div>
                                </label>

                                <label className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg cursor-pointer transition ${
                                    deleteType === 'permanent' 
                                        ? 'border-red-500 bg-red-50' 
                                        : 'border-gray-300 hover:bg-gray-50'
                                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="radio"
                                        name="deleteType"
                                        value="permanent"
                                        checked={deleteType === 'permanent'}
                                        onChange={(e) => setDeleteType(e.target.value)}
                                        className="sr-only"
                                        disabled={isDeleting}
                                    />
                                    <div className="flex flex-col items-center text-center">
                                        <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 ${
                                            deleteType === 'permanent' ? 'text-red-600' : 'text-gray-400'
                                        }`} />
                                        <span className={`text-sm font-medium ${
                                            deleteType === 'permanent' ? 'text-red-700' : 'text-gray-700'
                                        }`}>
                                            Permanent Delete
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">
                                            Cannot be undone
                                        </span>
                                    </div>
                                </label>
                            </div>
                            
                            {/* Info about delete types */}
                            <div className="text-xs text-gray-500 space-y-1">
                                {deleteType === 'soft' ? (
                                    <>
                                        <p>✅ <span className="font-medium">Soft Delete:</span> Client will be moved to trash and can be restored later.</p>
                                        <p>📁 Data is preserved but marked as deleted.</p>
                                    </>
                                ) : (
                                    <>
                                        <p>⚠️ <span className="font-medium">Permanent Delete:</span> All client data will be permanently removed.</p>
                                        <p>🔥 This includes: Company info, contact details, and associated files.</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Confirmation for Permanent Delete */}
                        {deleteType === 'permanent' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Info className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span className="font-medium">Type "DELETE" to confirm permanent deletion:</span>
                                </div>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                    placeholder="TYPE: DELETE"
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-center text-base sm:text-lg font-bold uppercase tracking-wider"
                                    disabled={isDeleting}
                                    autoComplete="off"
                                />
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className={`w-3 h-3 rounded-full ${confirmText === 'DELETE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span>
                                        {confirmText === 'DELETE' 
                                            ? '✅ Confirmation text matches' 
                                            : '❌ Type exactly "DELETE" in uppercase'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Confirmation Message */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                    {getConfirmationText()}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {deleteType === 'soft' 
                                        ? 'You can restore this client from the trash later if needed.'
                                        : 'This action is final and cannot be reversed.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isDeleting}
                            className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50 transition-colors rounded-lg order-2 sm:order-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting || (deleteType === 'permanent' && confirmText !== 'DELETE')}
                            className={`px-6 py-2.5 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors order-1 sm:order-2 ${
                                deleteType === 'permanent' 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }`}
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {deleteType === 'permanent' ? 'Deleting...' : 'Moving to Trash...'}
                                </>
                            ) : (
                                <>
                                    {deleteType === 'permanent' ? (
                                        <>
                                            <AlertTriangle className="w-4 h-4" />
                                            Delete Permanently
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            <span className="whitespace-nowrap">Move to Trash</span>
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;