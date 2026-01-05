// resources/js/Components/Companies/DeleteModal.jsx
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, ShieldAlert, Info, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const DeleteModal = ({ isOpen, onClose, company, onDelete, isBulk = false, selectedCount = 0, selectedIds = [] }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const [isDeleting, setIsDeleting] = useState(false);
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
        setIsDeleting(true);
        setError('');
        
        try {
            let response;
            
            if (isBulk && selectedIds.length > 0) {
                const deletePromises = selectedIds.map(id => axios.delete(`/companies/${id}`));
                
                const results = await Promise.all(deletePromises);
                const successCount = results.filter(r => r.data?.success).length;
                
                if (successCount > 0) {
                    response = {
                        data: {
                            success: true,
                            message: t('companies_delete.bulk_delete_success', { count: successCount })
                        }
                    };
                } else {
                    throw new Error(t('companies_delete.bulk_delete_failed'));
                }
            } else if (company) {
                response = await axios.delete(`/companies/${company.id}`);
            } else {
                throw new Error(t('companies_delete.no_company_selected'));
            }

            if (response.data.success) {
                alert(response.data.message || t('companies_delete.delete_success'));
                
                if (onDelete) {
                    onDelete();
                }
                
                router.reload({
                    only: ['companies', 'statistics'],
                    preserveScroll: true,
                });
                
                onClose();
                resetForm();
            } else {
                setError(response.data.message || t('companies_delete.delete_failed'));
                alert(response.data.message || t('companies_delete.delete_failed'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               t('companies_delete.delete_error_try_again');
            
            setError(errorMessage);
            alert(`${t('companies_delete.error')}: ${errorMessage}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const resetForm = () => {
        setConfirmText('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const getTitle = () => {
        if (isBulk) {
            return t('companies_delete.bulk_delete_title', { count: selectedCount });
        }
        return t('companies_delete.delete_client');
    };

    const getMessage = () => {
        if (isBulk) {
            return t('companies_delete.bulk_delete_message', { count: selectedCount });
        }
        return t('companies_delete.delete_message', { name: company?.client_code || company?.name });
    };

    const getConfirmationText = () => {
        if (isBulk) {
            return t('companies_delete.bulk_confirmation', { count: selectedCount });
        }
        return t('companies_delete.confirmation', { name: company?.client_code || company?.name });
    };

    const hasDataToDelete = isBulk ? selectedIds.length > 0 : company;

    if (!hasDataToDelete) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                    <div className="p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('companies_delete.no_data_selected')}
                        </h3>
                        <p className="text-gray-600">
                            {t('companies_delete.select_client_to_delete')}
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                        >
                            {t('companies_delete.close')}
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
                                    {t('companies_delete.can_be_restored')}
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
                        <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-yellow-800">
                                        {getMessage()}
                                    </p>
                                    {!isBulk && company && (
                                        <div className="mt-2 space-y-1">
                                            {company.client_code && (
                                                <p className="text-sm text-yellow-700">
                                                    <span className="font-semibold">{t('companies_delete.client_code')}:</span>{' '}
                                                    <span className="font-mono bg-white px-1 py-0.5 rounded text-xs">
                                                        {company.client_code}
                                                    </span>
                                                </p>
                                            )}
                                            {company.email && (
                                                <p className="text-xs text-yellow-600">
                                                    <span className="font-semibold">{t('companies_delete.email')}:</span> {company.email}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {isBulk && selectedIds.length > 0 && (
                                        <p className="text-xs mt-2 text-yellow-600">
                                            📋 {selectedIds.length} {t('companies_delete.clients_selected')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Confirmation for Delete */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Info className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="font-medium">
                                    {t('companies_delete.type_to_confirm')}:
                                </span>
                            </div>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                placeholder={t('companies_delete.type_placeholder').toUpperCase()}
                                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-center text-base sm:text-lg font-bold uppercase tracking-wider"
                                disabled={isDeleting}
                                autoComplete="off"
                            />
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className={`w-3 h-3 rounded-full ${confirmText === 'DELETE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>
                                    {confirmText === 'DELETE' 
                                        ? t('companies_delete.confirmation_matches') 
                                        : t('companies_delete.type_exactly')}
                                </span>
                            </div>
                        </div>

                        {/* Confirmation Message */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                    {getConfirmationText()}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t('companies_delete.can_be_restored_later')}
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
                            {t('companies_delete.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting || confirmText !== 'DELETE'}
                            className={`px-6 py-2.5 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors order-1 sm:order-2 bg-red-600 hover:bg-red-700 text-white`}
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {t('companies_delete.deleting')}
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    {t('companies_delete.delete_button')}
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