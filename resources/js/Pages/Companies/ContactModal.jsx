// resources/js/Components/ContactModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, Star } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const ContactModal = ({ 
    isOpen, 
    onClose, 
    companyId, 
    contact = null,
    mode = 'add', // 'add' or 'edit'
    onSuccess 
}) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        is_primary: false,
        is_active: true
    });

    // Setup axios dengan CSRF token
    useEffect(() => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
        axios.defaults.headers.common['Accept'] = 'application/json';
        axios.defaults.headers.common['Content-Type'] = 'application/json';
    }, []);

    // Reset form ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            console.log('ContactModal opened:', { 
                mode, 
                contact, 
                companyId,
                isOpen 
            });
            
            setErrors({});
            setIsSubmitting(false);
            
            if (mode === 'edit' && contact) {
                console.log('Setting edit form data:', contact);
                setFormData({
                    name: contact.name || '',
                    email: contact.email || '',
                    phone: contact.phone || '',
                    position: contact.position || '',
                    is_primary: contact.is_primary || false,
                    is_active: contact.is_active !== undefined ? contact.is_active : true
                });
            } else {
                console.log('Setting add form data');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    position: '',
                    is_primary: false,
                    is_active: true
                });
            }
        }
    }, [isOpen, mode, contact, companyId]);

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        const newValue = type === 'checkbox' ? checked : value;
        
        console.log(`Input change: ${name} = ${newValue}`);
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        
        // Clear error
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Validate form
    const validateForm = () => {
        console.log('Validating form data:', formData);
        
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = t('contact_modal.validation_name_required');
        }
        
        if (!formData.email.trim()) {
            newErrors.email = t('contact_modal.validation_email_required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('contact_modal.validation_email_invalid');
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = t('contact_modal.validation_phone_required');
        }
        
        console.log('Validation errors:', newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('=== FORM SUBMIT STARTED ===');
        console.log('Mode:', mode);
        console.log('Company ID:', companyId);
        console.log('Form Data:', formData);
        
        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        
        try {
            const endpoint = `/companies/${companyId}/contacts`;
            console.log('API Endpoint:', endpoint);
            
            // Prepare data - PERUBAHAN: Di mode edit, JANGAN kirim is_primary
            const requestData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                position: formData.position.trim(),
                is_active: Boolean(formData.is_active)
            };
            
            // Hanya kirim is_primary jika mode add
            if (mode === 'add') {
                requestData.is_primary = Boolean(formData.is_primary);
            }
            
            console.log('Request Data:', requestData);
            
            let response;
            
            if (mode === 'edit' && contact) {
                const editEndpoint = `${endpoint}/${contact.id}`;
                console.log('PUT request to:', editEndpoint);
                response = await axios.put(editEndpoint, requestData);
            } else {
                console.log('POST request to:', endpoint);
                response = await axios.post(endpoint, requestData);
            }
            
            console.log('Server Response:', response);
            console.log('Response Data:', response.data);
            
            if (response.data.success) {
                console.log('Success! Data:', response.data.data);
                
                if (onSuccess) {
                    onSuccess(response.data.data, mode);
                }
                
                onClose();
            } else {
                console.error('Server returned error:', response.data);
                setErrors(response.data.errors || {});
                if (response.data.message) {
                    setErrors(prev => ({ ...prev, submit: response.data.message }));
                }
            }
        } catch (error) {
            console.error('=== ERROR SAVING CONTACT ===');
            console.error('Error object:', error);
            console.error('Error message:', error.message);
            
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                
                if (error.response.status === 422) {
                    setErrors(error.response.data.errors || {});
                } else if (error.response.status === 404) {
                    setErrors({ submit: t('contact_modal.error_route_not_found') });
                } else if (error.response.status === 500) {
                    setErrors({ submit: t('contact_modal.error_server_error', { message: error.response.data.message || 'Internal server error' }) });
                } else {
                    setErrors({ submit: error.response.data?.message || t('contact_modal.error_save_failed') });
                }
            } else if (error.request) {
                console.error('No response received:', error.request);
                setErrors({ submit: t('contact_modal.error_no_response') });
            } else {
                console.error('Error setting up request:', error.message);
                setErrors({ submit: t('contact_modal.error_request_setup', { message: error.message }) });
            }
        } finally {
            setIsSubmitting(false);
            console.log('=== FORM SUBMIT COMPLETED ===');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b z-10">
                    <div className="flex justify-between items-center p-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {mode === 'edit' ? t('contact_modal.edit_title') : t('contact_modal.add_title')}
                            </h2>
                            <p className="text-gray-600 mt-1 text-sm">
                                {mode === 'edit' ? t('contact_modal.edit_subtitle') : t('contact_modal.add_subtitle')}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('contact_modal.full_name')} *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
                                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    placeholder={t('contact_modal.name_placeholder')}
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('contact_modal.email_address')} *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
                                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    placeholder={t('contact_modal.email_placeholder')}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('contact_modal.phone_number')} *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
                                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    placeholder={t('contact_modal.phone_placeholder')}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('contact_modal.position_role')}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors hover:border-gray-400"
                                    placeholder={t('contact_modal.position_placeholder')}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {t('contact_modal.position_optional')}
                            </p>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-4">
                            {/* Hanya tampilkan "Set as primary" di mode ADD */}
                            {mode === 'add' && (
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="is_primary"
                                        name="is_primary"
                                        checked={formData.is_primary}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                        disabled={isSubmitting}
                                    />
                                    <label htmlFor="is_primary" className="ml-3 flex items-center text-sm text-gray-700">
                                        <Star className="w-4 h-4 text-yellow-500 mr-2" />
                                        <div>
                                            <span className="font-medium">
                                                {t('contact_modal.set_as_primary')}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {t('contact_modal.primary_warning')}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Tampilkan status contact (Active/Inactive) */}
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="is_active" className="ml-3 flex items-center text-sm text-gray-700">
                                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                                        <div className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            {t('contact_modal.active_contact')}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {t('contact_modal.active_description')}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Debug Info (only in development) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-1">
                                    {t('contact_modal.debug_info')}:
                                </p>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>{t('contact_modal.mode')}: {mode}</p>
                                    <p>{t('contact_modal.company_id')}: {companyId}</p>
                                    <p>{t('contact_modal.contact_id')}: {contact?.id || 'N/A'}</p>
                                    <p>{t('contact_modal.is_primary')}: {formData.is_primary.toString()}</p>
                                    <p>{t('contact_modal.is_active')}: {formData.is_active.toString()}</p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            {t('contact_modal.error_title')}
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{errors.submit}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Validation Errors Summary */}
                        {Object.keys(errors).filter(key => key !== 'submit').length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            {t('contact_modal.check_fields')}
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <ul className="list-disc pl-5 space-y-1">
                                                {errors.name && <li>{t('contact_modal.validation_name_required')}</li>}
                                                {errors.email && <li>{errors.email}</li>}
                                                {errors.phone && <li>{t('contact_modal.validation_phone_required')}</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('contact_modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2.5 font-medium rounded-lg flex items-center gap-2 transition-all ${
                                isSubmitting
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {mode === 'edit' ? t('contact_modal.updating') : t('contact_modal.adding')}
                                </>
                            ) : (
                                <>
                                    {mode === 'edit' ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                            {t('contact_modal.update_contact')}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                            </svg>
                                            {t('contact_modal.add_contact')}
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactModal;